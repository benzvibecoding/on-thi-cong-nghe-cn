import { EXAM_BLUEPRINT } from "./exam-config";
import { planQuotas } from "./blueprint";
import type { QuestionLevel } from "./question-schema";

export interface MasteryEvent {
  topicId: string;
  level: QuestionLevel;
  qtype: "mcq" | "tf4";
  /** 1 = fully correct. For tf4 see tf4CorrectCount for partial credit. */
  correct: boolean;
  /** Correctly judged statements (mcq: 0/1, tf4: 0-4). Falls back to correct?max:0. */
  correctCount?: number;
  createdAt: number;
}

export const LEVEL_WEIGHT: Record<QuestionLevel, number> = { nb: 1, th: 2, vd: 3 };
/** Recency half-life: an event 30 days old counts half as much. */
export const HALF_LIFE_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
/** Below this many attempts a topic is flagged "ít dữ liệu". */
export const MIN_ATTEMPTS_CONFIDENT = 5;
/** Below this many total events no prediction is shown. */
export const MIN_EVENTS_PREDICT = 10;

function recencyWeight(ageMs: number): number {
  if (ageMs <= 0) return 1;
  return Math.pow(0.5, ageMs / (HALF_LIFE_DAYS * MS_PER_DAY));
}

export interface TopicMastery {
  topicId: string;
  /** 0-1 weighted accuracy, or null when no data. */
  mastery: number | null;
  total: number;
  lowData: boolean;
}

export function masteryByTopic(events: MasteryEvent[], now: number = Date.now()): TopicMastery[] {
  const acc = new Map<string, { weighted: number; weights: number; total: number }>();
  for (const e of events) {
    const w = LEVEL_WEIGHT[e.level] * recencyWeight(now - e.createdAt);
    const cur = acc.get(e.topicId) ?? { weighted: 0, weights: 0, total: 0 };
    cur.weighted += w * (e.correct ? 1 : 0);
    cur.weights += w;
    cur.total += 1;
    acc.set(e.topicId, cur);
  }
  return [...acc.entries()].map(([topicId, v]) => ({
    topicId,
    mastery: v.weights > 0 ? v.weighted / v.weights : null,
    total: v.total,
    lowData: v.total < MIN_ATTEMPTS_CONFIDENT,
  }));
}

// ---------- Predicted score ----------

const TF4_TABLE = [0, 0.1, 0.25, 0.5, 1.0];

function tf4CountOf(e: MasteryEvent): number {
  if (e.correctCount !== undefined) return Math.max(0, Math.min(4, e.correctCount));
  return e.correct ? 4 : 0;
}

export interface Prediction {
  /** Expected total /10. */
  point: number;
  lo: number;
  hi: number;
  events: number;
}

/**
 * Expected score by blueprint quota: each (type, level) cell contributes
 * need × mean observed points (mcq: 0/0.25, tf4: official 0-4-statement table).
 * Empty cells fall back to the global mean of their type.
 * Interval = ±1.96 × SE from per-cell sample variance (95%, normal approx),
 * clamped to [0, 10]. Returns null when events < MIN_EVENTS_PREDICT.
 */
export function predictScore(events: MasteryEvent[]): Prediction | null {
  if (events.length < MIN_EVENTS_PREDICT) return null;

  const pointsOf = (e: MasteryEvent): number =>
    e.qtype === "mcq" ? (e.correct ? 0.25 : 0) : TF4_TABLE[tf4CountOf(e)]!;

  const cells = new Map<string, number[]>();
  const global: Record<"mcq" | "tf4", number[]> = { mcq: [], tf4: [] };
  for (const e of events) {
    const p = pointsOf(e);
    const key = `${e.qtype}:${e.level}`;
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key)!.push(p);
    global[e.qtype].push(p);
  }
  const mean = (xs: number[]): number => xs.reduce((s, x) => s + x, 0) / xs.length;
  const sampleVar = (xs: number[], m: number): number => {
    if (xs.length < 2) return m * (1 - m); // Bernoulli fallback for a single sample
    return xs.reduce((s, x) => s + (x - m) * (x - m), 0) / (xs.length - 1);
  };

  let point = 0;
  let varTotal = 0;
  for (const quota of planQuotas()) {
    const key = `${quota.type}:${quota.level}`;
    const xs = cells.get(key) ?? global[quota.type];
    if (xs.length === 0) continue; // no data at all for this type: contributes 0
    const m = mean(xs);
    point += quota.need * m;
    varTotal += (quota.need * quota.need * sampleVar(xs, m)) / xs.length;
  }
  const se = Math.sqrt(varTotal);
  const clamp = (v: number) => Math.max(0, Math.min(10, v));
  const round1 = (v: number) => Math.round(v * 10) / 10;
  return {
    point: round1(clamp(point)),
    lo: round1(clamp(point - 1.96 * se)),
    hi: round1(clamp(point + 1.96 * se)),
    events: events.length,
  };
}

// ---------- Streak & heatmap ----------

export function dayKey(time: number): string {
  const d = new Date(time);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface Streak {
  days: number;
  activeToday: boolean;
  totalActiveDays: number;
}

/** Consecutive-day streak ending today (or yesterday if today is inactive). */
export function currentStreak(times: number[], now: number = Date.now()): Streak {
  const active = new Set(times.map(dayKey));
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const activeToday = active.has(dayKey(now));
  let days = 0;
  const cursor = new Date(today);
  if (!activeToday) cursor.setDate(cursor.getDate() - 1);
  while (active.has(dayKey(cursor.getTime()))) {
    days += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { days, activeToday, totalActiveDays: active.size };
}

export interface HeatDay {
  date: string;
  count: number;
}

/** Last `weeks` × 7 days ending today, oldest first. */
export function heatmap(times: number[], weeks = 12, now: number = Date.now()): HeatDay[] {
  const counts = new Map<string, number>();
  for (const t of times) counts.set(dayKey(t), (counts.get(dayKey(t)) ?? 0) + 1);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const out: HeatDay[] = [];
  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dayKey(d.getTime());
    out.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return out;
}

export function blueprintTopicWeight(): number {
  void EXAM_BLUEPRINT;
  return 1; // default equal weights; official weights [CẦN KIỂM TRA]
}
