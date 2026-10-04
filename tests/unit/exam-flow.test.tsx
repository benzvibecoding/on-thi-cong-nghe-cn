// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExamRunner } from "@/features/exam/ExamRunner";
import type { ExamSessionRow } from "@/data/db";
import type { Question } from "@/domain/question-schema";

const mcq: Question = {
  id: "m1", type: "mcq", topicId: "t1", level: "nb", stem: "Chon A?",
  mcq: { options: ["A-dung", "B", "C", "D"], correct: "A" },
  explanation: "Vi A dung.", source: { kind: "original" },
  status: "reviewed", version: 1, tags: [],
};

const tf4: Question = {
  id: "t1", type: "tf4", topicId: "t1", level: "th", stem: "Xet dung sai.",
  tf4: {
    statements: (["a", "b", "c", "d"] as const).map((key) => ({
      key, text: `Y ${key}`, isTrue: true, explanation: "Dung.",
    })),
  },
  explanation: "Tat ca dung.", source: { kind: "original" },
  status: "reviewed", version: 1, tags: [],
};

function makeRow(): ExamSessionRow {
  return {
    id: "exam-test-1",
    seed: 7,
    mode: "paper",
    full: false,
    questions: [mcq, tf4],
    answers: { mcq: {}, tf4: {} },
    flags: [],
    durationsMs: {},
    startedAt: Date.now(),
    endsAt: Date.now() + 50 * 60 * 1000,
    submittedAt: null,
    autoSubmitted: false,
    tabId: "test",
    updatedAt: 0,
  };
}

describe("exam flow tren UI that (fixtures trong test)", () => {
  it("tra loi -> nop bai -> thay diem va loi giai", async () => {
    const user = userEvent.setup();
    render(<ExamRunner initial={makeRow()} />);

    // Phieu tra loi hien; chon A cho cau 1 qua the cau hoi (radio).
    const radios = screen.getAllByRole("radio");
    await user.click(radios[0]!);

    // Cau 2 (TF4): chon Dung cho ca 4 y (role group, khac radiogroup cua MCQ).
    const groups = screen.getAllByRole("group");
    expect(groups).toHaveLength(4);
    for (const g of groups) {
      await user.click(within(g as HTMLElement).getByRole("button", { name: "Đúng" }));
    }

    await user.click(screen.getByRole("button", { name: "Nộp bài" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Nộp bài" }));

    // 1 MCQ dung (0,25) + TF4 dung ca 4 y (1,0) = 1,25 (formatScore dung dau cham).
    expect(await screen.findByText("1.25")).toBeTruthy();
    expect(screen.getByText(/kết quả thi thử/i)).toBeTruthy();
    // Xem lai hien loi giai chi tiet tung cau.
    expect(screen.getByText("Vi A dung.")).toBeTruthy();
    expect(screen.getByText("Tat ca dung.")).toBeTruthy();
  });
});
