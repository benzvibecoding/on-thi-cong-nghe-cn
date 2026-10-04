"use client";

import { useEffect, useState } from "react";
import { loadManifest, loadTopicPack } from "@/data/content-loader";
import { getSrsStates } from "@/data/repositories";
import { getWrongBook, type WrongItem } from "@/data/wrong-book";
import { buildDueQueue, type DueCard } from "@/domain/srs";
import type { Flashcard } from "@/domain/flashcards";
import { MathText } from "@/components/math/MathText";
import { PracticeSession } from "@/features/practice/PracticeSession";
import { FlashcardRunner } from "@/features/review/FlashcardRunner";
import { AppError } from "@/lib/errors";

type Phase =
  | { kind: "loading" }
  | { kind: "main" }
  | { kind: "practicing"; seed: number }
  | { kind: "reviewing"; queue: DueCard[] };

interface ReviewData {
  wrong: WrongItem[];
  cards: Flashcard[];
  queue: DueCard[];
  dueCount: number;
  newCount: number;
}

function readLimit(): number {
  if (typeof window === "undefined") return 10;
  try {
    const saved = window.localStorage.getItem("cncn-srs-limit");
    return saved ? Math.max(1, Math.min(30, Number(saved) || 10)) : 10;
  } catch {
    return 10;
  }
}

/** Module-level fetch: states set only inside .then callbacks (lint-safe). */
async function loadReviewData(perDay: number): Promise<ReviewData> {
  const [wrongItems, manifest] = await Promise.all([getWrongBook(), loadManifest()]);
  const packs = await Promise.all(manifest.packs.map((p) => loadTopicPack(p.topicId)));
  const allCards = packs.flatMap((p) => p.flashcards);
  const states = await getSrsStates();
  const queue = buildDueQueue(allCards, states, Date.now(), perDay);
  return {
    wrong: wrongItems,
    cards: allCards,
    queue,
    dueCount: queue.filter((q) => !q.isNew).length,
    newCount: queue.filter((q) => q.isNew).length,
  };
}

export default function OnTapPage() {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [data, setData] = useState<ReviewData>({ wrong: [], cards: [], queue: [], dueCount: 0, newCount: 0 });
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(readLimit);

  useEffect(() => {
    let cancelled = false;
    loadReviewData(readLimit())
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setPhase({ kind: "main" });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof AppError ? `${err.message} (mã ${err.code})` : "Có lỗi xảy ra.");
          setPhase({ kind: "main" });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const applyData = (d: ReviewData) => {
    setData(d);
    setPhase({ kind: "main" });
  };

  const changeLimit = (value: number) => {
    const v = Math.max(1, Math.min(30, value || 10));
    setLimit(v);
    try {
      window.localStorage.setItem("cncn-srs-limit", String(v));
    } catch {
      // ignore storage errors
    }
    loadReviewData(v).then(applyData).catch(() => {});
  };

  const startReview = () => {
    loadReviewData(limit)
      .then((d) => {
        applyData(d);
        setPhase({ kind: "reviewing", queue: d.queue });
      })
      .catch(() => {});
  };

  if (phase.kind === "loading") {
    return (
      <section aria-busy="true" aria-label="Đang tải" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <h1 className="text-2xl font-bold">Ôn tập</h1>
        <p className="mt-2 text-[var(--ink-muted)]">Đang tải sổ câu sai và thẻ ôn…</p>
      </section>
    );
  }

  if (phase.kind === "practicing") {
    return (
      <PracticeSession
        questions={data.wrong.map((w) => w.question)}
        seed={phase.seed}
        onExit={() => setPhase({ kind: "main" })}
        onRetry={(rest) => {
          setData((prev) => ({
            ...prev,
            wrong: prev.wrong.filter((w) => rest.some((q) => q.id === w.question.id)),
          }));
          setPhase({ kind: "main" });
        }}
      />
    );
  }

  if (phase.kind === "reviewing") {
    return (
      <FlashcardRunner
        queue={phase.queue}
        onDone={() => {
          loadReviewData(limit).then(applyData).catch(() => {});
          setPhase({ kind: "main" });
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Ôn tập</h1>
      {error && (
        <p role="alert" className="rounded-xl border border-[var(--line)] p-3 text-sm">
          {error}
        </p>
      )}
      <section aria-labelledby="so-cau-sai" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <h2 id="so-cau-sai" className="text-lg font-bold">
          Sổ câu sai ({data.wrong.length})
        </h2>
        {data.wrong.length === 0 ? (
          <p className="mt-2 text-[var(--ink-muted)]">
            Chưa có câu sai nào. Làm bài ở Luyện tập, câu nào sai lần gần nhất sẽ vào đây.
          </p>
        ) : (
          <>
            <ul className="mt-2 space-y-2">
              {data.wrong.slice(0, 10).map((w) => (
                <li key={w.question.id} className="rounded-lg bg-[var(--bg-sunken)] px-3 py-2 text-sm">
                  <MathText text={w.question.stem} />
                  <p className="mt-1 text-[var(--ink-muted)]">
                    Sai {w.wrongCount} lần • {new Date(w.lastWrongAt).toLocaleDateString("vi-VN")}
                  </p>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() =>
                setPhase({ kind: "practicing", seed: Date.now() % 2147483647 })
              }
              className="touch-target mt-3 rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-ink)]"
            >
              Luyện {data.wrong.length} câu sai
            </button>
          </>
        )}
      </section>
      <section aria-labelledby="the-srs" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <h2 id="the-srs" className="text-lg font-bold">
          Thẻ ghi nhớ ngắt quãng ({data.cards.length} thẻ)
        </h2>
        <p className="mt-1 text-[15px] text-[var(--ink-muted)]">
          Hôm nay: {data.dueCount} thẻ đến hạn + tối đa {limit} thẻ mới.
        </p>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <span className="font-semibold">Thẻ mới mỗi ngày</span>
          <input
            type="number"
            min={1}
            max={30}
            value={limit}
            onChange={(e) => changeLimit(Number(e.target.value))}
            className="touch-target w-20 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2"
          />
        </label>
        <button
          type="button"
          disabled={data.dueCount + data.newCount === 0}
          onClick={startReview}
          className="touch-target mt-3 rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-ink)] disabled:opacity-50"
        >
          {data.dueCount + data.newCount === 0 ? "Hết thẻ hôm nay" : `Ôn ${data.dueCount + data.newCount} thẻ`}
        </button>
      </section>
    </div>
  );
}
