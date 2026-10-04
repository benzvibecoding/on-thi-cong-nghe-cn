import { getDb, newId, type PracticeEventRow, type ReportRow } from "./db";
import type { PracticeEventInput } from "@/domain/practice";
import { AppError, ERROR_CODES, userMessage } from "@/lib/errors";

function storageError(err: unknown): AppError {
  return new AppError(
    ERROR_CODES.STORAGE_FAILED,
    userMessage(ERROR_CODES.STORAGE_FAILED),
    String(err)
  );
}

export async function isBookmarked(questionId: string): Promise<boolean> {
  try {
    return (await getDb().bookmarks.get(questionId)) !== undefined;
  } catch (err) {
    throw storageError(err);
  }
}

export async function toggleBookmark(questionId: string, topicId: string): Promise<boolean> {
  try {
    const db = getDb();
    const existing = await db.bookmarks.get(questionId);
    if (existing) {
      await db.bookmarks.delete(questionId);
      return false;
    }
    await db.bookmarks.put({ questionId, topicId, createdAt: Date.now() });
    return true;
  } catch (err) {
    throw storageError(err);
  }
}

export async function getNote(questionId: string): Promise<string> {
  try {
    return (await getDb().notes.get(questionId))?.text ?? "";
  } catch (err) {
    throw storageError(err);
  }
}

export async function saveNote(questionId: string, text: string): Promise<void> {
  try {
    const trimmed = text.slice(0, 2000);
    if (trimmed === "") {
      await getDb().notes.delete(questionId);
      return;
    }
    await getDb().notes.put({ questionId, text: trimmed, updatedAt: Date.now() });
  } catch (err) {
    throw storageError(err);
  }
}

export async function getPracticeEvents(): Promise<PracticeEventRow[]> {
  try {
    return await getDb().practiceEvents.orderBy("createdAt").toArray();
  } catch (err) {
    throw storageError(err);
  }
}

export async function recordPracticeEvent(event: PracticeEventInput): Promise<void> {
  try {
    await getDb().practiceEvents.put({ ...event, id: newId(), createdAt: Date.now() });
  } catch (err) {
    throw storageError(err);
  }
}

export async function saveReport(input: {
  questionId: string;
  questionVersion: number;
  category: string;
  detail: string;
}): Promise<ReportRow> {
  try {
    const row: ReportRow = {
      id: newId(),
      questionId: input.questionId,
      questionVersion: input.questionVersion,
      category: input.category.slice(0, 50),
      detail: input.detail.slice(0, 1000),
      createdAt: Date.now(),
    };
    await getDb().reports.put(row);
    return row;
  } catch (err) {
    throw storageError(err);
  }
}

/** Pre-filled text so users can send a report manually when there is no backend. */
export function reportShareText(input: {
  questionId: string;
  questionVersion: number;
  category: string;
  detail: string;
}): string {
  return `[Báo lỗi câu hỏi]\nMã câu: ${input.questionId} (v${input.questionVersion})\nLoại: ${input.category}\nChi tiết: ${input.detail}`;
}

export async function getSrsStates(): Promise<
  Map<string, import("@/domain/srs").SrsState>
> {
  try {
    const rows = await getDb().srsStates.toArray();
    const map = new Map<string, import("@/domain/srs").SrsState>();
    for (const r of rows) {
      map.set(r.cardId, {
        dueISO: r.due,
        stability: r.stability,
        difficulty: r.difficulty,
        scheduledDays: r.scheduledDays,
        reps: r.reps,
        lapses: r.lapses,
        state: r.state,
      });
    }
    return map;
  } catch (err) {
    throw storageError(err);
  }
}

export async function saveSrsState(
  cardId: string,
  state: import("@/domain/srs").SrsState
): Promise<void> {
  try {
    await getDb().srsStates.put({
      cardId,
      due: state.dueISO,
      stability: state.stability,
      difficulty: state.difficulty,
      scheduledDays: state.scheduledDays,
      reps: state.reps,
      lapses: state.lapses,
      state: state.state,
      updatedAt: Date.now(),
    });
  } catch (err) {
    throw storageError(err);
  }
}
