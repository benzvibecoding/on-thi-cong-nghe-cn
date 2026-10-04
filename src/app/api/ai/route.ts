import { NextRequest, NextResponse } from "next/server";
import { getEnv, isAiEnabled } from "@/lib/env";
import { RateLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import {
  AI_UNAVAILABLE,
  aiCacheKey,
  aiRequestSchema,
  buildExplainPrompt,
} from "@/domain/ai";

function reportId(): string {
  return crypto.randomUUID();
}

// ~20 requests / IP / day (community-measured free-tier figure, unofficial).
const limiter = new RateLimiter(20, 24 * 60 * 60 * 1000);
// Ephemeral per-instance cache. Serverless instances do not share it —
// acceptable because the static explanation remains the source of truth.
const cache = new Map<string, string>();

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

async function callGemini(prompt: string, timeoutMs = 15000): Promise<string> {
  const { GEMINI_API_KEY, GEMINI_MODEL } = getEnv();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL!)!}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY!)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 300, temperature: 0.3 },
        }),
        signal: controller.signal,
      }
    );
    if (res.status === 429) throw new Error("quota");
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!text.trim()) throw new Error("empty");
    return text.trim().slice(0, 1500);
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req: NextRequest) {
  const requestId = reportId();
  if (!isAiEnabled()) {
    return NextResponse.json({ error: AI_UNAVAILABLE, code: "E199", ai: false }, { status: 503 });
  }
  if (!limiter.allow(clientIp(req))) {
    logger.warn("ai rate limited", { module: "api/ai", requestId });
    return NextResponse.json({ error: AI_UNAVAILABLE, code: "E199", ai: false }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không đúng.", code: "E103" }, { status: 400 });
  }
  const parsed = aiRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu gửi lên không đúng.", code: "E103" }, { status: 400 });
  }
  const key = aiCacheKey(parsed.data);
  const hit = cache.get(key);
  if (hit) return NextResponse.json({ text: hit, cached: true, ai: true });
  try {
    const text = await callGemini(buildExplainPrompt(parsed.data));
    cache.set(key, text);
    logger.info("ai answered", {
      module: "api/ai",
      requestId,
      questionId: parsed.data.questionId,
      mode: parsed.data.mode,
    });
    return NextResponse.json({ text, cached: false, ai: true });
  } catch (err) {
    logger.warn("ai upstream failed", { module: "api/ai", requestId, reason: String(err) });
    return NextResponse.json({ error: AI_UNAVAILABLE, code: "E199", ai: false }, { status: 502 });
  }
}
