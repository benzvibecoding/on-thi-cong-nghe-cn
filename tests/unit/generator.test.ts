import { describe, expect, it } from "vitest";
import { EXAM_BLUEPRINT } from "@/domain/exam-config";
import { fullPaperSize, planQuotas } from "@/domain/blueprint";
import { generateExam, type QuestionHistory } from "@/domain/generator";
import type { Question, QuestionLevel } from "@/domain/question-schema";

function makeBank(): Question[] {
  const bank: Question[] = [];
  const levels: QuestionLevel[] = ["nb", "th", "vd"];
  let n = 0;
  for (const level of levels) {
    for (let i = 0; i < 12; i++) {
      bank.push({
        id: `m-${level}-${i}`,
        type: "mcq",
        topicId: i % 2 === 0 ? "t1" : "t2",
        level,
        stem: "s",
        mcq: { options: ["1", "2", "3", "4"], correct: "A" },
        explanation: "e",
        source: { kind: "original" },
        status: "reviewed",
        version: 1,
        tags: [],
      });
      n++;
    }
  }
  for (const level of levels) {
    for (let i = 0; i < 3; i++) {
      bank.push({
        id: `t-${level}-${i}`,
        type: "tf4",
        topicId: "t1",
        level,
        stem: "s",
        tf4: {
          statements: (["a", "b", "c", "d"] as const).map((key) => ({
            key,
            text: key,
            isTrue: true,
            explanation: "e",
          })),
        },
        explanation: "e",
        source: { kind: "original" },
        status: "reviewed",
        version: 1,
        tags: [],
      });
      n++;
    }
  }
  expect(n).toBe(45);
  return bank;
}

describe("generator", () => {
  it("blueprint du 24+4=28 cau", () => {
    expect(fullPaperSize()).toBe(28);
    expect(EXAM_BLUEPRINT.part1.count).toBe(24);
    expect(EXAM_BLUEPRINT.part2.count).toBe(4);
    const need = planQuotas().reduce((s, q) => s + q.need, 0);
    expect(need).toBe(28);
  });

  it("sinh de du khi ngan hang du: dung phan bo, khong lap", () => {
    const paper = generateExam(makeBank(), new Map(), 123);
    expect(paper.full).toBe(true);
    expect(paper.shortages).toEqual([]);
    expect(paper.questions).toHaveLength(28);
    expect(new Set(paper.questions.map((q) => q.id)).size).toBe(28);
    const mcq = paper.questions.filter((q) => q.type === "mcq");
    const tf4 = paper.questions.filter((q) => q.type === "tf4");
    expect(mcq).toHaveLength(24);
    expect(tf4).toHaveLength(4);
    expect(mcq.filter((q) => q.level === "nb")).toHaveLength(10);
    expect(mcq.filter((q) => q.level === "th")).toHaveLength(7);
    expect(mcq.filter((q) => q.level === "vd")).toHaveLength(7);
  });

  it("cung seed cho cung de (tai hien duoc)", () => {
    const bank = makeBank();
    const a = generateExam(bank, new Map(), 999);
    const b = generateExam(bank, new Map(), 999);
    expect(a.questions.map((q) => q.id)).toEqual(b.questions.map((q) => q.id));
  });

  it("uu tien cau chua lam va cau da sai", () => {
    const bank = makeBank().filter((q) => q.type === "mcq" && q.level === "nb").slice(0, 11);
    const history = new Map<string, QuestionHistory>([
      [bank[10]!.id, { attempts: 3, lastCorrect: true }],
    ]);
    // Need 10 nb-mcq; 10 unseen + 1 seen-correct => seen-correct bi loai.
    const paper = generateExam(
      [...bank, ...makeBank().filter((q) => !(q.type === "mcq" && q.level === "nb"))],
      history,
      5
    );
    const ids = paper.questions.map((q) => q.id);
    expect(ids).not.toContain(bank[10]!.id);
  });

  it("ngan hang thieu: bao thieu, KHONG don cau draft/reviewed khong du", () => {
    const bank = makeBank().filter((q) => q.type === "mcq" && q.level === "nb").slice(0, 3);
    const paper = generateExam(bank, new Map(), 1);
    expect(paper.full).toBe(false);
    expect(paper.shortages.length).toBeGreaterThan(0);
    const nbShort = paper.shortages.find((s) => s.type === "mcq" && s.level === "nb");
    expect(nbShort).toMatchObject({ need: 10, have: 3 });
  });

  it("cau draft khong bao gio vao de thi", () => {
    const bank = makeBank().map((q) => ({ ...q, status: "draft" as const }));
    const paper = generateExam(bank, new Map(), 1);
    expect(paper.questions).toHaveLength(0);
    expect(paper.full).toBe(false);
  });
});
