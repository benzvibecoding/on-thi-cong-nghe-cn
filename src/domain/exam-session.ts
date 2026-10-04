import { EXAM_CONFIG } from "./exam-config";
import type { ExamAnswers } from "./scoring";
import type { McqAnswer, Tf4Answer } from "./practice";
import type { Question } from "./question-schema";

export type ExamMode = "paper" | "computer";

export interface ExamSessionSnapshot {
  answers: ExamAnswers;
  flags: string[];
  durationsMs: Record<string, number>;
}

/** Count questions with no answer yet. */
export function countUnanswered(questions: Question[], answers: ExamAnswers): number {
  return questions.filter((q) => {
    if (q.type === "mcq") return (answers.mcq[q.id] ?? null) === null;
    const a = answers.tf4[q.id] ?? [null, null, null, null];
    return a.some((v) => v === null);
  }).length;
}

/** Milliseconds left given an absolute end time. Never negative. */
export function msRemaining(endsAt: number, now: number = Date.now()): number {
  return Math.max(0, endsAt - now);
}

export function formatRemaining(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function emptyAnswers(): ExamAnswers {
  return { mcq: {}, tf4: {} };
}

export function emptyTf4(): Tf4Answer {
  return [null, null, null, null];
}

export function isMcqComplete(q: Question, answers: ExamAnswers): boolean {
  return q.type === "mcq" && (answers.mcq[q.id] ?? null) !== null;
}

export function isTf4Complete(q: Question, answers: ExamAnswers): boolean {
  if (q.type !== "tf4") return false;
  return (answers.tf4[q.id] ?? emptyTf4()).every((v) => v !== null);
}

/** Absolute end time for a new session. */
export function computeEndsAt(startedAt: number): number {
  return startedAt + EXAM_CONFIG.totalMinutes * 60 * 1000;
}

export type { McqAnswer };
