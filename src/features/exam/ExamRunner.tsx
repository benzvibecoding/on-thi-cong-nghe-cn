"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  countUnanswered,
  emptyTf4,
  formatRemaining,
  msRemaining,
  type ExamMode,
} from "@/domain/exam-session";
import { scoreExam, type ExamAnswers, type ExamScore } from "@/domain/scoring";
import type { McqAnswer } from "@/domain/practice";
import type { ExamSessionRow } from "@/data/db";
import { saveExamSession } from "@/data/exam-sessions";
import { recordPracticeEvent } from "@/data/repositories";
import { PracticeQuestion } from "@/features/practice/PracticeQuestion";
import { ExamResult } from "./ExamResult";
import { cn } from "@/lib/utils";

interface ExamRunnerProps {
  initial: ExamSessionRow;
}

const LETTERS = ["A", "B", "C", "D"] as const;
const LOCK_KEY_PREFIX = "cncn-exam-lock-";

export function ExamRunner({ initial }: ExamRunnerProps) {
  const questions = initial.questions;
  const [answers, setAnswers] = useState<ExamAnswers>(initial.answers);
  const [flags, setFlags] = useState<string[]>(initial.flags);
  const [index, setIndex] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [submitted, setSubmitted] = useState<ExamScore | null>(null);
  const [finalDurations, setFinalDurations] = useState<Record<string, number>>({});
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [tabId, setTabId] = useState<string | null>(null);
  const [foreignTab, setForeignTab] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);

  const answersRef = useRef(answers);
  const durationsRef = useRef<Record<string, number>>({ ...initial.durationsMs });
  const activeRef = useRef<{ qid: string; since: number } | null>(null);
  const submittedRef = useRef(false);
  const initialRef = useRef(initial);

  useEffect(() => {
    answersRef.current = answers;
  });

  // Per-tab id (sessionStorage is unique per tab). One-shot mount init:
  // no re-render loop (empty deps), hence the targeted disable below.
  useEffect(() => {
    let id = sessionStorage.getItem("cncn-tab");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("cncn-tab", id);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-once tab identity
    setTabId(id);
  }, []);

  // Multi-tab guard via localStorage heartbeat (storage events fire in other tabs).
  useEffect(() => {
    if (!tabId) return;
    const key = LOCK_KEY_PREFIX + initialRef.current.id;
    const read = (): { tabId: string; t: number } | null => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as { tabId: string; t: number }) : null;
      } catch {
        return null;
      }
    };
    const check = () => {
      const lock = read();
      setForeignTab(!!lock && lock.tabId !== tabId && Date.now() - lock.t < 8000);
    };
    check();
    const beat = setInterval(() => {
      if (submittedRef.current) return;
      try {
        localStorage.setItem(key, JSON.stringify({ tabId, t: Date.now() }));
      } catch {
        // Storage may be unavailable; exam still works in this tab.
      }
      check();
    }, 3000);
    const onStorage = () => check();
    window.addEventListener("storage", onStorage);
    return () => {
      clearInterval(beat);
      window.removeEventListener("storage", onStorage);
      try {
        const lock = read();
        if (lock && lock.tabId === tabId) localStorage.removeItem(key);
      } catch {
        // ignore
      }
    };
  }, [tabId]);

  // Persist every change (answers, flags, submit state).
  useEffect(() => {
    if (!tabId) return;
    const row = initialRef.current;
    saveExamSession({
      ...row,
      answers,
      flags,
      durationsMs: durationsRef.current,
      submittedAt: submitted ? Date.now() : null,
      autoSubmitted,
      tabId,
    })
      .then(() => setLastSaved(Date.now()))
      .catch(() => {});
  }, [answers, flags, submitted, autoSubmitted, tabId]);

  // Clock on absolute end time — correct across background tabs / sleep.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);

  // Warn before leaving an unsubmitted exam.
  useEffect(() => {
    if (submitted) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [submitted]);

  const touchTimer = useCallback((qid: string) => {
    const nowMs = Date.now();
    const active = activeRef.current;
    if (active) {
      durationsRef.current[active.qid] =
        (durationsRef.current[active.qid] ?? 0) + (nowMs - active.since);
    }
    activeRef.current = { qid, since: nowMs };
  }, []);

  const flushTimer = useCallback(() => {
    const active = activeRef.current;
    if (active) {
      durationsRef.current[active.qid] =
        (durationsRef.current[active.qid] ?? 0) + (Date.now() - active.since);
      activeRef.current = null;
    }
    return { ...durationsRef.current };
  }, []);

  const answerMcq = useCallback(
    (qid: string, letter: Exclude<McqAnswer, null>) => {
      if (submittedRef.current) return;
      touchTimer(qid);
      setAnswers((prev) => ({ ...prev, mcq: { ...prev.mcq, [qid]: letter } }));
    },
    [touchTimer]
  );

  const answerTf4 = useCallback(
    (qid: string, i: number, value: boolean) => {
      if (submittedRef.current) return;
      touchTimer(qid);
      setAnswers((prev) => {
        const cur = prev.tf4[qid] ?? emptyTf4();
        const next = cur.slice();
        next[i] = value;
        return { ...prev, tf4: { ...prev.tf4, [qid]: next } };
      });
    },
    [touchTimer]
  );

  const toggleFlag = useCallback((qid: string) => {
    setFlags((prev) => (prev.includes(qid) ? prev.filter((f) => f !== qid) : [...prev, qid]));
  }, []);

  const goIndex = useCallback(
    (i: number) => {
      const q = questions[Math.max(0, Math.min(questions.length - 1, i))];
      if (q) touchTimer(q.id);
      setIndex(Math.max(0, Math.min(questions.length - 1, i)));
    },
    [questions, touchTimer]
  );

  const doSubmit = useCallback(
    (auto: boolean) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      const durations = flushTimer();
      setFinalDurations(durations);
      setAutoSubmitted(auto);
      const finalAnswers = answersRef.current;
      const examScore = scoreExam(questions, finalAnswers);
      // Feed exam results into practice events so M6 stats cover mock exams.
      // correct = full marks; tf4 keeps its 0-4 statement count.
      examScore.scores.forEach((s, i) => {
        const q = questions[i]!;
        recordPracticeEvent({
          questionId: q.id,
          topicId: q.topicId,
          level: q.level,
          qtype: q.type,
          correct: s.points === s.maxPoints,
          correctCount: s.correctCount,
          durationMs: durations[q.id] ?? 0,
        }).catch(() => {});
      });
      setSubmitted(examScore);
      setConfirming(false);
    },
    [flushTimer, questions]
  );

  // Auto-submit exactly at the deadline.
  const remaining = submitted ? 0 : msRemaining(initial.endsAt, now);
  useEffect(() => {
    if (!submitted && remaining <= 0) doSubmit(true);
  }, [remaining, submitted, doSubmit]);

  // Start timing the first question on mount.
  useEffect(() => {
    const q = initialRef.current.questions[0];
    if (q && !submittedRef.current) {
      activeRef.current = { qid: q.id, since: Date.now() };
    }
  }, []);

  if (submitted) {
    return (
      <ExamResult
        questions={questions}
        durationsMs={finalDurations}
        score={submitted}
        seed={initial.seed}
        full={initial.full}
        autoSubmitted={autoSubmitted}
      />
    );
  }

  const unanswered = countUnanswered(questions, answers);
  const mode: ExamMode = initial.mode;
  const lowTime = remaining <= 5 * 60 * 1000;

  return (
    <div className="flex flex-col gap-3">
      {foreignTab && (
        <div role="alert" className="rounded-xl border border-[var(--copper)] p-3 text-sm">
          <p className="font-semibold">Phiên này có thể đang mở ở tab khác.</p>
          <p className="text-[var(--ink-muted)]">
            Bài làm ở tab này vẫn lưu bình thường. Nếu tab kia đã đóng, cứ tiếp tục làm bài.
          </p>
        </div>
      )}
      <div
        className={cn(
          "sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-[var(--bg-raised)] p-3",
          lowTime ? "border-[var(--copper)]" : "border-[var(--line)]"
        )}
        role="timer"
        aria-live="off"
        aria-label={`Thời gian còn lại ${formatRemaining(remaining)}`}
      >
        <p className={cn("font-mono text-xl font-bold", lowTime && "text-[var(--copper)]")}>
          {formatRemaining(remaining)}
        </p>
        <p className="text-xs text-[var(--ink-muted)]">
          {lastSaved ? `Đã tự lưu ${new Date(lastSaved).toLocaleTimeString("vi-VN")}` : "Đang lưu…"}
          {initial.full ? "" : " • Đề rút gọn"}
        </p>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="touch-target rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-ink)]"
        >
          Nộp bài
        </button>
      </div>

      {mode === "paper" ? (
        <PaperMode
          questions={questions}
          answers={answers}
          flags={flags}
          onMcq={answerMcq}
          onTf4={answerTf4}
          onFlag={toggleFlag}
        />
      ) : (
        <ComputerMode
          questions={questions}
          answers={answers}
          flags={flags}
          index={index}
          onIndex={goIndex}
          onMcq={answerMcq}
          onTf4={answerTf4}
          onFlag={toggleFlag}
        />
      )}

      {confirming && (
        <div role="dialog" aria-modal="true" aria-labelledby="xac-nhan-nop" className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-[var(--bg-raised)] p-5">
            <h2 id="xac-nhan-nop" className="text-lg font-bold">
              Xác nhận nộp bài?
            </h2>
            <p className="mt-2 text-[15px]">
              {unanswered === 0
                ? "Bạn đã làm hết các câu."
                : `Còn ${unanswered} câu chưa làm xong.`}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => doSubmit(false)}
                className="touch-target flex-1 rounded-lg bg-[var(--accent)] font-semibold text-[var(--accent-ink)]"
              >
                Nộp bài
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="touch-target flex-1 rounded-lg border border-[var(--line)]"
              >
                Làm tiếp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ModeProps {
  questions: ExamSessionRow["questions"];
  answers: ExamAnswers;
  flags: string[];
  onMcq: (qid: string, letter: Exclude<McqAnswer, null>) => void;
  onTf4: (qid: string, i: number, value: boolean) => void;
  onFlag: (qid: string) => void;
}

/** Che do "Giay": cuon mot trang + phieu tra loi kieu OMR. */
function PaperMode({ questions, answers, onMcq, onTf4, onFlag, flags }: ModeProps) {
  const mcqs = questions.filter((q) => q.type === "mcq");
  const tf4s = questions.filter((q) => q.type === "tf4");
  return (
    <div className="flex flex-col gap-4">
      <section aria-label="Phiếu trả lời" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
        <h2 className="font-bold">Phiếu trả lời (chạm để chọn)</h2>
        <ol className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
          {mcqs.map((q, i) => (
            <li key={q.id} className="flex items-center gap-1">
              <span className="w-7 font-mono text-sm">{i + 1}.</span>
              {LETTERS.map((letter) => (
                <button
                  key={letter}
                  type="button"
                  aria-pressed={answers.mcq[q.id] === letter}
                  aria-label={`Câu ${i + 1} chọn ${letter}`}
                  onClick={() => onMcq(q.id, letter)}
                  className={cn(
                    "touch-target min-w-9 flex-1 rounded-full border font-mono text-sm",
                    answers.mcq[q.id] === letter
                      ? "border-[var(--accent)] bg-[var(--bg-sunken)] font-bold"
                      : "border-[var(--line)]"
                  )}
                >
                  {letter}
                </button>
              ))}
            </li>
          ))}
        </ol>
        <ol className="mt-3 flex flex-col gap-1">
          {tf4s.map((q, i) => (
            <li key={q.id} className="flex items-center gap-1">
              <span className="w-7 font-mono text-sm">{mcqs.length + i + 1}.</span>
              {(["a", "b", "c", "d"] as const).map((key, si) => {
                const val = (answers.tf4[q.id] ?? emptyTf4())[si];
                return (
                  <span key={key} className="flex flex-1 items-center gap-1">
                    <span className="font-mono text-xs">{key}</span>
                    {([true, false] as const).map((v) => (
                      <button
                        key={v ? "D" : "S"}
                        type="button"
                        aria-pressed={val === v}
                        aria-label={`Câu ${mcqs.length + i + 1} ý ${key} ${v ? "Đúng" : "Sai"}`}
                        onClick={() => onTf4(q.id, si, v)}
                        className={cn(
                          "touch-target min-w-9 flex-1 rounded-lg border text-sm font-semibold",
                          val === v ? "border-[var(--accent)] bg-[var(--bg-sunken)]" : "border-[var(--line)]"
                        )}
                      >
                        {v ? "Đ" : "S"}
                      </button>
                    ))}
                  </span>
                );
              })}
            </li>
          ))}
        </ol>
      </section>
      {questions.map((q, i) => (
        <section key={q.id} aria-label={`Câu ${i + 1}`} className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-bold">Câu {i + 1}</p>
            <button
              type="button"
              aria-pressed={flags.includes(q.id)}
              onClick={() => onFlag(q.id)}
              className={cn(
                "touch-target rounded-lg border px-3 text-sm",
                flags.includes(q.id) ? "border-[var(--copper)] font-bold text-[var(--copper)]" : "border-[var(--line)]"
              )}
            >
              {flags.includes(q.id) ? "★ Xem lại" : "☆ Xem lại"}
            </button>
          </div>
          <PracticeQuestion
            question={q}
            mcqAnswer={answers.mcq[q.id] ?? null}
            tf4Answer={answers.tf4[q.id] ?? emptyTf4()}
            showFeedback={false}
            onMcq={(letter) => onMcq(q.id, letter)}
            onTf4={(si, v) => onTf4(q.id, si, v)}
          />
        </section>
      ))}
    </div>
  );
}

/** Che do "May tinh": 1 cau/man hinh + bang dieu huong. */
function ComputerMode({ questions, answers, flags, index, onIndex, onMcq, onTf4, onFlag }: ModeProps & { index: number; onIndex: (i: number) => void }) {
  const q = questions[index]!;
  const answered = (qq: (typeof questions)[number]) =>
    qq.type === "mcq"
      ? (answers.mcq[qq.id] ?? null) !== null
      : (answers.tf4[qq.id] ?? emptyTf4()).every((v) => v !== null);
  return (
    <div className="flex flex-col gap-3">
      <nav aria-label="Điều hướng câu hỏi" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-3">
        <ol className="grid grid-cols-7 gap-1 sm:grid-cols-10">
          {questions.map((qq, i) => (
            <li key={qq.id}>
              <button
                type="button"
                onClick={() => onIndex(i)}
                aria-current={i === index ? "true" : undefined}
                aria-label={`Câu ${i + 1}${answered(qq) ? ", đã làm" : ", chưa làm"}${flags.includes(qq.id) ? ", cần xem lại" : ""}`}
                className={cn(
                  "touch-target w-full rounded-lg border font-mono text-sm",
                  i === index && "border-[var(--accent)] font-bold",
                  answered(qq) ? "bg-[var(--bg-sunken)]" : "border-[var(--line)]",
                  flags.includes(qq.id) && "underline decoration-[var(--copper)] decoration-2"
                )}
              >
                {i + 1}
              </button>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-[var(--ink-muted)]">
          Ô đậm: đã làm • Gạch dưới cam: cần xem lại • Viền xanh: đang làm
        </p>
      </nav>
      <section aria-label={`Câu ${index + 1}`} className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-bold">Câu {index + 1}/{questions.length}</p>
          <button
            type="button"
            aria-pressed={flags.includes(q.id)}
            onClick={() => onFlag(q.id)}
            className={cn(
              "touch-target rounded-lg border px-3 text-sm",
              flags.includes(q.id) ? "border-[var(--copper)] font-bold text-[var(--copper)]" : "border-[var(--line)]"
            )}
          >
            {flags.includes(q.id) ? "★ Xem lại" : "☆ Xem lại"}
          </button>
        </div>
        <PracticeQuestion
          question={q}
          mcqAnswer={answers.mcq[q.id] ?? null}
          tf4Answer={answers.tf4[q.id] ?? emptyTf4()}
          showFeedback={false}
          onMcq={(letter) => onMcq(q.id, letter)}
          onTf4={(si, v) => onTf4(q.id, si, v)}
        />
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onIndex(index - 1)}
            className="touch-target flex-1 rounded-lg border border-[var(--line)] disabled:opacity-40"
          >
            ← Trước
          </button>
          <button
            type="button"
            disabled={index === questions.length - 1}
            onClick={() => onIndex(index + 1)}
            className="touch-target flex-1 rounded-lg border border-[var(--line)] disabled:opacity-40"
          >
            Sau →
          </button>
        </div>
      </section>
    </div>
  );
}
