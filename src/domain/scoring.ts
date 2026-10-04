import { EXAM_CONFIG } from "./exam-config";
import type { McqAnswer, Tf4Answer } from "./practice";
import { gradeMcq, gradeTf4 } from "./practice";
import type { Question } from "./question-schema";

export interface ExamAnswers {
  mcq: Record<string, McqAnswer>;
  tf4: Record<string, Tf4Answer>;
}

export interface QuestionScore {
  questionId: string;
  type: "mcq" | "tf4";
  /** For tf4: number of correctly judged statements (0-4). */
  correctCount: number;
  points: number;
  maxPoints: number;
}

export interface ExamScore {
  scores: QuestionScore[];
  part1Points: number;
  part2Points: number;
  totalPoints: number;
  correctMcq: number;
  /** TF4 questions fully correct (4/4). */
  fullyCorrectTf4: number;
}

/** Round to 2 decimals (display + accumulation safe). */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Points for one TF4 question given correctly judged statements (0-4). */
export function tf4Points(correctCount: number): number {
  const table = EXAM_CONFIG.part2.pointsByCorrectCount;
  return table[Math.max(0, Math.min(4, correctCount))] ?? 0;
}

export function scoreQuestion(q: Question, answers: ExamAnswers): QuestionScore {
  if (q.type === "mcq") {
    const correct = gradeMcq(q, answers.mcq[q.id] ?? null);
    const points = correct ? EXAM_CONFIG.part1.pointsPerQuestion : 0;
    return {
      questionId: q.id,
      type: "mcq",
      correctCount: correct ? 1 : 0,
      points: round2(points),
      maxPoints: EXAM_CONFIG.part1.pointsPerQuestion,
    };
  }
  const grade = gradeTf4(q, answers.tf4[q.id] ?? [null, null, null, null]);
  const points = tf4Points(grade.correctCount);
  return {
    questionId: q.id,
    type: "tf4",
    correctCount: grade.correctCount,
    points: round2(points),
    maxPoints: EXAM_CONFIG.part2.pointsByCorrectCount[4]!,
  };
}

/** Grade a whole paper. Works for full (24+4) and shortened papers alike. */
export function scoreExam(questions: Question[], answers: ExamAnswers): ExamScore {
  const scores = questions.map((q) => scoreQuestion(q, answers));
  const part1 = scores.filter((s) => s.type === "mcq");
  const part2 = scores.filter((s) => s.type === "tf4");
  return {
    scores,
    part1Points: round2(part1.reduce((sum, s) => sum + s.points, 0)),
    part2Points: round2(part2.reduce((sum, s) => sum + s.points, 0)),
    totalPoints: round2(scores.reduce((sum, s) => sum + s.points, 0)),
    correctMcq: part1.filter((s) => s.correctCount === 1).length,
    fullyCorrectTf4: part2.filter((s) => s.correctCount === 4).length,
  };
}
