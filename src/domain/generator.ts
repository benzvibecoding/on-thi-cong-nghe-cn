import { planQuotas } from "./blueprint";
import { shuffleArray } from "./practice";
import { isExamEligible, type Question } from "./question-schema";

/** Performance history used to prioritize unseen / previously wrong questions. */
export interface QuestionHistory {
  attempts: number;
  lastCorrect: boolean | null;
}

export interface Shortage {
  type: "mcq" | "tf4";
  level: "nb" | "th" | "vd";
  need: number;
  have: number;
}

export interface GeneratedPaper {
  questions: Question[];
  seed: number;
  /** Empty when the bank covers the whole blueprint. Never padded. */
  shortages: Shortage[];
  full: boolean;
}

function priority(q: Question, history: Map<string, QuestionHistory>): number {
  const h = history.get(q.id);
  if (!h || h.attempts === 0) return 0; // unseen first
  if (h.lastCorrect === false) return 1; // then previously wrong
  return 2; // then the rest
}

/**
 * Build a paper from EXAM-ELIGIBLE questions only (reviewed/published).
 * Short bank => report shortages, NEVER pad with ineligible questions.
 */
export function generateExam(
  bank: Question[],
  history: Map<string, QuestionHistory> = new Map(),
  seed: number = Date.now() % 2147483647
): GeneratedPaper {
  const eligible = bank.filter(isExamEligible);
  const picked: Question[] = [];
  const used = new Set<string>();
  const shortages: Shortage[] = [];

  for (const quota of planQuotas()) {
    const pool = eligible.filter(
      (q) => q.type === quota.type && q.level === quota.level && !used.has(q.id)
    );
    // Shuffle, then stable-sort by priority band: unseen first, then
    // previously wrong, then the rest — order varies by seed within bands.
    const shuffled = shuffleArray(pool, seed + picked.length).sort(
      (a, b) => priority(a, history) - priority(b, history)
    );
    const take = shuffled.slice(0, quota.need);
    for (const q of take) {
      used.add(q.id);
      picked.push(q);
    }
    if (take.length < quota.need) {
      shortages.push({ type: quota.type, level: quota.level, need: quota.need, have: take.length });
    }
  }

  // Part I first (sorted by level nb->th->vd), then Part II — stable exam layout.
  const order = { nb: 0, th: 1, vd: 2 };
  picked.sort((a, b) => {
    if (a.type !== b.type) return a.type === "mcq" ? -1 : 1;
    return order[a.level] - order[b.level];
  });

  return { questions: picked, seed, shortages, full: shortages.length === 0 };
}
