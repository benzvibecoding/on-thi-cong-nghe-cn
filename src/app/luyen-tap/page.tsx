"use client";

import { Suspense, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loadManifest, loadTopicPack } from "@/data/content-loader";
import { buildPracticeSet, type PracticeFilter } from "@/domain/practice";
import type { Question } from "@/domain/question-schema";
import { FilterForm } from "@/features/practice/FilterForm";
import { PracticeSession } from "@/features/practice/PracticeSession";
import { AppError } from "@/lib/errors";

type Phase =
  | { kind: "filter" }
  | { kind: "loading" }
  | { kind: "ready"; questions: Question[]; seed: number }
  | { kind: "empty"; message: string }
  | { kind: "error"; code: string; message: string };

function LuyenTapInner() {
  const searchParams = useSearchParams();
  const defaultTopic = searchParams.get("topic") ?? "all";
  const [phase, setPhase] = useState<Phase>({ kind: "filter" });
  const [runId, setRunId] = useState(0);

  const start = useCallback(async (filter: PracticeFilter) => {
    setPhase({ kind: "loading" });
    try {
      const manifest = await loadManifest();
      const topicIds =
        filter.topicId === "all" ? manifest.packs.map((p) => p.topicId) : [filter.topicId];
      const packs = await Promise.all(topicIds.map((t) => loadTopicPack(t)));
      const all = packs.flatMap((p) => p.questions);
      const seed = Date.now() % 2147483647;
      const { set, available } = buildPracticeSet(all, filter, seed);
      if (set.length === 0) {
        setPhase({
          kind: "empty",
          message: `Không có câu nào khớp bộ lọc (khả dụng: ${available}). Hãy nới lỏng mức độ, dạng câu hoặc gồm cả câu chưa kiểm duyệt.`,
        });
        return;
      }
      setRunId((n) => n + 1);
      setPhase({ kind: "ready", questions: set, seed });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        setPhase({ kind: "error", code: err.code, message: err.message });
      } else {
        setPhase({ kind: "error", code: "E199", message: "Có lỗi xảy ra. Hãy thử lại sau." });
      }
    }
  }, []);

  // Note is persisted on question change inside PracticeSession.

  if (phase.kind === "filter") {
    return <FilterForm defaultTopic={defaultTopic} onStart={(f) => void start(f)} />;
  }

  if (phase.kind === "loading") {
    return (
      <section aria-busy="true" aria-label="Đang tải" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <h1 className="text-2xl font-bold">Luyện tập</h1>
        <p className="mt-2 text-[var(--ink-muted)]">Đang tải gói câu hỏi…</p>
      </section>
    );
  }

  if (phase.kind === "empty" || phase.kind === "error") {
    const code = phase.kind === "error" ? ` (mã ${phase.code})` : "";
    return (
      <section role="alert" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <h1 className="text-2xl font-bold">Luyện tập</h1>
        <p className="mt-2">
          {phase.message}
          {code}
        </p>
        <button
          type="button"
          onClick={() => setPhase({ kind: "filter" })}
          className="touch-target mt-3 rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-ink)]"
        >
          Đổi bộ lọc
        </button>
      </section>
    );
  }

  return (
    <PracticeSession
      key={runId}
      questions={phase.questions}
      seed={phase.seed}
      onExit={() => setPhase({ kind: "filter" })}
      onRetry={(wrong) => {
        setRunId((n) => n + 1);
        setPhase({ kind: "ready", questions: wrong, seed: phase.seed });
      }}
    />
  );
}

export default function LuyenTapPage() {
  return (
    <Suspense
      fallback={
        <section aria-label="Đang tải" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
          <h1 className="text-2xl font-bold">Luyện tập</h1>
          <p className="mt-2 text-[var(--ink-muted)]">Đang tải…</p>
        </section>
      }
    >
      <LuyenTapInner />
    </Suspense>
  );
}
