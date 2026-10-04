import { getDb, type ExamSessionRow } from "./db";
import type { ExamScore } from "@/domain/scoring";
import { AppError, ERROR_CODES, userMessage } from "@/lib/errors";

function storageError(err: unknown): AppError {
  return new AppError(
    ERROR_CODES.STORAGE_FAILED,
    userMessage(ERROR_CODES.STORAGE_FAILED),
    String(err)
  );
}

export async function saveExamSession(row: ExamSessionRow): Promise<void> {
  try {
    await getDb().examSessions.put({ ...row, updatedAt: Date.now() });
  } catch (err) {
    throw storageError(err);
  }
}

export async function loadExamSession(id: string): Promise<ExamSessionRow | undefined> {
  try {
    return await getDb().examSessions.get(id);
  } catch (err) {
    throw storageError(err);
  }
}

export async function deleteExamSession(id: string): Promise<void> {
  try {
    await getDb().examSessions.delete(id);
  } catch (err) {
    throw storageError(err);
  }
}

export interface SubmittedScore {
  totalPoints: number;
  part1Points: number;
  part2Points: number;
}

export function summarizeScore(score: ExamScore): SubmittedScore {
  return {
    totalPoints: score.totalPoints,
    part1Points: score.part1Points,
    part2Points: score.part2Points,
  };
}
