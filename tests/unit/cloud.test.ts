import { describe, expect, it } from "vitest";
import { RateLimiter } from "@/lib/rate-limit";
import { mergeSettings, toSyncRow } from "@/data/sync";
import { getSupabase } from "@/lib/supabase";

describe("m9 cloud phu tro", () => {
  it("chua cau hinh thi client tra ve null (local-first)", () => {
    expect(getSupabase()).toBeNull();
  });

  it("rate limiter chan vuot nguong cua so truot", () => {
    const limiter = new RateLimiter(2, 1000);
    const now = 5_000_000;
    expect(limiter.allow("ip", now)).toBe(true);
    expect(limiter.allow("ip", now + 10)).toBe(true);
    expect(limiter.allow("ip", now + 20)).toBe(false);
    expect(limiter.allow("ip", now + 2000)).toBe(true); // qua cua so
    expect(limiter.allow("other", now + 20)).toBe(true); // key rieng
  });

  it("payload dong bo giu id client (idempotent)", () => {
    const row = toSyncRow("user-1", {
      id: "evt-1",
      questionId: "q1",
      topicId: "t",
      level: "nb",
      qtype: "mcq",
      correct: true,
      correctCount: 1,
      durationMs: 500,
      createdAt: 123,
    });
    expect(row).toMatchObject({ id: "evt-1", user_id: "user-1", question_id: "q1" });
  });

  it("cai dat last-write-wins", () => {
    expect(mergeSettings({ data: { a: 1 }, updatedAt: 10 }, { data: { a: 2 }, updatedAt: 20 })).toEqual({ a: 2 });
    expect(mergeSettings({ data: { a: 1 }, updatedAt: 30 }, { data: { a: 2 }, updatedAt: 20 })).toEqual({ a: 1 });
  });
});
