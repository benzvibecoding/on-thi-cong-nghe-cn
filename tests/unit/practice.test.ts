import { describe, expect, it } from "vitest";
import {
  buildPracticeSet,
  filterQuestions,
  gradeMcq,
  gradeTf4,
  mulberry32,
  shuffleArray,
  summarizeEvents,
  type PracticeFilter,
} from "@/domain/practice";
import type { Question } from "@/domain/question-schema";

function mcq(id: string, overrides: Partial<Question> = {}): Question {
  return {
    id,
    type: "mcq",
    topicId: "dien-dai-cuong",
    level: "nb",
    stem: "Stem",
    mcq: { options: ["1", "2", "3", "4"], correct: "B" },
    explanation: "Vì B đúng.",
    source: { kind: "original" },
    status: "draft",
    version: 1,
    tags: [],
    ...overrides,
  };
}

const base: PracticeFilter = {
  topicId: "all",
  levels: ["nb", "th", "vd"],
  types: ["mcq", "tf4"],
  includeDraft: true,
  count: 10,
  status: "all",
};

describe("practice domain", () => {
  it("loc dung chu de, muc do, dang cau", () => {
    const qs = [
      mcq("q1", { level: "nb" }),
      mcq("q2", { level: "vd", topicId: "dien-tu-so" }),
      { ...mcq("q3"), type: "tf4" as const, mcq: undefined, tf4: undefined },
    ];
    expect(filterQuestions(qs, { ...base, levels: ["vd"] }).map((q) => q.id)).toEqual(["q2"]);
    expect(filterQuestions(qs, { ...base, topicId: "dien-tu-so" }).map((q) => q.id)).toEqual(["q2"]);
  });

  it("loc theo trang thai chua lam / da sai / da danh dau", () => {
    const qs = [mcq("q1"), mcq("q2"), mcq("q3")];
    const ctx = {
      answeredIds: new Set(["q1", "q2"]),
      wrongIds: new Set(["q1"]),
      bookmarkedIds: new Set(["q3"]),
    };
    const ids = (f: PracticeFilter) => filterQuestions(qs, f, ctx).map((q) => q.id);
    expect(ids({ ...base, status: "unseen" })).toEqual(["q3"]);
    expect(ids({ ...base, status: "wrong" })).toEqual(["q1"]);
    expect(ids({ ...base, status: "bookmarked" })).toEqual(["q3"]);
    expect(ids({ ...base, status: "all" })).toHaveLength(3);
  });

  it("loai draft khi includeDraft=false", () => {
    const qs = [mcq("q1", { status: "draft" }), mcq("q2", { status: "reviewed" })];
    expect(filterQuestions(qs, { ...base, includeDraft: false }).map((q) => q.id)).toEqual(["q2"]);
  });

  it("xao tron cung seed cho ket qua giong nhau, khong lap cau", () => {
    const qs = Array.from({ length: 10 }, (_, i) => mcq(`q${i}`));
    const a = buildPracticeSet(qs, { ...base, count: 5 }, 42);
    const b = buildPracticeSet(qs, { ...base, count: 5 }, 42);
    expect(a.set.map((q) => q.id)).toEqual(b.set.map((q) => q.id));
    expect(new Set(a.set.map((q) => q.id)).size).toBe(5);
    expect(a.available).toBe(10);
  });

  it("count vuot qua pool thi lay toi da pool", () => {
    const { set } = buildPracticeSet([mcq("q1")], { ...base, count: 10 }, 7);
    expect(set).toHaveLength(1);
  });

  it("cham mcq dung/sai", () => {
    const q = mcq("q1");
    expect(gradeMcq(q, "B")).toBe(true);
    expect(gradeMcq(q, "A")).toBe(false);
    expect(gradeMcq(q, null)).toBe(false);
  });

  it("cham tf4 theo tung y", () => {
    const q: Question = {
      ...mcq("t1"),
      type: "tf4",
      mcq: undefined,
      tf4: {
        statements: [
          { key: "a", text: "a", isTrue: true, explanation: "e" },
          { key: "b", text: "b", isTrue: false, explanation: "e" },
          { key: "c", text: "c", isTrue: true, explanation: "e" },
          { key: "d", text: "d", isTrue: false, explanation: "e" },
        ],
      },
    };
    expect(gradeTf4(q, [true, false, true, false])).toEqual({
      perStatement: [true, true, true, true],
      allCorrect: true,
      correctCount: 4,
    });
    const partial = gradeTf4(q, [true, true, true, false]);
    expect(partial.allCorrect).toBe(false);
    expect(partial.correctCount).toBe(3);
  });

  it("mulberry32 on dinh", () => {
    expect(shuffleArray([1, 2, 3, 4, 5], 1)).toEqual(shuffleArray([1, 2, 3, 4, 5], 1));
    expect(mulberry32(5)()).toBe(mulberry32(5)());
  });

  it("tong hop su kien theo chu de", () => {
    const summary = summarizeEvents([
      { questionId: "a", topicId: "t1", level: "nb", qtype: "mcq", correct: true, correctCount: 1, durationMs: 1000 },
      { questionId: "b", topicId: "t1", level: "th", qtype: "mcq", correct: false, correctCount: 0, durationMs: 2000 },
      { questionId: "c", topicId: "t2", level: "nb", qtype: "tf4", correct: true, correctCount: 4, durationMs: 3000 },
    ]);
    expect(summary).toContainEqual({ topicId: "t1", total: 2, correct: 1, accuracy: 0.5 });
    expect(summary).toContainEqual({ topicId: "t2", total: 1, correct: 1, accuracy: 1 });
  });
});
