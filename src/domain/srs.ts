import { createEmptyCard, FSRS, Rating, type Card, type Grade } from "ts-fsrs";
import type { Flashcard } from "./flashcards";

/**
 * SRS port bọc ts-fsrs (v5.4.2, MIT) sau interface thuần để thay thuật toán được.
 * FSRS tham số mặc định; trạng thái thẻ serialize được để lưu Dexie.
 */

export const SRS_GRADES = [
  { value: Rating.Again, label: "Quên rồi" },
  { value: Rating.Hard, label: "Hơi khó" },
  { value: Rating.Good, label: "Nhớ được" },
  { value: Rating.Easy, label: "Dễ quá" },
] as const;

export type SrsGrade = Grade;

export interface SrsState {
  dueISO: string;
  stability: number;
  difficulty: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: number;
}

let scheduler: FSRS | null = null;

function getScheduler(): FSRS {
  if (!scheduler) scheduler = new FSRS({});
  return scheduler;
}

export function newSrsState(now: number = Date.now()): SrsState {
  return fromCard(createEmptyCard(new Date(now)));
}

export function fromCard(card: Card): SrsState {
  return {
    dueISO: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    scheduledDays: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: Number(card.state),
  };
}

export function toCard(state: SrsState): Card {
  return {
    due: new Date(state.dueISO),
    stability: state.stability,
    difficulty: state.difficulty,
    elapsed_days: 0,
    scheduled_days: state.scheduledDays,
    learning_steps: 0,
    reps: state.reps,
    lapses: state.lapses,
    state: state.state as Card["state"],
  };
}

/** Schedule the next review. Pure given (state, grade, now). */
export function scheduleReview(
  state: SrsState | null,
  grade: SrsGrade,
  now: number = Date.now()
): SrsState {
  const card = state ? toCard(state) : createEmptyCard(new Date(now));
  const item = getScheduler().next(card, new Date(now), grade);
  return fromCard(item.card);
}

export function isDue(state: SrsState | null, now: number = Date.now()): boolean {
  if (!state) return true; // unseen cards are always due
  return new Date(state.dueISO).getTime() <= now;
}

export interface DueCard {
  card: Flashcard;
  state: SrsState | null;
  isNew: boolean;
}

/**
 * Build today's queue: due reviews first, then new cards up to `newLimit`.
 * New cards keep input order (stable); due cards earliest-due first.
 */
export function buildDueQueue(
  cards: Flashcard[],
  states: Map<string, SrsState>,
  now: number = Date.now(),
  newLimit = 10
): DueCard[] {
  const due: DueCard[] = [];
  const fresh: DueCard[] = [];
  for (const card of cards) {
    const state = states.get(card.id) ?? null;
    if (!state) fresh.push({ card, state, isNew: true });
    else if (isDue(state, now)) due.push({ card, state, isNew: false });
  }
  due.sort((a, b) => a.state!.dueISO.localeCompare(b.state!.dueISO));
  return [...due, ...fresh.slice(0, Math.max(0, newLimit))];
}
