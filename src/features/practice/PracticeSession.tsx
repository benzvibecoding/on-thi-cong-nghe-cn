"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  gradeMcq,
  gradeTf4,
  type McqAnswer,
  type Tf4Answer,
} from "@/domain/practice";
import type { Question } from "@/domain/question-schema";
import { PracticeQuestion } from "./PracticeQuestion";
import {
  getNote,
  isBookmarked,
  recordPracticeEvent,
  reportShareText,
  saveNote,
  saveReport,
  toggleBookmark,
} from "@/data/repositories";
import { cn } from "@/lib/utils";

interface PracticeSessionProps {
  questions: Question[];
  seed: number;
  onExit: () => void;
  onRetry: (questions: Question[]) => void;
}

const REPORT_CATEGORIES = ["Nội dung sai", "Đáp án sai", "Chính tả", "Hình vẽ", "Khác"];

export function PracticeSession({ questions, seed, onExit, onRetry }: PracticeSessionProps) {
  const [index, setIndex] = useState(0);
  const [instant, setInstant] = useState(true);
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, McqAnswer>>({});
  const [tf4Answers, setTf4Answers] = useState<Record<string, Tf4Answer>>({});
  const [locked, setLocked] = useState<Set<string>>(new Set());
  const [finished, setFinished] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [note, setNote] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportCat, setReportCat] = useState(REPORT_CATEGORIES[0]!);
  const [reportDetail, setReportDetail] = useState("");
  const [reportDone, setReportDone] = useState<string | null>(null);

  const question = questions[index]!;
  const startRef = useRef<number>(0);
  const recordedRef = useRef<Set<string>>(new Set());
  const noteRef = useRef("");

  // Sync latest note text for the unmount/question-change save below.
  useEffect(() => {
    noteRef.current = note;
  });

  const record = useCallback(
    (q: Question, correct: boolean, correctCount: number) => {
      if (recordedRef.current.has(q.id)) return;
      recordedRef.current.add(q.id);
      const durationMs = Date.now() - startRef.current;
      // Best-effort telemetry for M6 stats; failures must not block practice.
      recordPracticeEvent({
        questionId: q.id,
        topicId: q.topicId,
        level: q.level,
        qtype: q.type,
        correct,
        correctCount,
        durationMs,
      }).catch(() => {});
    },
    []
  );

  const lock = useCallback(
    (q: Question, correct: boolean, correctCount: number) => {
      setLocked((prev) => new Set(prev).add(q.id));
      record(q, correct, correctCount);
    },
    [record]
  );

  const handleMcq = useCallback(
    (answer: Exclude<McqAnswer, null>) => {
      setMcqAnswers((prev) => ({ ...prev, [question.id]: answer }));
      if (instant && !locked.has(question.id)) {
        const correct = gradeMcq(question, answer);
        lock(question, correct, correct ? 1 : 0);
      }
    },
    [instant, locked, lock, question]
  );

  const handleTf4 = useCallback(
    (i: number, value: boolean) => {
      const prev = tf4Answers[question.id] ?? [null, null, null, null];
      const next = prev.slice();
      next[i] = value;
      setTf4Answers((all) => ({ ...all, [question.id]: next }));
      if (instant && !locked.has(question.id) && next.every((v) => v !== null)) {
        const grade = gradeTf4(question, next);
        lock(question, grade.allCorrect, grade.correctCount);
      }
    },
    [instant, locked, lock, question, tf4Answers]
  );

  // Load bookmark + note when the question changes; persist note on leave.
  useEffect(() => {
    startRef.current = Date.now();
    let cancelled = false;
    isBookmarked(question.id)
      .then((v) => {
        if (!cancelled) setBookmarked(v);
      })
      .catch(() => {});
    getNote(question.id)
      .then((t) => {
        if (!cancelled) setNote(t);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      const text = noteRef.current;
      saveNote(question.id, text).catch(() => {});
    };
  }, [question.id]);

  // Keyboard shortcuts (ignored while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (finished) return;
      const k = e.key.toLowerCase();
      if (["a", "b", "c", "d"].includes(k) && question.type === "mcq" && !locked.has(question.id)) {
        handleMcq(k.toUpperCase() as Exclude<McqAnswer, null>);
      } else if (e.key === "ArrowRight") {
        setIndex((i) => Math.min(questions.length - 1, i + 1));
      } else if (e.key === "ArrowLeft") {
        setIndex((i) => Math.max(0, i - 1));
      } else if (k === "f") {
        void toggleBookmark(question.id, question.topicId)
          .then(setBookmarked)
          .catch(() => {});
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finished, handleMcq, locked, question, questions.length]);

  const answeredCount =
    questions.filter((q) =>
      q.type === "mcq" ? mcqAnswers[q.id] != null : (tf4Answers[q.id] ?? []).every((v) => v !== null)
    ).length;

  const gradeOf = (q: Question): boolean =>
    q.type === "mcq"
      ? gradeMcq(q, mcqAnswers[q.id] ?? null)
      : gradeTf4(q, tf4Answers[q.id] ?? [null, null, null, null]).allCorrect;

  const countOf = (q: Question): number =>
    q.type === "mcq"
      ? gradeOf(q) ? 1 : 0
      : gradeTf4(q, tf4Answers[q.id] ?? [null, null, null, null]).correctCount;

  const finishAll = () => {
    for (const q of questions) {
      if (!recordedRef.current.has(q.id)) {
        record(q, gradeOf(q), countOf(q));
      }
    }
    saveNote(question.id, noteRef.current).catch(() => {});
    setFinished(true);
  };

  if (finished) {
    const correct = questions.filter(gradeOf).length;
    const wrong = questions.filter((q) => !gradeOf(q));
    return (
      <section aria-labelledby="ket-qua" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <h1 id="ket-qua" className="text-2xl font-bold">
          Kết quả luyện tập
        </h1>
        <p className="mt-2 text-lg">
          Đúng <span className="font-bold text-[var(--accent)]">{correct}/{questions.length}</span>
          {questions.length > 0 && ` (${Math.round((correct / questions.length) * 100)}%)`}
          {seed !== 0 && <span className="text-sm text-[var(--ink-muted)]"> • seed {seed}</span>}
        </p>
        {wrong.length > 0 ? (
          <div className="mt-3">
            <p className="font-semibold">Câu làm sai ({wrong.length}):</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {wrong.map((q) => (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setIndex(questions.indexOf(q));
                      setFinished(false);
                    }}
                    className="touch-target rounded-lg border border-[var(--line)] px-3 text-sm"
                  >
                    Câu {questions.indexOf(q) + 1}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-3 font-semibold text-[var(--accent)]">Tuyệt vời, đúng hết!</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {wrong.length > 0 && (
            <button
              type="button"
              onClick={() => onRetry(wrong)}
              className="touch-target rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-ink)]"
            >
              Luyện lại {wrong.length} câu sai
            </button>
          )}
          <button
            type="button"
            onClick={onExit}
            className="touch-target rounded-lg border border-[var(--line)] px-4"
          >
            Đổi bộ lọc
          </button>
        </div>
      </section>
    );
  }

  const showFeedback = instant && locked.has(question.id);

  return (
    <section aria-label="Phiên luyện tập" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-3 text-sm">
        <p className="font-semibold">
          Câu {index + 1}/{questions.length} • Đã làm {answeredCount}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={instant} onChange={(e) => setInstant(e.target.checked)} />
            Phản hồi tức thì
          </label>
          <button
            type="button"
            aria-pressed={bookmarked}
            onClick={() =>
              toggleBookmark(question.id, question.topicId).then(setBookmarked).catch(() => {})
            }
            className={cn(
              "touch-target rounded-lg border px-3",
              bookmarked ? "border-[var(--copper)] font-bold text-[var(--copper)]" : "border-[var(--line)]"
            )}
          >
            {bookmarked ? "★ Đã dấu" : "☆ Đánh dấu (F)"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
        <PracticeQuestion
          question={question}
          mcqAnswer={mcqAnswers[question.id] ?? null}
          tf4Answer={tf4Answers[question.id] ?? [null, null, null, null]}
          showFeedback={showFeedback}
          onMcq={handleMcq}
          onTf4={handleTf4}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          className="touch-target flex-1 rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] disabled:opacity-40"
        >
          ← Trước
        </button>
        <button
          type="button"
          disabled={index === questions.length - 1}
          onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
          className="touch-target flex-1 rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] disabled:opacity-40"
        >
          Sau →
        </button>
        <button
          type="button"
          onClick={finishAll}
          className="touch-target flex-1 rounded-lg bg-[var(--accent)] font-semibold text-[var(--accent-ink)]"
        >
          Chấm bài
        </button>
      </div>

      <details className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
        <summary className="touch-target cursor-pointer font-semibold">Ghi chú cá nhân</summary>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => saveNote(question.id, note).catch(() => {})}
          placeholder="Ghi chú riêng cho câu này (tự lưu khi rời ô)…"
          rows={3}
          maxLength={2000}
          className="mt-2 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] p-2 text-[15px]"
        />
      </details>

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
        {!reportOpen ? (
          <button type="button" onClick={() => setReportOpen(true)} className="touch-target text-sm underline">
            Báo lỗi câu này
          </button>
        ) : reportDone ? (
          <div role="status" className="text-sm">
            <p className="font-semibold">Đã lưu báo lỗi. Cảm ơn bạn!</p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-[var(--bg-sunken)] p-2">{reportDone}</pre>
            <button
              type="button"
              onClick={() => {
                const text = reportDone;
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(text).catch(() => {});
                }
              }}
              className="touch-target mt-2 rounded-lg border border-[var(--line)] px-3"
            >
              Sao chép nội dung
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = {
                questionId: question.id,
                questionVersion: question.version,
                category: reportCat,
                detail: reportDetail,
              };
              saveReport(input)
                .then(() => setReportDone(reportShareText(input)))
                .catch(() => setReportDone(reportShareText(input)));
            }}
            className="flex flex-col gap-2 text-sm"
          >
            <label className="flex flex-col gap-1">
              <span className="font-semibold">Loại lỗi</span>
              <select
                value={reportCat}
                onChange={(e) => setReportCat(e.target.value)}
                className="touch-target rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2"
              >
                {REPORT_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-semibold">Chi tiết</span>
              <textarea
                value={reportDetail}
                onChange={(e) => setReportDetail(e.target.value)}
                required
                rows={2}
                maxLength={1000}
                className="rounded-lg border border-[var(--line)] bg-[var(--bg)] p-2"
              />
            </label>
            <div className="flex gap-2">
              <button type="submit" className="touch-target rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-ink)]">
                Gửi báo lỗi
              </button>
              <button type="button" onClick={() => setReportOpen(false)} className="touch-target rounded-lg border border-[var(--line)] px-4">
                Hủy
              </button>
            </div>
          </form>
        )}
      </div>

      <button type="button" onClick={onExit} className="touch-target text-sm text-[var(--ink-muted)] underline">
        Thoát phiên luyện
      </button>
    </section>
  );
}
