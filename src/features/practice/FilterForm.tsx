"use client";

import { useEffect, useState } from "react";
import { loadManifest } from "@/data/content-loader";
import type { PacksManifest } from "@/domain/taxonomy";
import { DEFAULT_FILTER, type PracticeFilter } from "@/domain/practice";
import type { QuestionLevel, QuestionType } from "@/domain/question-schema";
import { LEVEL_LABEL } from "@/domain/exam-config";
import { AppError } from "@/lib/errors";

interface FilterFormProps {
  defaultTopic: string;
  onStart: (filter: PracticeFilter) => void;
}

const TYPE_LABEL: Record<QuestionType, string> = { mcq: "Phần I (A–D)", tf4: "Phần II (Đúng/Sai)" };

export function FilterForm({ defaultTopic, onStart }: FilterFormProps) {
  const [manifest, setManifest] = useState<PacksManifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<PracticeFilter>({ ...DEFAULT_FILTER, topicId: defaultTopic });

  useEffect(() => {
    let cancelled = false;
    loadManifest()
      .then((m) => {
        if (!cancelled) setManifest(m);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof AppError ? `${err.message} (mã ${err.code})` : "Không tải được nội dung.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <section role="alert" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <h1 className="text-2xl font-bold">Luyện tập</h1>
        <p className="mt-2">{error}</p>
      </section>
    );
  }

  if (!manifest) {
    return (
      <section aria-busy="true" aria-label="Đang tải" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <h1 className="text-2xl font-bold">Luyện tập</h1>
        <p className="mt-2 text-[var(--ink-muted)]">Đang tải danh sách chủ đề…</p>
      </section>
    );
  }

  const toggleLevel = (lv: QuestionLevel) =>
    setFilter((f) => ({
      ...f,
      levels: f.levels.includes(lv) ? f.levels.filter((x) => x !== lv) : [...f.levels, lv],
    }));
  const toggleType = (t: QuestionType) =>
    setFilter((f) => ({
      ...f,
      types: f.types.includes(t) ? f.types.filter((x) => x !== t) : [...f.types, t],
    }));

  return (
    <section aria-labelledby="luyen-tap" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
      <h1 id="luyen-tap" className="text-2xl font-bold">
        Luyện tập
      </h1>
      <div className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold">Chủ đề</span>
          <select
            value={filter.topicId}
            onChange={(e) => setFilter((f) => ({ ...f, topicId: e.target.value }))}
            className="touch-target rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3"
          >
            <option value="all">Tất cả chủ đề</option>
            {manifest.packs.map((p) => (
              <option key={p.topicId} value={p.topicId}>
                {p.title} ({p.count} câu)
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend className="text-sm font-semibold">Mức độ</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {(["nb", "th", "vd"] as const).map((lv) => (
              <label key={lv} className="touch-target flex items-center gap-2 rounded-lg border border-[var(--line)] px-3 text-sm">
                <input type="checkbox" checked={filter.levels.includes(lv)} onChange={() => toggleLevel(lv)} />
                {LEVEL_LABEL[lv]}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-semibold">Dạng câu</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {(["mcq", "tf4"] as const).map((t) => (
              <label key={t} className="touch-target flex items-center gap-2 rounded-lg border border-[var(--line)] px-3 text-sm">
                <input type="checkbox" checked={filter.types.includes(t)} onChange={() => toggleType(t)} />
                {TYPE_LABEL[t]}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <span className="font-semibold">Số câu</span>
            <input
              type="number"
              min={1}
              max={150}
              value={filter.count}
              onChange={(e) =>
                setFilter((f) => ({ ...f, count: Math.max(1, Math.min(150, Number(e.target.value) || 1)) }))
              }
              className="touch-target w-20 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filter.includeDraft}
              onChange={(e) => setFilter((f) => ({ ...f, includeDraft: e.target.checked }))}
            />
            Gồm câu chưa kiểm duyệt
          </label>
        </div>
        <button
          type="button"
          disabled={filter.levels.length === 0 || filter.types.length === 0}
          onClick={() => onStart(filter)}
          className="touch-target rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-ink)] disabled:opacity-50"
        >
          Bắt đầu luyện
        </button>
        <p className="text-sm text-[var(--ink-muted)]">
          Phím tắt khi làm bài: A–D chọn đáp án, ←/→ chuyển câu, F đánh dấu.
        </p>
      </div>
    </section>
  );
}
