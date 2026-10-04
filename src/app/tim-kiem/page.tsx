"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadManifest, loadTopicPack } from "@/data/content-loader";
import { searchAll, type SearchCorpus } from "@/lib/search";
import { MathText } from "@/components/math/MathText";
import { AppError } from "@/lib/errors";

export default function TimKiemPage() {
  const [query, setQuery] = useState("");
  const [corpus, setCorpus] = useState<SearchCorpus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const manifest = await loadManifest();
        const packs = await Promise.all(manifest.packs.map((p) => loadTopicPack(p.topicId)));
        if (cancelled) return;
        setCorpus({
          lessons: packs
            .filter((p) => p.lesson)
            .map((p) => ({ topicId: p.topicId, title: p.title, lesson: p.lesson! })),
          cards: packs.flatMap((p) => p.flashcards),
          questions: packs.flatMap((p) => p.questions),
        });
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof AppError ? `${err.message} (mã ${err.code})` : "Không tải được nội dung.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hits = useMemo(() => (corpus ? searchAll(corpus, query) : null), [corpus, query]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Tìm kiếm</h1>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-semibold">Từ khóa (gõ không dấu vẫn được)</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="VD: dien tro, dinh luat ohm, cong AND…"
          aria-label="Từ khóa tìm kiếm"
          className="touch-target rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] px-3"
        />
      </label>
      {error && <p role="alert" className="text-sm">{error}</p>}
      {!corpus && !error && <p className="text-[var(--ink-muted)]">Đang tải nội dung…</p>}
      {hits && query.trim().length >= 2 && (
        <div className="flex flex-col gap-4">
          <section aria-label="Bài học">
            <h2 className="font-bold">Bài học ({hits.lessons.length})</h2>
            {hits.lessons.map((l) => (
              <Link key={l.topicId} href={`/hoc/${l.topicId}`} className="touch-target mt-1 block rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-3">
                {l.title}
              </Link>
            ))}
          </section>
          <section aria-label="Thẻ ghi nhớ">
            <h2 className="font-bold">Thẻ ghi nhớ ({hits.cards.length})</h2>
            {hits.cards.map((c) => (
              <div key={c.id} className="mt-1 rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-3 text-sm">
                <MathText text={`**${c.front}** — ${c.back}`} />
              </div>
            ))}
          </section>
          <section aria-label="Câu hỏi">
            <h2 className="font-bold">Câu hỏi ({hits.questions.length})</h2>
            {hits.questions.map((q) => (
              <Link key={q.id} href={`/luyen-tap?topic=${q.topicId}`} className="touch-target mt-1 block rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-3 text-sm">
                <MathText text={q.stem} />
              </Link>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}
