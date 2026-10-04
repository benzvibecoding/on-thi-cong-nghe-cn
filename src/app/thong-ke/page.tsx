"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadManifest } from "@/data/content-loader";
import { getPracticeEvents } from "@/data/repositories";
import { daysUntilExam, EXAM_CONFIG } from "@/domain/exam-config";
import {
  currentStreak,
  heatmap,
  masteryByTopic,
  predictScore,
  type MasteryEvent,
} from "@/domain/mastery";
import { buildPlan } from "@/domain/planner";
import type { QuestionLevel } from "@/domain/question-schema";
import { useUiStore } from "@/store/ui-store";
import { AppError } from "@/lib/errors";
import { cn, formatScore } from "@/lib/utils";

const LEVELS: QuestionLevel[] = ["nb", "th", "vd"];

function toMasteryEvents(
  rows: Awaited<ReturnType<typeof getPracticeEvents>>
): MasteryEvent[] {
  return rows
    .filter((r) => (LEVELS as string[]).includes(r.level) && (r.qtype === "mcq" || r.qtype === "tf4"))
    .map((r) => ({
      topicId: r.topicId,
      level: r.level as QuestionLevel,
      qtype: r.qtype as "mcq" | "tf4",
      correct: r.correct,
      correctCount:
        r.correctCount ?? (r.correct ? (r.qtype === "tf4" ? 4 : 1) : 0),
      createdAt: r.createdAt,
    }));
}

