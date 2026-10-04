import { AppError, ERROR_CODES, userMessage } from "@/lib/errors";
import type { PacksManifest, TopicPack } from "@/domain/taxonomy";
import { flashcardSchema } from "@/domain/flashcards";
import { questionSchema } from "@/domain/question-schema";

const manifestCache: { data: PacksManifest | null } = { data: null };
const packCache = new Map<string, TopicPack>();

async function fetchJson(url: string, timeoutMs = 8000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new AppError(ERROR_CODES.PACK_NOT_FOUND, `Không tải được gói nội dung (${res.status}).`);
    }
    return await res.json();
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new AppError(ERROR_CODES.NETWORK_FAILED, "Tải nội dung quá lâu, hãy thử lại.");
    }
    throw new AppError(ERROR_CODES.CONTENT_LOAD_FAILED, userMessage(ERROR_CODES.CONTENT_LOAD_FAILED), String(err));
  } finally {
    clearTimeout(timer);
  }
}

/** Load packs manifest (cached in memory). */
export async function loadManifest(): Promise<PacksManifest> {
  if (manifestCache.data) return manifestCache.data;
  const data = (await fetchJson("/packs/manifest.json")) as PacksManifest;
  manifestCache.data = data;
  return data;
}

/** Load one topic pack, validating every question against the Zod schema. */
export async function loadTopicPack(topicId: string): Promise<TopicPack> {
  const hit = packCache.get(topicId);
  if (hit) return hit;
  if (!/^[a-z0-9-]+$/.test(topicId)) {
    throw new AppError(ERROR_CODES.INVALID_INPUT, "Mã chủ đề không hợp lệ.");
  }
  const raw = (await fetchJson(`/packs/${topicId}.json`)) as TopicPack;
  const questions = (raw.questions ?? []).map((q, i) => {
    const parsed = questionSchema.safeParse(q);
    if (!parsed.success) {
      throw new AppError(
        ERROR_CODES.CONTENT_LOAD_FAILED,
        `Gói '${topicId}' có câu hỏi lỗi (vị trí ${i}).`,
        parsed.error.message
      );
    }
    return parsed.data;
  });
  const flashcards = (raw.flashcards ?? []).map((c, i) => {
    const parsed = flashcardSchema.safeParse(c);
    if (!parsed.success) {
      throw new AppError(
        ERROR_CODES.CONTENT_LOAD_FAILED,
        `Gói '${topicId}' có thẻ ghi nhớ lỗi (vị trí ${i}).`,
        parsed.error.message
      );
    }
    return parsed.data;
  });
  const pack: TopicPack = { ...raw, questions, flashcards };
  packCache.set(topicId, pack);
  return pack;
}

export function clearContentCache(): void {
  manifestCache.data = null;
  packCache.clear();
}
