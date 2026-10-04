import type { Question, QuestionLevel, QuestionType } from "./question-schema";

export type StatusFilter = "all" | "unseen" | "wrong" | "bookmarked";

export interface PracticeFilter {
  topicId: string | "all";
  levels: QuestionLevel[];
  types: QuestionType[];
  /** Include draft questions (shown with badge). Reviewed/published always included. */
  includeDraft: boolean;
  count: number;
  status: StatusFilter;
}

export const DEFAULT_FILTER: PracticeFilter = {
  topicId: "all",
  levels: ["nb", "th", "vd"],
  types: ["mcq", "tf4"],
  includeDraft: true,
  count: 10,
  status: "all",
};

/** Deterministic PRNG (mulberry32) so a set can be reproduced from a seed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleArray<T>(items: T[], seed: number): T[] {
  const rand = mulberry32(seed);
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export interface FilterContext {
  answeredIds?: Set<string>;
  wrongIds?: Set<string>;
  bookmarkedIds?: Set<string>;
}

export function filterQuestions(
  questions: Question[],
  filter: PracticeFilter,
  ctx: FilterContext = {}
): Question[] {
  return questions.filter((q) => {
    if (filter.topicId !== "all" && q.topicId !== filter.topicId) return false;
    if (!filter.levels.includes(q.level)) return false;
    if (!filter.types.includes(q.type)) return false;
    if (!filter.includeDraft && q.status === "draft") return false;
    switch (filter.status) {
      case "unseen":
        if (ctx.answeredIds?.has(q.id)) return false;
        break;
      case "wrong":
        if (!ctx.wrongIds?.has(q.id)) return false;
        break;
      case "bookmarked":
        if (!ctx.bookmarkedIds?.has(q.id)) return false;
        break;
      case "all":
        break;
    }
    return true;
  });
}

/** Build a no-repeat practice set. Returns at most `count` questions. */
export function buildPracticeSet(
  questions: Question[],
  filter: PracticeFilter,
  seed: number = Date.now(),
  ctx: FilterContext = {}
): { set: Question[]; seed: number; available: number } {
  const pool = filterQuestions(questions, filter, ctx);
  const count = Math.max(1, Math.min(filter.count, pool.length));
  return { set: shuffleArray(pool, seed).slice(0, count), seed, available: pool.length };
}

export type McqAnswer = "A" | "B" | "C" | "D" | null;
export type Tf4Answer = Array<boolean | null>; // per statement a-d

export function gradeMcq(q: Question, answer: McqAnswer): boolean {
  if (answer === null || q.type !== "mcq" || !q.mcq) return false;
  return answer === q.mcq.correct;
}

export interface Tf4Grade {
  perStatement: boolean[];
  allCorrect: boolean;
  correctCount: number;
}

export function gradeTf4(q: Question, answer: Tf4Answer): Tf4Grade {
  const empty: Tf4Grade = { perStatement: [false, false, false, false], allCorrect: false, correctCount: 0 };
  if (q.type !== "tf4" || !q.tf4 || answer.length !== 4) return empty;
  const perStatement = q.tf4.statements.map((s, i) => answer[i] !== null && answer[i] === s.isTrue);
  const correctCount = perStatement.filter(Boolean).length;
  return { perStatement, allCorrect: correctCount === 4, correctCount };
}

export interface PracticeEventInput {
  questionId: string;
  topicId: string;
  level: QuestionLevel;
  qtype: QuestionType;
  correct: boolean;
  /** Correct statements (mcq 0/1, tf4 0-4). */
  correctCount: number;
  durationMs: number;
}

export interface TopicSummary {
  topicId: string;
  total: number;
  correct: number;
  accuracy: number;
}

/** Aggregate events into per-topic accuracy (groundwork for M6 mastery). */
export function summarizeEvents(events: PracticeEventInput[]): TopicSummary[] {
  const map = new Map<string, { total: number; correct: number }>();
  for (const e of events) {
    const cur = map.get(e.topicId) ?? { total: 0, correct: 0 };
    cur.total += 1;
    if (e.correct) cur.correct += 1;
    map.set(e.topicId, cur);
  }
  return [...map.entries()].map(([topicId, v]) => ({
    topicId,
    total: v.total,
    correct: v.correct,
    accuracy: v.total === 0 ? 0 : v.correct / v.total,
  }));
}