export default function ThongKePage() {
  const minutesPerDay = useUiStore((s) => s.minutesPerDay);
  const setMinutesPerDay = useUiStore((s) => s.setMinutesPerDay);
  const studyGoal = useUiStore((s) => s.studyGoal);
  const [events, setEvents] = useState<MasteryEvent[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [topics, setTopics] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [rows, manifest] = await Promise.all([getPracticeEvents(), loadManifest()]);
        if (cancelled) return;
        setEvents(toMasteryEvents(rows));
        setTitles(Object.fromEntries(manifest.packs.map((p) => [p.topicId, p.title])));
        setTopics(manifest.packs.map((p) => p.topicId));
        setLoaded(true);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof AppError ? `${err.message} (mã ${err.code})` : "Có lỗi xảy ra.");
          setLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const mastery = useMemo(() => masteryByTopic(events), [events]);
  const masteryMap = useMemo(() => new Map(mastery.map((m) => [m.topicId, m])), [mastery]);
  const prediction = useMemo(() => predictScore(events), [events]);
  const streak = useMemo(
    () => currentStreak(events.map((e) => e.createdAt)),
    [events]
  );
  const heat = useMemo(() => heatmap(events.map((e) => e.createdAt), 12), [events]);
  const days = daysUntilExam();

  const plan = useMemo(
    () =>
      buildPlan(
        topics.map((t) => ({ topicId: t, mastery: masteryMap.get(t)?.mastery ?? null })),
        minutesPerDay,
        days,
        excluded
      ),
    [topics, masteryMap, minutesPerDay, days, excluded]
  );

  const toggleExclude = (topicId: string) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });

  const totalCorrect = events.filter((e) => e.correct).length;
  const top3 = plan.items.slice(0, 3);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Thống kê</h1>
      {error && <p role="alert" className="text-sm">{error}</p>}
      {!loaded ? (
        <p className="text-[var(--ink-muted)]">Đang tải thống kê…</p>
      ) : (
        <>
          <section aria-label="Tổng quan" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Còn lại", value: days >= 0 ? `${days} ngày` : "Đã qua ngày thi" },
              { label: "Chuỗi ngày học", value: `${streak.days} ngày` },
              { label: "Lượt làm bài", value: String(events.length) },
              {
                label: "Đúng hoàn toàn",
                value: events.length > 0 ? `${Math.round((totalCorrect / events.length) * 100)}%` : "—",
              },
            ].map((c) => (
              <div key={c.label} className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-3 text-center">
                <p className="text-sm text-[var(--ink-muted)]">{c.label}</p>
                <p className="text-lg font-bold">{c.value}</p>
              </div>
            ))}
          </section>

          <section aria-labelledby="du-doan" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5 text-center">
            <h2 id="du-doan" className="font-bold">
              Điểm dự kiến /10 {studyGoal ? `(mục tiêu ${studyGoal})` : ""}
            </h2>
            {prediction ? (
              <>
                <p className="mt-1 font-mono text-4xl font-bold text-[var(--accent)]">
                  {formatScore(prediction.lo)} – {formatScore(prediction.hi)}
                </p>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">
                  Ước lượng từ {prediction.events} lượt làm theo trọng số đề thi (khoảng tin cậy
                  95%). Đây là ước lượng, không phải cam kết.
                </p>
              </>
            ) : (
              <p className="mt-2 text-[15px] text-[var(--ink-muted)]">
                Chưa đủ dữ liệu (cần ít nhất 10 lượt làm). Hãy luyện thêm rồi quay lại.
              </p>
            )}
          </section>

          <section aria-labelledby="nam-vung" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
            <h2 id="nam-vung" className="text-lg font-bold">
              Mức nắm vững theo chủ đề
            </h2>
            {topics.length === 0 ? (
              <p className="mt-2 text-[var(--ink-muted)]">Chưa có dữ liệu.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {topics.map((t) => {
                  const m = masteryMap.get(t);
                  const pct = m?.mastery === null || m?.mastery === undefined ? null : Math.round(m.mastery * 100);
                  return (
                    <li key={t}>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{titles[t] ?? t}</span>
                        <span className="text-[var(--ink-muted)]">
                          {pct === null ? "chưa học" : `${pct}% • ${m!.total} lượt`}
                          {m && m.lowData && m.total > 0 ? " • ít dữ liệu" : ""}
                        </span>
                      </div>
                      <div role="img" aria-label={`${titles[t] ?? t}: ${pct === null ? "chưa có dữ liệu" : `${pct} phần trăm`}`} className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--bg-sunken)]">
                        <div
                          className="h-full rounded-full bg-[var(--accent)]"
                          style={{ width: `${pct ?? 0}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-2 text-xs text-[var(--ink-muted)]">
              Trọng số: Vận dụng ×3, Thông hiểu ×2, Nhận biết ×1; câu mới ảnh hưởng mạnh hơn (nửa
              giá trị sau 30 ngày).
            </p>
          </section>

          <section aria-labelledby="nen-on" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
            <h2 id="nen-on" className="text-lg font-bold">
              Nên ôn gì tiếp
            </h2>
            {top3.length === 0 ? (
              <p className="mt-2 text-[var(--ink-muted)]">Chưa có gợi ý.</p>
            ) : (
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-[15px]">
                {top3.map((item) => (
                  <li key={item.topicId}>
                    <Link href={`/hoc/${item.topicId}`} className="font-semibold underline">
                      {titles[item.topicId] ?? item.topicId}
                    </Link>{" "}
                    <span className="text-[var(--ink-muted)]">— {item.reason.toLowerCase()}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section aria-labelledby="ke-hoach" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
            <h2 id="ke-hoach" className="text-lg font-bold">
              Kế hoạch ôn ({plan.totalMinutes} phút/ngày • còn {plan.daysLeft} ngày)
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              <label className="flex items-center gap-2">
                <span className="font-semibold">Phút/ngày</span>
                <input
                  type="number"
                  min={5}
                  max={240}
                  value={minutesPerDay}
                  onChange={(e) => setMinutesPerDay(Number(e.target.value))}
                  className="touch-target w-20 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2"
                />
              </label>
              <p className="text-[var(--ink-muted)]">Ngày thi: {EXAM_CONFIG.examDateISO} (bỏ chọn chủ đề để chỉnh tay)</p>
            </div>
            <ul className="mt-2 space-y-1">
              {plan.items.map((item) => (
                <li key={item.topicId} className="flex items-center gap-2 rounded-lg bg-[var(--bg-sunken)] px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!excluded.has(item.topicId)}
                    onChange={() => toggleExclude(item.topicId)}
                    aria-label={`Gồm chủ đề ${titles[item.topicId] ?? item.topicId} trong kế hoạch`}
                  />
                  <span className={cn("flex-1", excluded.has(item.topicId) && "line-through opacity-60")}>
                    {titles[item.topicId] ?? item.topicId} — {item.reason.toLowerCase()}
                  </span>
                  <span className="font-mono font-bold">{item.minutes}&apos;</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-[var(--ink-muted)]">
              Ưu tiên = (1 − mức nắm vững) × trọng số chủ đề. Cứ học đều mỗi ngày, không cần dồn.
            </p>
          </section>

          <section aria-labelledby="heatmap" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
            <h2 id="heatmap" className="text-lg font-bold">
              Hoạt động 12 tuần qua
            </h2>
            <div className="mt-2 flex gap-1" role="img" aria-label={`Tổng ${events.length} lượt làm trong 12 tuần`}>
              {Array.from({ length: 12 }, (_, w) => (
                <div key={w} className="flex flex-1 flex-col gap-1">
                  {heat.slice(w * 7, w * 7 + 7).map((d) => (
                    <div
                      key={d.date}
                      title={`${d.date}: ${d.count} lượt`}
                      className={cn(
                        "h-4 rounded-sm",
                        d.count === 0 && "bg-[var(--bg-sunken)]",
                        d.count > 0 && d.count < 3 && "bg-[var(--accent)] opacity-40",
                        d.count >= 3 && d.count < 6 && "bg-[var(--accent)] opacity-70",
                        d.count >= 6 && "bg-[var(--accent)]"
                      )}
                    />
                  ))}
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-[var(--ink-muted)]">
              Ô càng đậm: càng nhiều lượt làm. Di chuột/chạm vào ô để xem số lượt theo ngày.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
