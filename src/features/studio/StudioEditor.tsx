"use client";

import { useEffect, useMemo, useState } from "react";
import { parse as parseYaml } from "yaml";
import { loadManifest } from "@/data/content-loader";
import { questionSchema, type Question } from "@/domain/question-schema";
import { QuestionView } from "@/components/question/QuestionView";
import { questionToYaml } from "./toYaml";

const LEVELS = ["nb", "th", "vd"] as const;
const SKILLS = ["recall", "interpret-diagram", "compute", "real-world", "troubleshoot"] as const;
const KINDS = ["original", "official-exam", "licensed", "ai-assisted"] as const;
const STATUSES = ["draft", "reviewed", "published"] as const;

function emptyTf4() {
  return (["a", "b", "c", "d"] as const).map((key) => ({ key, text: "", isTrue: true, explanation: "" }));
}

export function StudioEditor() {
  const [topics, setTopics] = useState<Array<{ topicId: string; title: string }>>([]);
  const [id, setId] = useState("studio-mcq-01");
  const [type, setType] = useState<"mcq" | "tf4">("mcq");
  const [topicId, setTopicId] = useState("dien-dai-cuong");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("nb");
  const [skill, setSkill] = useState<string>("recall");
  const [stem, setStem] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState("B");
  const [context, setContext] = useState("");
  const [statements, setStatements] = useState(emptyTf4);
  const [explanation, setExplanation] = useState("");
  const [commonMistake, setCommonMistake] = useState("");
  const [kind, setKind] = useState<string>("original");
  const [status, setStatus] = useState<string>("draft");
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadManifest()
      .then((m) => {
        if (!cancelled) setTopics(m.packs.map((p) => ({ topicId: p.topicId, title: p.title })));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const assembled: unknown = useMemo(() => {
    const base = {
      id: id.trim(),
      type,
      topicId,
      level,
      skill,
      stem,
      explanation,
      ...(commonMistake.trim() ? { commonMistake: commonMistake.trim() } : {}),
      source: { kind },
      status,
      version: 1,
      tags: ["studio"],
    };
    if (type === "mcq") {
      return { ...base, mcq: { options, correct } };
    }
    return {
      ...base,
      tf4: {
        ...(context.trim() ? { context: context.trim() } : {}),
        statements: statements.map((s) => ({ ...s, isTrue: Boolean(s.isTrue) })),
      },
    };
  }, [id, type, topicId, level, skill, stem, options, correct, context, statements, explanation, commonMistake, kind, status]);

  const parsed = useMemo(() => questionSchema.safeParse(assembled), [assembled]);
  const errors = useMemo(
    () =>
      parsed.success
        ? []
        : parsed.error.issues.map((i) => `${i.path.join(".") || "(gốc)"}: ${i.message}`),
    [parsed]
  );

  const fill = (q: Question) => {
    setId(q.id);
    setType(q.type);
    setTopicId(q.topicId);
    setLevel(q.level);
    setSkill(q.skill ?? "recall");
    setStem(q.stem);
    setExplanation(q.explanation);
    setCommonMistake(q.commonMistake ?? "");
    setKind(q.source.kind);
    setStatus(q.status);
    if (q.type === "mcq" && q.mcq) {
      setOptions(q.mcq.options);
      setCorrect(q.mcq.correct);
    }
    if (q.type === "tf4" && q.tf4) {
      setContext(q.tf4.context ?? "");
      setStatements(q.tf4.statements.map((s) => ({ ...s })));
    }
  };

  const onImport = async (file: File) => {
    setImportError(null);
    try {
      const data = parseYaml(await file.text());
      const first = Array.isArray(data) ? data[0] : data;
      const result = questionSchema.safeParse(first);
      if (!result.success) {
        setImportError(`File không hợp lệ: ${result.error.issues[0]?.message ?? "sai schema"}`);
        return;
      }
      fill(result.data);
    } catch {
      setImportError("Không đọc được file YAML.");
    }
  };

  const onExport = () => {
    if (!parsed.success) return;
    const blob = new Blob([questionToYaml(parsed.data)], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${parsed.data.id}.yaml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const inputCls =
    "touch-target w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-[15px]";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Question Studio</h1>
        <div className="flex gap-2">
          <label className="touch-target cursor-pointer rounded-lg border border-[var(--line)] px-4 py-2 text-sm">
            Nhập YAML
            <input
              type="file" accept=".yaml,.yml" className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onImport(f);
                e.target.value = "";
              }}
            />
          </label>
          <button
            type="button" onClick={onExport} disabled={!parsed.success}
            className="touch-target rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-ink)] disabled:opacity-50"
          >
            Xuất YAML
          </button>
        </div>
      </div>
      {importError && <p role="alert" className="text-sm">{importError}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-label="Form soạn" className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-sm">Mã câu (id ổn định)
              <input value={id} onChange={(e) => setId(e.target.value)} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-sm">Dạng
              <select value={type} onChange={(e) => setType(e.target.value as "mcq" | "tf4")} className={inputCls}>
                <option value="mcq">Phần I (A–D)</option>
                <option value="tf4">Phần II (Đúng/Sai)</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">Chủ đề
              <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className={inputCls}>
                {topics.map((t) => (
                  <option key={t.topicId} value={t.topicId}>{t.title}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">Mức độ
              <select value={level} onChange={(e) => setLevel(e.target.value as (typeof LEVELS)[number])} className={inputCls}>
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">Kỹ năng
              <select value={skill} onChange={(e) => setSkill(e.target.value)} className={inputCls}>
                {SKILLS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">Trạng thái
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}{s !== "draft" ? " (cần người duyệt)" : ""}</option>)}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">Nguồn
            <select value={kind} onChange={(e) => setKind(e.target.value)} className={inputCls}>
              {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">Đề bài (Markdown + LaTeX $...$)
            <textarea value={stem} onChange={(e) => setStem(e.target.value)} rows={3} className={inputCls} />
          </label>
          {type === "mcq" ? (
            <fieldset>
              <legend className="text-sm font-semibold">4 phương án + đáp án đúng</legend>
              {options.map((o, i) => (
                <label key={i} className="mt-1 flex items-center gap-2 text-sm">
                  <input type="radio" name="correct" checked={correct === "ABCD"[i]} onChange={() => setCorrect("ABCD"[i]!)} aria-label={`Đáp án ${"ABCD"[i]}`} />
                  <input value={o} onChange={(e) => setOptions((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))} placeholder={`Phương án ${"ABCD"[i]}`} className={inputCls} />
                </label>
              ))}
            </fieldset>
          ) : (
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-semibold">Bối cảnh + 4 ý a–d</legend>
              <input value={context} onChange={(e) => setContext(e.target.value)} placeholder="Bối cảnh chung (tùy chọn)" className={inputCls} />
              {statements.map((s, i) => (
                <div key={s.key} className="rounded-lg border border-[var(--line)] p-2">
                  <p className="font-mono text-sm font-bold">Ý {s.key}</p>
                  <input value={s.text} onChange={(e) => setStatements((prev) => prev.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} placeholder="Nội dung ý" className={`${inputCls} mt-1`} />
                  <div className="mt-1 flex gap-2">
                    {[true, false].map((v) => (
                      <label key={String(v)} className="flex items-center gap-1 text-sm">
                        <input type="radio" name={`tf-${s.key}`} checked={s.isTrue === v} onChange={() => setStatements((prev) => prev.map((x, j) => (j === i ? { ...x, isTrue: v } : x)))} />
                        {v ? "Đúng" : "Sai"}
                      </label>
                    ))}
                  </div>
                  <input value={s.explanation} onChange={(e) => setStatements((prev) => prev.map((x, j) => (j === i ? { ...x, explanation: e.target.value } : x)))} placeholder="Giải thích ý này" className={`${inputCls} mt-1`} />
                </div>
              ))}
            </fieldset>
          )}
          <label className="flex flex-col gap-1 text-sm">Lời giải chi tiết
            <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={3} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-sm">Lỗi thường gặp (tùy chọn)
            <textarea value={commonMistake} onChange={(e) => setCommonMistake(e.target.value)} rows={2} className={inputCls} />
          </label>
          {errors.length > 0 && (
            <ul role="alert" className="rounded-lg border border-[var(--danger)] p-3 text-sm">
              {errors.map((e) => <li key={e}>• {e}</li>)}
            </ul>
          )}
        </section>
        <section aria-label="Xem trước">
          <p className="mb-2 text-sm font-semibold">Xem trước như học sinh thấy</p>
          {parsed.success ? (
            <QuestionView question={parsed.data} showAnswer />
          ) : (
            <p className="rounded-2xl border border-dashed border-[var(--line)] p-4 text-sm text-[var(--ink-muted)]">
              Điền đủ các trường để xem trước. Lỗi đang hiện ở form bên trái.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
