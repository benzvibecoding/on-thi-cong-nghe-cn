import { getDb } from "./db";
import { loadTopicPack } from "./content-loader";
import type { Question } from "@/domain/question-schema";
import { AppError } from "@/lib/errors";

export interface WrongItem {
  question: Question;
  wrongCount: number;
  lastWrongAt: number;
}

/**
 * Sổ câu sai: các câu mà lần làm gần nhất (luyện tập) trả lời sai.
 * resolving content lazily per topic; failures surface as AppError.
 */
export async function getWrongBook(limit = 50): Promise<WrongItem[]> {
  let events;
  try {
    events = await getDb().practiceEvents.orderBy("createdAt").toArray();
  } catch (err) {
    throw new AppError(
      (err as AppError).code ?? "E104",
      err instanceof AppError ? err.message : "Không đọc được dữ liệu luyện tập."
    );
  }
  const lastByQuestion = new Map<string, { correct: boolean; at: number; topicId: string }>();
  const wrongCounts = new Map<string, number>();
  for (const e of events) {
    lastByQuestion.set(e.questionId, { correct: e.correct, at: e.createdAt, topicId: e.topicId });
    if (!e.correct) wrongCounts.set(e.questionId, (wrongCounts.get(e.questionId) ?? 0) + 1);
  }
  const wrong = [...lastByQuestion.entries()].filter(([, v]) => !v.correct);
  if (wrong.length === 0) return [];

  const byTopic = new Map<string, string[]>();
  for (const [qid, v] of wrong) {
    if (!byTopic.has(v.topicId)) byTopic.set(v.topicId, []);
    byTopic.get(v.topicId)!.push(qid);
  }
  const packs = await Promise.all([...byTopic.keys()].map((t) => loadTopicPack(t)));
  const questionById = new Map<string, Question>();
  for (const p of packs) {
    for (const q of p.questions) questionById.set(q.id, q);
  }
  return wrong
    .map(([qid, v]) => {
      const question = questionById.get(qid);
      if (!question) return null;
      return {
        question,
        wrongCount: wrongCounts.get(qid) ?? 1,
        lastWrongAt: v.at,
      } satisfies WrongItem;
    })
    .filter((x): x is WrongItem => x !== null)
    .sort((a, b) => b.lastWrongAt - a.lastWrongAt)
    .slice(0, Math.max(1, limit));
}
