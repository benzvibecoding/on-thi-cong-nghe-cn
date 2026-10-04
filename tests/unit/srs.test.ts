import { describe, expect, it } from "vitest";
import { Rating } from "ts-fsrs";
import {
  buildDueQueue,
  fromCard,
  isDue,
  newSrsState,
  scheduleReview,
  toCard,
  type SrsState,
} from "@/domain/srs";
import type { Flashcard } from "@/domain/flashcards";

function card(id: string): Flashcard {
  return { id, topicId: "t", kind: "term", front: "f", back: "b" };
}

describe("srs (ts-fsrs adapter)", () => {
  it("the moi luon den han; serialize duoc", () => {
    const s = newSrsState(1_000_000);
    expect(isDue(null, 1_000_000)).toBe(true);
    expect(isDue(s, new Date(s.dueISO).getTime())).toBe(true);
    const revived = fromCard(toCard(s));
    expect(revived).toEqual(s);
  });

  it("cham Good hen xa hon cham Again", () => {
    const now = 1_700_000_000_000;
    const good = scheduleReview(null, Rating.Good, now);
    const again = scheduleReview(null, Rating.Again, now);
    expect(new Date(good.dueISO).getTime()).toBeGreaterThan(new Date(again.dueISO).getTime());
    expect(good.reps).toBe(1);
  });

  it("hang doi: the den han truoc, the moi gioi han so luong", () => {
    const now = 1_700_000_000_000;
    const cards = [card("c1"), card("c2"), card("c3")];
    const states = new Map<string, SrsState>([
      ["c2", { ...newSrsState(0), dueISO: new Date(now - 1000).toISOString() }],
      ["c3", { ...newSrsState(0), dueISO: new Date(now + 99_999_999).toISOString() }],
    ]);
    const queue = buildDueQueue(cards, states, now, 1);
    expect(queue.map((q) => q.card.id)).toEqual(["c2", "c1"]);
    expect(queue[0]!.isNew).toBe(false);
    expect(queue[1]!.isNew).toBe(true);
  });

  it("gioi han 0 the moi thi chi on the den han", () => {
    const now = 1_700_000_000_000;
    const queue = buildDueQueue([card("c1")], new Map(), now, 0);
    expect(queue).toHaveLength(0);
  });
});
