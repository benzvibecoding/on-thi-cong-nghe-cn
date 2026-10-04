import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseForToken } from "@/lib/supabase";
import { isCloudEnabled } from "@/lib/env";
import { RateLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

function reportId(): string {
  return crypto.randomUUID();
}

const reportSchema = z.object({
  questionId: z.string().min(1).max(100),
  questionVersion: z.number().int().min(1),
  category: z.string().min(1).max(50),
  detail: z.string().min(1).max(1000),
});

const limiter = new RateLimiter(10, 60 * 60 * 1000); // 10 reports / IP / hour

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(req: NextRequest) {
  const requestId = reportId();
  if (!isCloudEnabled()) {
    return NextResponse.json(
      { error: "Báo lỗi trực tuyến chưa bật. Câu hỏi đã lưu trên thiết bị.", code: "E199" },
      { status: 503 }
    );
  }
  if (!limiter.allow(clientIp(req))) {
    logger.warn("reports rate limited", { module: "api/reports", requestId });
    return NextResponse.json(
      { error: "Bạn gửi quá nhiều báo lỗi. Hãy thử lại sau một giờ.", code: "E199" },
      { status: 429 }
    );
  }
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    return NextResponse.json(
      { error: "Cần đăng nhập để gửi báo lỗi trực tuyến.", code: "E199" },
      { status: 401 }
    );
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không đúng.", code: "E103" }, { status: 400 });
  }
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu gửi lên không đúng.", code: "E103" }, { status: 400 });
  }
  const client = getSupabaseForToken(token);
  if (!client) {
    return NextResponse.json({ error: "Báo lỗi trực tuyến chưa bật.", code: "E199" }, { status: 503 });
  }
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Phiên đăng nhập hết hạn.", code: "E199" }, { status: 401 });
  }
  const { error } = await client.from("reports").insert({
    id: reportId(),
    user_id: userData.user.id,
    question_id: parsed.data.questionId,
    question_version: parsed.data.questionVersion,
    category: parsed.data.category,
    detail: parsed.data.detail,
  });
  if (error) {
    logger.error("reports insert failed", { module: "api/reports", requestId });
    return NextResponse.json({ error: "Không gửi được báo lỗi.", code: "E199" }, { status: 500 });
  }
  logger.info("report received", {
    module: "api/reports",
    requestId,
    questionId: parsed.data.questionId,
  });
  return NextResponse.json({ ok: true });
}
