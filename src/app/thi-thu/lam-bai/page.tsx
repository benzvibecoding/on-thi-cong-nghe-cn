"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { ExamSessionRow } from "@/data/db";
import { loadExamSession } from "@/data/exam-sessions";
import { ExamRunner } from "@/features/exam/ExamRunner";
import { AppError } from "@/lib/errors";

function LamBaiInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "ready"; row: ExamSessionRow }
    | { kind: "error"; message: string }
  >(() =>
    id
      ? { kind: "loading" }
      : { kind: "error", message: "Thiếu mã phiên thi. Hãy bắt đầu lại từ trang Thi thử." }
  );

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    loadExamSession(id)
      .then((row) => {
        if (cancelled) return;
        if (!row || row.questions.length === 0) {
          setState({ kind: "error", message: "Không tìm thấy phiên thi này trên thiết bị." });
        } else {
          setState({ kind: "ready", row });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            kind: "error",
            message: err instanceof AppError ? `${err.message} (mã ${err.code})` : "Có lỗi xảy ra.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.kind === "loading") {
    return (
      <section aria-busy="true" aria-label="Đang tải" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <h1 className="text-2xl font-bold">Bài thi</h1>
        <p className="mt-2 text-[var(--ink-muted)]">Đang khôi phục phiên thi…</p>
      </section>
    );
  }

  if (state.kind === "error") {
    return (
      <section role="alert" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <h1 className="text-2xl font-bold">Bài thi</h1>
        <p className="mt-2">{state.message}</p>
        <a href="/thi-thu" className="mt-3 inline-block underline">
          Về trang Thi thử
        </a>
      </section>
    );
  }

  return <ExamRunner key={state.row.id} initial={state.row} />;
}

export default function LamBaiPage() {
  return (
    <Suspense
      fallback={
        <section aria-label="Đang tải" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
          <h1 className="text-2xl font-bold">Bài thi</h1>
          <p className="mt-2 text-[var(--ink-muted)]">Đang tải…</p>
        </section>
      }
    >
      <LamBaiInner />
    </Suspense>
  );
}
