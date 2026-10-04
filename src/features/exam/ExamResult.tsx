"use client";

import { useMemo, useState } from "react";
import { LEVEL_LABEL } from "@/domain/exam-config";
import type { ExamScore } from "@/domain/scoring";
import type { Question } from "@/domain/question-schema";
import { QuestionView } from "@/components/question/QuestionView";
import { PracticeSession } from "@/features/practice/PracticeSession";
import { formatScore } from "@/lib/utils";

interface ExamResultProps {
  questions: Question[];
  durationsMs: Record<string, number>;
  score: ExamScore;
  seed: number;
  full: boolean;
  autoSubmitted: boolean;
}

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} giây`;
  return `${Math.floor(s / 60)} phút ${s % 60} giây`;
}

export function ExamResult({
  questions,
  durationsMs,
  score,
  seed,
  full,
  autoSubmitted,
}: ExamResultProps) {
  const [retrying, setRetrying] = useState(false);
  const byId = useMemo(() => new Map(score.scores.map((s) => [s.questionId, s])), [score]);

  const topicRows = useMemo(() => {
    const map = new Map<string, { total: number; points: number; max: number; full: number }>();
    for (const q of questions) {
      const s = byId.get(q.id)!;
      const cur = map.get(q.topicId) ?? { total: 0, points: 0, max: 0, full: 0 };
      cur.total += 1;
      cur.points += s.points;
      cur.max += s.maxPoints;
      if (s.points === s.maxPoints) cur.full += 1;
      map.set(q.topicId, cur);
    }
    return [...map.entries()];
  }, [questions, byId]);

  const levelRows = useMemo(() => {
    const map = new Map<string, { total: number; full: number }>();
    for (const q of questions) {
      const s = byId.get(q.id)!;
      const cur = map.get(q.level) ?? { total: 0, full: 0 };
      cur.total += 1;
      if (s.points === s.maxPoints) cur.full += 1;
      map.set(q.level, cur);
    }
    return [...map.entries()];
  }, [questions, byId]);

  if (retrying) {
    const wrong = questions.filter((q) => {
      const s = byId.get(q.id)!;
      return s.points < s.maxPoints;
    });
    return (
      <PracticeSession
        questions={wrong}
        seed={seed}
        onExit={() => setRetrying(false)}
        onRetry={(w) => setRetrying(w.length > 0)}
      />
    );
  }

  const wrongCount = questions.filter((q) => {
    const s = byId.get(q.id)!;
    return s.points < s.maxPoints;
  }).length;

  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby="ket-qua-thi" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5 text-center">
        <h1 id="ket-qua-thi" className="text-2xl font-bold">
          Kết quả thi thử
        </h1>
        {autoSubmitted && (
          <p className="mt-1 text-sm text-[var(--copper)]">Hết giờ nên bài đã tự nộp.</p>
        )}
        {!full && (
          <p className="mt-1 text-sm text-[var(--copper)]">
            Đề rút gọn ({questions.length} câu): điểm dưới đây không theo thang chuẩn 10 điểm của đề chính thức.
          </p>
        )}
        <p className="mt-2 font-mono text-5xl font-bold text-[var(--accent)]">
          {formatScore(score.totalPoints)}
          <span className="text-xl text-[var(--ink-muted)]">/10</span>
        </p>
        <dl className="mx-auto mt-3 grid max-w-md grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-[var(--bg-sunken)] p-2">
            <dt className="text-[var(--ink-muted)]">Phần I</dt>
            <dd className="font-bold">
              {formatScore(score.part1Points)} • đúng {score.correctMcq} câu
            </dd>
          </div>
          <div className="rounded-xl bg-[var(--bg-sunken)] p-2">
            <dt className="text-[var(--ink-muted)]">Phần II</dt>
            <dd className="font-bold">
              {formatScore(score.part2Points)} • đúng trọn {score.fullyCorrectTf4} câu
            </dd>
          </div>
        </dl>
        {wrongCount > 0 && (
          <button
            type="button"
            onClick={() => setRetrying(true)}
            className="touch-target mt-3 rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-ink)]"
          >
            Luyện lại {wrongCount} câu sai
          </button>
        )}
      </section>

      <section aria-labelledby="phan-tich" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <h2 id="phan-tich" className="text-lg font-bold">
          Phân tích theo chủ đề và mức độ
        </h2>
        <h3 className="mt-3 text-sm font-semibold">Theo chủ đề</h3>
        <ul className="mt-1 space-y-1 text-sm">
          {topicRows.map(([topicId, r]) => (
            <li key={topicId} className="flex justify-between gap-2 rounded-lg bg-[var(--bg-sunken)] px-3 py-2">
              <span className="font-mono">{topicId}</span>
              <span>
                {r.full}/{r.total} câu trọn điểm • {formatScore(r.points)}/{formatScore(r.max)} điểm
              </span>
            </li>
          ))}
        </ul>
        <h3 className="mt-3 text-sm font-semibold">Theo mức độ</h3>
        <ul className="mt-1 space-y-1 text-sm">
          {levelRows.map(([level, r]) => (
            <li key={level} className="flex justify-between gap-2 rounded-lg bg-[var(--bg-sunken)] px-3 py-2">
              <span>{LEVEL_LABEL[level as keyof typeof LEVEL_LABEL]}</span>
              <span>
                {r.full}/{r.total} câu trọn điểm
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Xem lại từng câu" className="flex flex-col gap-3">
        {questions.map((q, i) => {
          const s = byId.get(q.id)!;
          return (
            <div key={q.id} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <p className="font-bold">
                  Câu {i + 1} • {formatScore(s.points)}/{formatScore(s.maxPoints)} điểm
                </p>
                <p className="text-[var(--ink-muted)]">
                  {q.type === "tf4" ? `Đúng ${s.correctCount}/4 ý • ` : ""}
                  {formatDuration(durationsMs[q.id] ?? 0)}
                </p>
              </div>
              <QuestionView question={q} showAnswer />
            </div>
          );
        })}
      </section>

      <pre className="sr-only">seed {seed}</pre>
    </div>
  );
}
