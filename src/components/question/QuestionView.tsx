import type { Question } from "@/domain/question-schema";
import { LEVEL_LABEL } from "@/domain/exam-config";
import { MathText } from "@/components/math/MathText";

interface QuestionViewProps {
  question: Question;
  showAnswer?: boolean;
}

/** Read-only preview of a question, as students will see it (used by M3/M4/M8). */
export function QuestionView({ question, showAnswer = false }: QuestionViewProps) {
  return (
    <article
      aria-label={`Câu hỏi ${question.id}`}
      className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-[var(--bg-sunken)] px-2 py-1 font-semibold">
          {question.type === "mcq" ? "Phần I" : "Phần II"}
        </span>
        <span className="rounded-full bg-[var(--bg-sunken)] px-2 py-1">
          {LEVEL_LABEL[question.level]}
        </span>
        {question.status === "draft" && (
          <span className="rounded-full bg-[var(--bg-sunken)] px-2 py-1 font-semibold text-[var(--copper)]">
            Chưa kiểm duyệt
          </span>
        )}
      </div>
      <MathText text={question.stem} />
      {question.media?.map((m) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={m.src}
          src={m.src}
          alt={m.alt}
          loading="lazy"
          className="mt-3 max-h-64 w-auto rounded-lg border border-[var(--line)]"
        />
      ))}
      {question.type === "mcq" && question.mcq && (
        <ul className="mt-3 space-y-2" role="list">
          {(["A", "B", "C", "D"] as const).map((letter, i) => (
            <li
              key={letter}
              className="touch-target flex items-start gap-2 rounded-lg border border-[var(--line)] px-3 py-2"
            >
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-sunken)] font-mono text-sm font-bold"
              >
                {letter}
              </span>
              <MathText text={question.mcq!.options[i]!} />
            </li>
          ))}
        </ul>
      )}
      {question.type === "tf4" && question.tf4 && (
        <div className="mt-3">
          {question.tf4.context && <MathText text={question.tf4.context} />}
          <ul className="mt-2 space-y-2" role="list">
            {question.tf4.statements.map((s) => (
              <li
                key={s.key}
                className="touch-target flex items-start gap-2 rounded-lg border border-[var(--line)] px-3 py-2"
              >
                <span aria-hidden="true" className="font-mono font-bold">
                  {s.key})
                </span>
                <MathText text={s.text} />
              </li>
            ))}
          </ul>
        </div>
      )}
      {showAnswer && (
        <div className="mt-3 rounded-lg bg-[var(--bg-sunken)] p-3 text-sm">
          <MathText text={question.explanation} />
        </div>
      )}
    </article>
  );
}
