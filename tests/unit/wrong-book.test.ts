import "fake-indexeddb/auto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { getDb } from "@/data/db";
import { recordPracticeEvent } from "@/data/repositories";
import { getWrongBook } from "@/data/wrong-book";

describe("wrong-book (so cau sai that)", () => {
  beforeAll(() => {
    // Stub fetch de getWrongBook doc packs that tu repo (da build o CI).
    const packsDir = join(process.cwd(), "public", "packs");
    globalThis.fetch = (async (url: string) => {
      const m = /\/packs\/(.+)\.json$/.exec(url);
      if (!m) return { ok: false, status: 404, json: async () => ({}) };
      const data = JSON.parse(readFileSync(join(packsDir, `${m[1]}.json`), "utf8"));
      return { ok: true, status: 200, json: async () => data };
    }) as unknown as typeof fetch;
  });

  it("chi giu cau co lan gan nhat sai, kem noi dung that", async () => {
    await getDb().practiceEvents.clear();
    const ev = (questionId: string, correct: boolean) =>
      recordPracticeEvent({ questionId, topicId: "dien-dai-cuong", level: "nb", qtype: "mcq", correct, correctCount: correct ? 1 : 0, durationMs: 100 });
    await ev("ddc-mcq-01", false);
    await ev("ddc-mcq-01", true); // da sua dung -> ra khoi so
    await ev("ddc-mcq-02", false); // van trong so
    const book = await getWrongBook();
    expect(book.map((b) => b.question.id)).toEqual(["ddc-mcq-02"]);
    expect(book[0]!.wrongCount).toBe(1);
    expect(book[0]!.question.stem.length).toBeGreaterThan(0);
  });
});
