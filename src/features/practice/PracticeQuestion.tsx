"use client";

import type { McqAnswer, Tf4Answer } from "@/domain/practice";
import type { Question } from "@/domain/question-schema";
import { LEVEL_LABEL } from "@/domain/exam-config";
import { MathText } from "@/components/math/MathText";
import { AiExplain } from "@/features/ai/AiExplain";
import { cn } from "@/lib/utils";

interface PracticeQuestionProps {
  question: Question;
  mcqAnswer: McqAnswer;
  tf4Answer: Tf4Answer;
  showFeedback: boolean;
  onMcq: (answer: Exclude<McqAnswer, null>) => void;
  onTf4: (index: number, value: boolean) => void;
}

const LETTERS = ["A", "B", "C", "D"] as const;

export function PracticeQuestion({
  question,
  mcqAnswer,
  tf4Answer,
  showFeedback,
  onMcq,
  onTf4,
}: PracticeQuestionProps) {
  return (
    <article aria-label={`Câu hỏi ${question.id}`} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-[var(--bg-sunken)] px-2 py-1 font-semibold">
          {question.type === "mcq" ? "Phần I" : "Phần II"}
        </span>
        <span className="rounded-full bg-[var(--bg-sunken)] px-2 py-1">
          {LEVEL_LABEL[question.level]}
        </span>
        {question.status === "draft" && (
          <span className="rounded-full bg-[var(--bg-sunken)] px-2 py-1 font-semibold text-[var(--copper)]">
            Chưa kiểm duyệt
          </span>
        )}
      </div>

      <MathText text={question.stem} className="text-[17px]" />
      {question.media?.map((m) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={m.src}
          src={m.src}
          alt={m.alt}
          loading="lazy"
          className="max-h-64 w-auto self-start rounded-lg border border-[var(--line)]"
        />
      ))}

      {question.type === "mcq" && question.mcq && (
        <div role="radiogroup" aria-label="Các phương án trả lời" className="flex flex-col gap-2">
          {LETTERS.map((letter, i) => {
            const selected = mcqAnswer === letter;
            const isCorrect = question.mcq!.correct === letter;
            const reveal = showFeedback && (selected || isCorrect);
            return (
              <button
                key={letter}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={showFeedback}
                onClick={() => onMcq(letter)}
                className={cn(
                  "touch-target flex items-start gap-2 rounded-lg border px-3 py-2 text-left",
                  selected && !showFeedback && "border-[var(--accent)]",
                  reveal && isCorrect && "border-[var(--accent)] bg-[var(--bg-sunken)]",
                  reveal && selected && !isCorrect && "border-[var(--danger)]"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold",
                    !showFeedback && selected && "bg-[var(--accent)] text-[var(--accent-ink)]",
                    !showFeedback && !selected && "bg-[var(--bg-sunken)]",
                    reveal && isCorrect && "bg-[var(--accent)] text-[var(--accent-ink)]",
                    reveal && selected && !isCorrect && "bg-[var(--bg-sunken)] text-[var(--danger)]"
                  )}
                >
                  {letter}
                </span>
                <span className="flex-1">
                  <MathText text={question.mcq!.options[i]!} />
                </span>
                {reveal && (
                  <span aria-hidden="true" className="font-bold">
                    {isCorrect ? "✓" : selected ? "✗" : ""}
                  </span>
                )}
                <span className="sr-only">
                  {reveal
                    ? isCorrect
                      ? " (đáp án đúng)"
                      : selected
                        ? " (bạn chọn, sai)"
                        : ""
                    : selected
                      ? " (đang chọn)"
                      : ""}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {question.type === "tf4" && question.tf4 && (
        <ul className="flex flex-col gap-2">
          {question.tf4.statements.map((s, i) => {
            const val = tf4Answer[i] ?? null;
            return (
              <li
                key={s.key}
                className="flex flex-col gap-2 rounded-lg border border-[var(--line)] px-3 py-2"
              >
                <div className="flex items-start gap-2">
                  <span aria-hidden="true" className="font-mono font-bold">
                    {s.key})
                  </span>
                  <span className="flex-1">
                    <MathText text={s.text} />
                  </span>
                </div>
                <div role="group" aria-label={`Ý ${s.key}: chọn Đúng hoặc Sai`} className="flex gap-2">
                  {[true, false].map((v) => {
                    const label = v ? "Đúng" : "Sai";
                    const selected = val === v;
                    const reveal = showFeedback;
                    const truth = s.isTrue === v;
                    return (
                      <button
                        key={label}
                        type="button"
                        aria-pressed={selected}
                        disabled={showFeedback}
                        onClick={() => onTf4(i, v)}
                        className={cn(
                          "touch-target flex-1 rounded-lg border px-3 py-2 text-sm font-semibold",
                          selected && !showFeedback && "border-[var(--accent)]",
                          reveal && truth && "border-[var(--accent)] bg-[var(--bg-sunken)]",
                          reveal && selected && !truth && "border-[var(--danger)]"
                        )}
                      >
                        {reveal && truth ? `✓ ${label}` : reveal && selected && !truth ? `✗ ${label}` : label}
                      </button>
                    );
                  })}
                </div>
                {showFeedback && <MathText text={s.explanation} className="text-sm text-[var(--ink-muted)]" />}
              </li>
            );
          })}
        </ul>
      )}

      {showFeedback && (
        <div className="rounded-lg bg-[var(--bg-sunken)] p-3 text-[15px]">
          <p className="font-semibold">Lời giải</p>
          <MathText text={question.explanation} />
          {question.commonMistake && (
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              <span className="font-semibold">Lỗi thường gặp: </span>
              {question.commonMistake}
            </p>
          )}
          <AiExplain question={question} />
        </div>
      )}
    </article>
  );
}
