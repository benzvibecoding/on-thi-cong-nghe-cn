import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { getDb } from "@/data/db";
import { collectBackup, restoreBackup, wipeLocalData } from "@/data/backup-store";
import { saveNote, toggleBookmark } from "@/data/repositories";

describe("backup store (collect -> wipe -> restore that)", () => {
  it("roundtrip giu nguyen du lieu", async () => {
    await wipeLocalData();
    await toggleBookmark("q1", "t1");
    await saveNote("q1", "ghi nho");
    const payload = await collectBackup({
      theme: "light",
      onboardingDone: false,
      studyGoal: null,
      minutesPerDay: 30,
      srsLimit: 10,
    });
    await wipeLocalData();
    expect(await getDb().bookmarks.count()).toBe(0);
    const counts = await restoreBackup(payload);
    expect(counts.bookmarks).toBe(1);
    expect(counts.notes).toBe(1);
    expect((await getDb().notes.get("q1"))?.text).toBe("ghi nho");
  });
});
