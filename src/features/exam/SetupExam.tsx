"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadManifest, loadTopicPack } from "@/data/content-loader";
import { getDb, newId } from "@/data/db";
import { saveExamSession } from "@/data/exam-sessions";
import { EXAM_BLUEPRINT, EXAM_CONFIG, examTotalPoints } from "@/domain/exam-config";
import { generateExam, type QuestionHistory } from "@/domain/generator";
import { computeEndsAt, emptyAnswers } from "@/domain/exam-session";
import { isExamEligible } from "@/domain/question-schema";
import type { ExamMode } from "@/domain/exam-session";
import { AppError } from "@/lib/errors";

type State =
  | { kind: "loading" }
  | { kind: "ready"; mcq: number; tf4: number; bank: number }
  | { kind: "error"; code: string; message: string };

async function loadHistory(): Promise<Map<string, QuestionHistory>> {
  const map = new Map<string, QuestionHistory>();
  try {
    const events = await getDb().practiceEvents.toArray();
    for (const e of events) {
      const cur = map.get(e.questionId) ?? { attempts: 0, lastCorrect: null };
      cur.attempts += 1;
      cur.lastCorrect = e.correct;
      map.set(e.questionId, cur);
    }
  } catch {
    // History is best-effort; empty map still generates a valid paper.
  }
  return map;
}

