import { describe, expect, it } from "vitest";
import {
  computeEndsAt,
  countUnanswered,
  emptyAnswers,
  formatRemaining,
  isMcqComplete,
  isTf4Complete,
  msRemaining,
} from "@/domain/exam-session";
import { EXAM_CONFIG } from "@/domain/exam-config";
import type { Question } from "@/domain/question-schema";

function mcq(id: string): Question {
  return {
    id, type: "mcq", topicId: "t", level: "nb", stem: "s",
    mcq: { options: ["1", "2", "3", "4"], correct: "A" },
    explanation: "e", source: { kind: "original" },
    status: "reviewed", version: 1, tags: [],
  };
}

describe("exam session helpers", () => {
  it("dem cau chua lam (mcq + tf4 tung y)", () => {
    const qs = [mcq("m1"), mcq("m2")];
    expect(countUnanswered(qs, emptyAnswers())).toBe(2);
    expect(countUnanswered(qs, { mcq: { m1: "A" }, tf4: {} })).toBe(1);
    expect(isMcqComplete(qs[0]!, { mcq: { m1: "B" }, tf4: {} })).toBe(true);
  });

  it("tf4 thieu 1 y van la chua xong", () => {
    const q: Question = { ...mcq("t1"), type: "tf4", mcq: undefined };
    expect(isTf4Complete(q, { mcq: {}, tf4: { t1: [true, false, true, null] } })).toBe(false);
    expect(isTf4Complete(q, { mcq: {}, tf4: { t1: [true, false, true, true] } })).toBe(true);
  });

  it("dong ho dua tren moc tuyet doi, khong am", () => {
    const startedAt = 1_000_000;
    expect(computeEndsAt(startedAt) - startedAt).toBe(EXAM_CONFIG.totalMinutes * 60 * 1000);
    expect(msRemaining(startedAt + 60_000, startedAt)).toBe(60_000);
    expect(msRemaining(startedAt - 1, startedAt)).toBe(0);
    expect(formatRemaining(50 * 60 * 1000)).toBe("50:00");
    expect(formatRemaining(61_000)).toBe("01:01");
  });
});
