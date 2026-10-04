"use client";

import { useState } from "react";
import { AI_LABEL, AI_UNAVAILABLE, type AiMode } from "@/domain/ai";
import type { Question } from "@/domain/question-schema";

interface AiExplainProps {
  question: Question;
}

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; text: string; cached: boolean }
  | { kind: "error"; message: string };

export function AiExplain({ question }: AiExplainProps) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [mode, setMode] = useState<AiMode>("explain");

  const ask = async (m: AiMode) => {
    setMode(m);
    setState({ kind: "loading" });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          version: question.version,
          mode: m,
          stem: question.stem,
          explanation: question.explanation,
        }),
        signal: controller.signal,
      });
      const data = (await res.json()) as { text?: string; error?: string; cached?: boolean };
      if (!res.ok || !data.text) {
        setState({ kind: "error", message: data.error ?? AI_UNAVAILABLE });
        return;
      }
      setState({ kind: "done", text: data.text, cached: data.cached === true });
    } catch {
      setState({ kind: "error", message: AI_UNAVAILABLE });
    } finally {
      clearTimeout(timer);
    }
  };

  return (
    <div className="mt-2 border-t border-[var(--line)] pt-2">
      {state.kind === "idle" && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void ask("explain")}
            className="touch-target rounded-lg border border-[var(--line)] px-3 text-sm"
          >
            Hỏi AI giải thích thêm
          </button>
          <button
            type="button"
            onClick={() => void ask("hint")}
            className="touch-target rounded-lg border border-[var(--line)] px-3 text-sm"
          >
            Hỏi AI gợi ý (không lộ đáp án)
          </button>
        </div>
      )}
      {state.kind === "loading" && (
        <p aria-busy="true" className="text-sm text-[var(--ink-muted)]">AI đang trả lời…</p>
      )}
      {state.kind === "done" && (
        <div className="rounded-lg bg-[var(--bg)] p-2 text-sm">
          <p className="text-xs font-semibold text-[var(--copper)]">
            {AI_LABEL}
            {state.cached ? " (đã lưu)" : ""}
          </p>
          <p className="mt-1 whitespace-pre-wrap">{state.text}</p>
          <button type="button" onClick={() => setState({ kind: "idle" })} className="touch-target mt-1 text-xs underline">
            Hỏi lại ({mode === "explain" ? "gợi ý" : "giải thích"})
          </button>
        </div>
      )}
      {state.kind === "error" && (
        <div className="text-sm">
          <p role="alert">{state.message}</p>
          <button type="button" onClick={() => setState({ kind: "idle" })} className="touch-target text-xs underline">
            Thử lại
          </button>
        </div>
      )}
    </div>
  );
}
