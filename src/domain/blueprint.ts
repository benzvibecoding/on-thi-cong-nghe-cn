import { EXAM_BLUEPRINT } from "./exam-config";
import type { QuestionLevel, QuestionType } from "./question-schema";

export interface QuotaItem {
  type: QuestionType;
  level: QuestionLevel;
  need: number;
}

/** Expand the blueprint into per-(type, level) quotas. */
export function planQuotas(): QuotaItem[] {
  const out: QuotaItem[] = [];
  const parts = [EXAM_BLUEPRINT.part1, EXAM_BLUEPRINT.part2] as const;
  for (const part of parts) {
    for (const level of ["nb", "th", "vd"] as const) {
      out.push({ type: part.type, level, need: part.levels[level] });
    }
  }
  return out;
}

export function fullPaperSize(): number {
  return EXAM_BLUEPRINT.part1.count + EXAM_BLUEPRINT.part2.count;
}
