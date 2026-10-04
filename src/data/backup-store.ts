import { getDb } from "./db";
import {
  createBackup,
  verifyBackup,
  type BackupPayload,
  type BackupSettings,
  type BackupStores,
} from "@/domain/backup";
import { AppError, ERROR_CODES, userMessage } from "@/lib/errors";

export async function collectBackup(settings: BackupSettings): Promise<BackupPayload> {
  try {
    const db = getDb();
    const [bookmarks, notes, practiceEvents, reports, examSessions, srsStates] =
      await Promise.all([
        db.bookmarks.toArray(),
        db.notes.toArray(),
        db.practiceEvents.toArray(),
        db.reports.toArray(),
        db.examSessions.toArray(),
        db.srsStates.toArray(),
      ]);
    const stores: BackupStores = { bookmarks, notes, practiceEvents, reports, examSessions, srsStates };
    return createBackup(stores, settings);
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(ERROR_CODES.STORAGE_FAILED, userMessage(ERROR_CODES.STORAGE_FAILED), String(err));
  }
}

export interface RestoreCounts {
  bookmarks: number;
  notes: number;
  practiceEvents: number;
  reports: number;
  examSessions: number;
  srsStates: number;
}

/** Replace all local data with the backup (after user confirmation in UI). */
export async function restoreBackup(payload: BackupPayload): Promise<RestoreCounts> {
  const db = getDb();
  const counts: RestoreCounts = {
    bookmarks: 0, notes: 0, practiceEvents: 0, reports: 0, examSessions: 0, srsStates: 0,
  };
  try {
    // Sequential per-table replaces (each op atomic). A crash mid-restore
    // could leave partial data — re-import the same file to finish.
    const put = async (table: "bookmarks" | "notes" | "practiceEvents" | "reports" | "examSessions" | "srsStates", rows: unknown[]) => {
      await db.table(table).clear();
      if (rows.length > 0) await db.table(table).bulkPut(rows);
    };
    await put("bookmarks", payload.stores.bookmarks);
    await put("notes", payload.stores.notes);
    await put("practiceEvents", payload.stores.practiceEvents);
    await put("reports", payload.stores.reports);
    await put("examSessions", payload.stores.examSessions);
    await put("srsStates", payload.stores.srsStates);
    counts.bookmarks = payload.stores.bookmarks.length;
    counts.notes = payload.stores.notes.length;
    counts.practiceEvents = payload.stores.practiceEvents.length;
    counts.reports = payload.stores.reports.length;
    counts.examSessions = payload.stores.examSessions.length;
    counts.srsStates = payload.stores.srsStates.length;
    return counts;
  } catch (err) {
    throw new AppError(ERROR_CODES.STORAGE_FAILED, userMessage(ERROR_CODES.STORAGE_FAILED), String(err));
  }
}

/** Delete every local row (opt-out / fresh start). */
export async function wipeLocalData(): Promise<void> {
  const db = getDb();
  await db.bookmarks.clear();
  await db.notes.clear();
  await db.practiceEvents.clear();
  await db.reports.clear();
  await db.examSessions.clear();
  await db.srsStates.clear();
}

export { verifyBackup };
