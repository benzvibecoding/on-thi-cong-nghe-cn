"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { loadTopicPack } from "@/data/content-loader";
import type { TopicPack } from "@/domain/taxonomy";
import { FLASHCARD_KIND_LABEL } from "@/domain/flashcards";
import { MathText } from "@/components/math/MathText";
import { AppError } from "@/lib/errors";

export default function TopicLessonPage() {
  const params = useParams<{ topicId: string }>();
  const topicId = params.topicId;
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "ready"; pack: TopicPack }
    | { kind: "error"; code: string; message: string }
  >({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    loadTopicPack(topicId)
      .then((pack) => {
        if (!cancelled) setState({ kind: "ready", pack });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState(
            err instanceof AppError
              ? { kind: "error", code: err.code, message: err.message }
              : { kind: "error", code: "E199", message: "Có lỗi xảy ra. Hãy thử lại sau." }
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [topicId]);

  if (state.kind === "loading") {
    return (
      <section aria-busy="true" aria-label="Đang tải" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <p className="text-[var(--ink-muted)]">Đang tải bài học…</p>
      </section>
    );
  }

  if (state.kind === "error") {
    return (
      <section role="alert" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <p>
          {state.message} (mã {state.code})
        </p>
        <Link href="/hoc" className="mt-3 inline-block underline">
          Về danh sách chủ đề
        </Link>
      </section>
    );
  }

  const { pack } = state;
  return (
    <article className="flex flex-col gap-4">
      <nav aria-label="Đường dẫn" className="text-sm text-[var(--ink-muted)]">
        <Link href="/hoc" className="underline">
          Học theo chủ đề
        </Link>{" "}
        / {pack.title}
      </nav>
      <section aria-labelledby="bai-hoc" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <h1 id="bai-hoc" className="text-2xl font-bold">
          {pack.lesson?.title ?? pack.title}
        </h1>
        {pack.lesson ? (
          <MathText text={pack.lesson.body} className="mt-3" />
        ) : (
          <p className="mt-2 text-[var(--ink-muted)]">Bài học đang biên soạn (mã E102).</p>
        )}
        <Link
          href={`/luyen-tap?topic=${pack.topicId}`}
          className="touch-target mt-4 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--accent-ink)]"
        >
          Luyện {pack.questions.length} câu chủ đề này
        </Link>
      </section>
      {pack.flashcards.length > 0 && (
        <section aria-label="Thẻ ghi nhớ" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
          <h2 className="text-lg font-bold">Thẻ ghi nhớ ({pack.flashcards.length})</h2>
          <ul className="mt-2 space-y-2 text-[15px]">
            {pack.flashcards.map((c) => (
              <li key={c.id} className="rounded-lg bg-[var(--bg-sunken)] px-3 py-2">
                <span className="text-xs font-semibold text-[var(--copper)]">
                  {FLASHCARD_KIND_LABEL[c.kind]}
                </span>
                <MathText text={`**${c.front}** — ${c.back}`} />
              </li>
            ))}
          </ul>
          <Link href="/on-tap" className="mt-3 inline-block underline">
            Ôn bằng SRS tại trang Ôn tập
          </Link>
        </section>
      )}
    </article>
  );
}
