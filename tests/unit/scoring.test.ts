import { describe, expect, it } from "vitest";
import { EXAM_CONFIG } from "@/domain/exam-config";
import {
  round2,
  scoreExam,
  scoreQuestion,
  tf4Points,
  type ExamAnswers,
} from "@/domain/scoring";
import type { Question } from "@/domain/question-schema";

function mcq(id: string): Question {
  return {
    id,
    type: "mcq",
    topicId: "t",
    level: "nb",
    stem: "s",
    mcq: { options: ["1", "2", "3", "4"], correct: "C" },
    explanation: "e",
    source: { kind: "original" },
    status: "reviewed",
    version: 1,
    tags: [],
  };
}

function tf4(id: string): Question {
  return {
    id,
    type: "tf4",
    topicId: "t",
    level: "th",
    stem: "s",
    tf4: {
      statements: [
        { key: "a", text: "a", isTrue: true, explanation: "e" },
        { key: "b", text: "b", isTrue: false, explanation: "e" },
        { key: "c", text: "c", isTrue: true, explanation: "e" },
        { key: "d", text: "d", isTrue: false, explanation: "e" },
      ],
    },
    explanation: "e",
    source: { kind: "original" },
    status: "reviewed",
    version: 1,
    tags: [],
  };
}

describe("scoring (thang diem chuan muc 2)", () => {
  it("Phan I: dung 0,25; sai 0; bo trong 0", () => {
    const q = mcq("m1");
    expect(scoreQuestion(q, { mcq: { m1: "C" }, tf4: {} }).points).toBe(0.25);
    expect(scoreQuestion(q, { mcq: { m1: "A" }, tf4: {} }).points).toBe(0);
    expect(scoreQuestion(q, { mcq: {}, tf4: {} }).points).toBe(0);
  });

  it("Phan II: 0-4 y dung -> 0 / 0,1 / 0,25 / 0,5 / 1,0", () => {
    expect(tf4Points(0)).toBe(0);
    expect(tf4Points(1)).toBe(0.1);
    expect(tf4Points(2)).toBe(0.25);
    expect(tf4Points(3)).toBe(0.5);
    expect(tf4Points(4)).toBe(1.0);
  });

  it("Phan II: bo trong va lam do tung y", () => {
    const q = tf4("t1");
    const blank = scoreQuestion(q, { mcq: {}, tf4: {} });
    expect(blank.correctCount).toBe(0);
    expect(blank.points).toBe(0);
    // a dung, b sai (chon true trong khi dap an false), c dung, d bo trong
    const partial = scoreQuestion(q, { mcq: {}, tf4: { t1: [true, true, true, null] } });
    expect(partial.correctCount).toBe(2);
    expect(partial.points).toBe(0.25);
    const full = scoreQuestion(q, { mcq: {}, tf4: { t1: [true, false, true, false] } });
    expect(full.points).toBe(1.0);
  });

  it("tong de 24+4 toi da 10 diem, hien thi 2 chu so", () => {
    const questions = [
      ...Array.from({ length: 24 }, (_, i) => mcq(`m${i}`)),
      ...Array.from({ length: 4 }, (_, i) => tf4(`t${i}`)),
    ];
    const answers: ExamAnswers = {
      mcq: Object.fromEntries(questions.filter((q) => q.type === "mcq").map((q) => [q.id, "C"])),
      tf4: Object.fromEntries(
        questions.filter((q) => q.type === "tf4").map((q) => [q.id, [true, false, true, false]])
      ),
    };
    const score = scoreExam(questions, answers);
    expect(score.part1Points).toBe(6);
    expect(score.part2Points).toBe(4);
    expect(score.totalPoints).toBe(10);
    expect(score.totalPoints.toFixed(2)).toBe("10.00");
    expect(EXAM_CONFIG.part1.count).toBe(24);
  });

  it("khong lam gi duoc 0 diem", () => {
    const score = scoreExam([mcq("m1"), tf4("t1")], { mcq: {}, tf4: {} });
    expect(score.totalPoints).toBe(0);
    expect(score.correctMcq).toBe(0);
    expect(score.fullyCorrectTf4).toBe(0);
  });

  it("round2 chong loi so thuc (0,1+0,25=0,35)", () => {
    expect(round2(0.1 + 0.25)).toBe(0.35);
  });
});
