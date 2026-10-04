export interface PlanInput {
  topicId: string;
  mastery: number | null;
  /** Blueprint weight (default 1 = equal). */
  weight?: number;
}

export interface PlanItem extends PlanInput {
  priority: number;
  minutes: number;
  reason: string;
}

export interface StudyPlan {
  items: PlanItem[];
  totalMinutes: number;
  daysLeft: number;
}

/**
 * Priority = (1 - mastery) × weight. Unknown mastery counts as 0 (start here).
 * Minutes split proportionally to priority, rounded to 5, minimum 5 each.
 * Fully explainable; user edits by excluding topics or changing minutes/day.
 */
export function buildPlan(
  inputs: PlanInput[],
  minutesPerDay: number,
  daysLeft: number,
  excluded: Set<string> = new Set()
): StudyPlan {
  const total = Math.max(5, Math.min(240, Math.round(minutesPerDay) || 30));
  const rows = inputs
    .filter((i) => !excluded.has(i.topicId))
    .map((i) => {
      const mastery = i.mastery ?? 0;
      const weight = i.weight ?? 1;
      return { ...i, mastery, priority: (1 - mastery) * weight };
    })
    .sort((a, b) => b.priority - a.priority);

  const sum = rows.reduce((s, r) => s + r.priority, 0) || 1;
  let items = rows.map((r) => {
    const minutes = Math.max(5, Math.round(((r.priority / sum) * total) / 5) * 5);
    const reason =
      r.mastery === 0 && r.priority > 0 && inputs.find((x) => x.topicId === r.topicId)?.mastery == null
        ? "Mới bắt đầu — học từ nền tảng"
        : r.mastery < 0.5
          ? "Đang yếu — ưu tiên cao"
          : r.mastery < 0.8
            ? "Cần củng cố thêm"
            : "Giữ phong độ";
    return { ...r, minutes, reason };
  });

  // Fix rounding drift on the top item.
  const drift = total - items.reduce((s, r) => s + r.minutes, 0);
  if (items[0] && drift !== 0) {
    items = items.map((r, idx) =>
      idx === 0 ? { ...r, minutes: Math.max(5, r.minutes + drift) } : r
    );
  }
  return { items, totalMinutes: total, daysLeft: Math.max(0, daysLeft) };
}