export function SetupExam() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [mode, setMode] = useState<ExamMode>("paper");
  const [starting, setStarting] = useState(false);
  const [bankQuestions, setBankQuestions] = useState<
    Awaited<ReturnType<typeof loadTopicPack>>["questions"] | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const manifest = await loadManifest();
        const packs = await Promise.all(manifest.packs.map((p) => loadTopicPack(p.topicId)));
        const all = packs.flatMap((p) => p.questions);
        if (cancelled) return;
        const eligible = all.filter(isExamEligible);
        setBankQuestions(all);
        setState({
          kind: "ready",
          mcq: eligible.filter((q) => q.type === "mcq").length,
          tf4: eligible.filter((q) => q.type === "tf4").length,
          bank: all.length,
        });
      } catch (err: unknown) {
        if (!cancelled) {
          setState(
            err instanceof AppError
              ? { kind: "error", code: err.code, message: err.message }
              : { kind: "error", code: "E199", message: "Có lỗi xảy ra. Hãy thử lại sau." }
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const start = async (allowShort: boolean) => {
    if (!bankQuestions || starting) return;
    setStarting(true);
    try {
      const history = await loadHistory();
      const seed = Date.now() % 2147483647;
      const paper = generateExam(bankQuestions, history, seed);
      if (!paper.full && !allowShort) {
        setStarting(false);
        return;
      }
      const id = newId();
      const startedAt = Date.now();
      await saveExamSession({
        id,
        seed: paper.seed,
        mode,
        full: paper.full,
        questions: paper.questions,
        answers: emptyAnswers(),
        flags: [],
        durationsMs: {},
        startedAt,
        endsAt: computeEndsAt(startedAt),
        submittedAt: null,
        autoSubmitted: false,
        tabId: "setup",
        updatedAt: 0,
      });
      router.push(`/thi-thu/lam-bai?id=${id}`);
    } catch {
      setStarting(false);
      setState({ kind: "error", code: "E104", message: "Không lưu được phiên thi trên thiết bị này." });
    }
  };

  if (state.kind === "loading") {
    return (
      <section aria-busy="true" aria-label="Đang tải" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <h1 className="text-2xl font-bold">Thi thử</h1>
        <p className="mt-2 text-[var(--ink-muted)]">Đang kiểm tra ngân hàng câu hỏi…</p>
      </section>
    );
  }

  if (state.kind === "error") {
    return (
      <section role="alert" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <h1 className="text-2xl font-bold">Thi thử</h1>
        <p className="mt-2">
          {state.message} (mã {state.code})
        </p>
      </section>
    );
  }

  const canFull =
    state.mcq >= EXAM_BLUEPRINT.part1.count && state.tf4 >= EXAM_BLUEPRINT.part2.count;
  const totalEligible = state.mcq + state.tf4;

  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby="thi-thu" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <h1 id="thi-thu" className="text-2xl font-bold">
          Thi thử
        </h1>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px]">
          <li>
            Phần I: {EXAM_CONFIG.part1.count} câu trắc nghiệm × {EXAM_CONFIG.part1.pointsPerQuestion} điểm.
          </li>
          <li>
            Phần II: {EXAM_CONFIG.part2.count} câu Đúng/Sai × tối đa 1,0 điểm (0,1 / 0,25 / 0,5 / 1,0 theo số ý đúng).
          </li>
          <li>
            Thời gian {EXAM_CONFIG.totalMinutes} phút • Tổng {examTotalPoints().toFixed(0)}/10 • Hết giờ tự nộp.
          </li>
        </ul>
        <fieldset className="mt-4">
          <legend className="text-sm font-semibold">Chế độ giao diện</legend>
          <div className="mt-1 flex gap-2">
            {(
              [
                { value: "paper", label: "Giấy (cuộn + phiếu tô)" },
                { value: "computer", label: "Máy tính (1 câu/màn hình)" },
              ] as const
            ).map((o) => (
              <label key={o.value} className="touch-target flex flex-1 items-center gap-2 rounded-lg border border-[var(--line)] px-3 text-sm">
                <input
                  type="radio"
                  name="exam-mode"
                  checked={mode === o.value}
                  onChange={() => setMode(o.value)}
                />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      {canFull ? (
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
          <p className="text-[15px]">
            Ngân hàng có đủ câu đã kiểm duyệt ({state.mcq} trắc nghiệm, {state.tf4} Đúng/Sai).
          </p>
          <button
            type="button"
            disabled={starting}
            onClick={() => void start(false)}
            className="touch-target mt-3 rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-ink)] disabled:opacity-50"
          >
            {starting ? "Đang tạo đề…" : "Bắt đầu thi (50 phút)"}
          </button>
        </section>
      ) : totalEligible >= 5 ? (
        <section className="rounded-2xl border border-[var(--copper)] bg-[var(--bg-raised)] p-5">
          <h2 className="font-bold">Chưa đủ câu cho đề chuẩn</h2>
          <p className="mt-1 text-[15px]">
            Cần {EXAM_BLUEPRINT.part1.count} trắc nghiệm + {EXAM_BLUEPRINT.part2.count} Đúng/Sai đã
            kiểm duyệt; hiện có {state.mcq} + {state.tf4} (tổng ngân hàng {state.bank} câu, phần lớn
            đang chờ duyệt). Bạn có thể làm <strong>đề rút gọn</strong> — điểm không theo thang
            chuẩn, chỉ để làm quen.
          </p>
          <button
            type="button"
            disabled={starting}
            onClick={() => void start(true)}
            className="touch-target mt-3 rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-ink)] disabled:opacity-50"
          >
            {starting ? "Đang tạo đề…" : `Làm đề rút gọn (${totalEligible} câu)`}
          </button>
        </section>
      ) : (
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
          <h2 className="font-bold">Chưa thể thi thử (mã E102)</h2>
          <p className="mt-1 text-[15px]">
            Ngân hàng chưa có câu hỏi đã kiểm duyệt (tổng {state.bank} câu đều đang chờ duyệt).
            Câu chưa kiểm duyệt chỉ dùng ở Luyện tập, không đưa vào thi thử để bảo đảm độ chính
            xác. Hãy luyện tập trước, quay lại đây sau khi có câu được duyệt.
          </p>
          <a href="/luyen-tap" className="touch-target mt-3 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--accent-ink)]">
            Sang Luyện tập
          </a>
        </section>
      )}
    </div>
  );
}
