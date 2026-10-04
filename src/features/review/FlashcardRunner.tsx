"use client";

import { useState } from "react";
import { scheduleReview, SRS_GRADES, type DueCard, type SrsGrade, type SrsState } from "@/domain/srs";
import { FLASHCARD_KIND_LABEL } from "@/domain/flashcards";
import { MathText } from "@/components/math/MathText";
import { saveSrsState } from "@/data/repositories";

interface FlashcardRunnerProps {
  queue: DueCard[];
  onDone: () => void;
}

export function FlashcardRunner({ queue, onDone }: FlashcardRunnerProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);

  if (queue.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5 text-center">
        <p className="font-semibold text-[var(--accent)]">Hết thẻ hôm nay. Tuyệt vời!</p>
        <button type="button" onClick={onDone} className="touch-target mt-3 rounded-lg border border-[var(--line)] px-4">
          Về trang Ôn tập
        </button>
      </div>
    );
  }

  const current = queue[Math.min(index, queue.length - 1)]!;
  const total = queue.length;

  const grade = (value: SrsGrade) => {
    const prev: SrsState | null = current.state;
    const next = scheduleReview(prev, value);
    saveSrsState(current.card.id, next).catch(() => {});
    setFlipped(false);
    setDone((d) => d + 1);
    setIndex((i) => i + 1);
  };

  if (index >= total) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5 text-center">
        <p className="font-semibold text-[var(--accent)]">
          Xong {done} thẻ hôm nay. Hẹn gặp lại đúng lúc!
        </p>
        <button type="button" onClick={onDone} className="touch-target mt-3 rounded-lg border border-[var(--line)] px-4">
          Về trang Ôn tập
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--ink-muted)]">
        Thẻ {index + 1}/{total} {current.isNew ? "• Thẻ mới" : "• Ôn lại"}
      </p>
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <p className="text-xs font-semibold text-[var(--copper)]">
          {FLASHCARD_KIND_LABEL[current.card.kind]}
        </p>
        <MathText text={current.card.front} className="mt-1 text-lg" />
        {flipped ? (
          <div className="mt-3 border-t border-[var(--line)] pt-3">
            <MathText text={current.card.back} />
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Mức độ nhớ">
              {SRS_GRADES.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => grade(g.value)}
                  className="touch-target rounded-lg border border-[var(--line)] px-2 py-2 text-sm font-semibold hover:border-[var(--accent)]"
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setFlipped(true)}
            className="touch-target mt-3 w-full rounded-lg bg-[var(--accent)] font-semibold text-[var(--accent-ink)]"
          >
            Lật thẻ
          </button>
        )}
      </div>
    </div>
  );
}
