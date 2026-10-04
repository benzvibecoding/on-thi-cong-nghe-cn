"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadManifest } from "@/data/content-loader";
import type { PacksManifest } from "@/domain/taxonomy";
import { AppError } from "@/lib/errors";

type State =
  | { kind: "loading" }
  | { kind: "ready"; manifest: PacksManifest }
  | { kind: "error"; code: string; message: string };

export default function HocPage() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    loadManifest()
      .then((manifest) => {
        if (!cancelled) setState({ kind: "ready", manifest });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof AppError) {
          setState({ kind: "error", code: err.code, message: err.message });
        } else {
          setState({ kind: "error", code: "E199", message: "Có lỗi xảy ra. Hãy thử lại sau." });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "loading") {
    return (
      <section aria-label="Đang tải" aria-busy="true" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <h1 className="text-2xl font-bold">Học theo chủ đề</h1>
        <p className="mt-2 text-[var(--ink-muted)]">Đang tải danh sách chủ đề…</p>
      </section>
    );
  }

  if (state.kind === "error") {
    return (
      <section role="alert" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <h1 className="text-2xl font-bold">Học theo chủ đề</h1>
        <p className="mt-2">
          {state.message} (mã {state.code})
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="touch-target mt-3 rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-ink)]"
        >
          Thử lại
        </button>
      </section>
    );
  }

  if (state.manifest.packs.length === 0) {
    return (
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <h1 className="text-2xl font-bold">Học theo chủ đề</h1>
        <p className="mt-2 text-[var(--ink-muted)]">Chưa có gói nội dung nào (mã E102).</p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Học theo chủ đề</h1>
      <ul className="grid gap-3 sm:grid-cols-2">
        {state.manifest.packs.map((pack) => (
          <li key={pack.topicId}>
            <Link
              href={`/hoc/${pack.topicId}`}
              className="touch-target block rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4 hover:border-[var(--accent)]"
            >
              <span className="font-semibold">{pack.title}</span>
              <span className="block text-sm text-[var(--ink-muted)]">
                {pack.count} câu hỏi • {pack.cards} thẻ ghi nhớ (chưa kiểm duyệt)
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
