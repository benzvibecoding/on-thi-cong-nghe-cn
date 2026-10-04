import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { getDb } from "@/data/db";
import {
  getNote,
  getPracticeStats,
  isBookmarked,
  recordPracticeEvent,
  saveNote,
  saveReport,
  toggleBookmark,
} from "@/data/repositories";

describe("dexie persistence (migration v1 + v2 exam + v3 srs)", () => {
  it("tao du 6 stores", async () => {
    const db = getDb();
    expect(db.tables.map((t) => t.name).sort()).toEqual(
      ["bookmarks", "examSessions", "notes", "practiceEvents", "reports", "srsStates"].sort()
    );
    await db.open();
  });

  it("danh dau / bo danh dau cau hoi", async () => {
    await getDb().bookmarks.clear();
    expect(await isBookmarked("q1")).toBe(false);
    expect(await toggleBookmark("q1", "t1")).toBe(true);
    expect(await isBookmarked("q1")).toBe(true);
    expect(await toggleBookmark("q1", "t1")).toBe(false);
  });

  it("luu va xoa ghi chu", async () => {
    await saveNote("q1", "ghi nho U = I*R");
    expect(await getNote("q1")).toBe("ghi nho U = I*R");
    await saveNote("q1", "");
    expect(await getNote("q1")).toBe("");
  });

  it("ghi su kien luyen tap kieu append-only", async () => {
    await getDb().practiceEvents.clear();
    await recordPracticeEvent({
      questionId: "q1",
      topicId: "t1",
      level: "nb",
      qtype: "mcq",
      correct: true,
      correctCount: 1,
      durationMs: 1200,
    });
    const all = await getDb().practiceEvents.toArray();
    expect(all).toHaveLength(1);
    expect(all[0]!.questionId).toBe("q1");
    expect(typeof all[0]!.id).toBe("string");
  });

  it("thong ke id da lam / sai lan gan nhat cho bo loc", async () => {
    await getDb().practiceEvents.clear();
    const ev = (questionId: string, correct: boolean) =>
      recordPracticeEvent({ questionId, topicId: "t", level: "nb", qtype: "mcq", correct, correctCount: correct ? 1 : 0, durationMs: 10 });
    await ev("s1", false);
    await ev("s1", true);
    await ev("s2", false);
    const stats = await getPracticeStats();
    expect([...stats.answeredIds].sort()).toEqual(["s1", "s2"]);
    expect([...stats.wrongIds]).toEqual(["s2"]);
  });

  it("luu bao loi cau hoi", async () => {
    const row = await saveReport({
      questionId: "q9",
      questionVersion: 1,
      category: "Đáp án sai",
      detail: "Đáp án đúng phải là C.",
    });
    expect(row.questionId).toBe("q9");
    expect((await getDb().reports.get(row.id))?.detail).toBe("Đáp án đúng phải là C.");
  });
});
