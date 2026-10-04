// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MathText } from "@/components/math/MathText";
import { QuestionView } from "@/components/question/QuestionView";
import type { Question } from "@/domain/question-schema";

const mcq: Question = {
  id: "test-mcq-01",
  type: "mcq",
  topicId: "dien-gia-dinh",
  level: "vd",
  stem: "Dòng định mức của bóng **12 V – 6 W** là bao nhiêu? ($I = P / U$)",
  mcq: { options: ["2 A", "0,5 A", "72 A", "18 A"], correct: "B" },
  explanation: "Vì $I = 6/12 = 0{,}5$ A.",
  source: { kind: "original" },
  status: "draft",
  version: 1,
  tags: [],
};

describe("renderer", () => {
  it("render Markdown + KaTeX", () => {
    render(<MathText text={mcq.stem} />);
    expect(screen.getByText(/12 V/).nodeName).toBeTruthy();
    expect(document.querySelector(".katex")).not.toBeNull();
  });

  it("QuestionView hien 4 lua chon va huy hieu chua kiem duyet", () => {
    render(<QuestionView question={mcq} />);
    for (const text of ["2 A", "0,5 A", "72 A", "18 A"]) {
      expect(screen.getByText(text)).toBeTruthy();
    }
    for (const letter of ["A", "B", "C", "D"]) {
      expect(screen.getAllByText(letter).length).toBeGreaterThanOrEqual(1);
    }
    expect(screen.getByText("Chưa kiểm duyệt")).toBeTruthy();
  });

  it("QuestionView hien loi giai khi showAnswer", () => {
    render(<QuestionView question={mcq} showAnswer />);
    expect(document.querySelector(".katex")).not.toBeNull();
  });
});
