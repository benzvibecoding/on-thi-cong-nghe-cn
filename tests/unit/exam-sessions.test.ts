import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { getDb, newId } from "@/data/db";
import { deleteExamSession, loadExamSession, saveExamSession } from "@/data/exam-sessions";

describe("exam sessions persistence (DB v2)", () => {
  it("luu, tai lai va xoa phien thi (ke ca dong ho)", async () => {
    const id = newId();
    await saveExamSession({
      id,
      seed: 42,
      mode: "paper",
      full: false,
      questions: [],
      answers: { mcq: { q1: "A" }, tf4: {} },
      flags: ["q1"],
      durationsMs: { q1: 5000 },
      startedAt: 1000,
      endsAt: 2000,
      submittedAt: null,
      autoSubmitted: false,
      tabId: "tab-1",
      updatedAt: 0,
    });
    const loaded = await loadExamSession(id);
    expect(loaded?.answers.mcq).toEqual({ q1: "A" });
    expect(loaded?.endsAt).toBe(2000);
    expect(loaded?.flags).toEqual(["q1"]);
    await deleteExamSession(id);
    expect(await loadExamSession(id)).toBeUndefined();
  });

  it("DB v2 van giu du stores cu", async () => {
    expect(getDb().tables.map((t) => t.name)).toContain("examSessions");
    expect(getDb().tables.map((t) => t.name)).toContain("bookmarks");
  });
});
