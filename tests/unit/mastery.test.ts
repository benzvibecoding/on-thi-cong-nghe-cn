import { describe, expect, it } from "vitest";
import {
  currentStreak,
  dayKey,
  heatmap,
  masteryByTopic,
  MIN_EVENTS_PREDICT,
  predictScore,
  type MasteryEvent,
} from "@/domain/mastery";

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_750_000_000_000;

function ev(partial: Partial<MasteryEvent> & { topicId: string }): MasteryEvent {
  return {
    level: "nb",
    qtype: "mcq",
    correct: true,
    createdAt: NOW,
    ...partial,
  };
}

describe("mastery", () => {
  it("trong so muc do: vd nang hon nb", () => {
    const events = [
      ev({ topicId: "t1", level: "nb", correct: false }),
      ev({ topicId: "t1", level: "vd", correct: true }),
    ];
    const m = masteryByTopic(events, NOW).find((x) => x.topicId === "t1")!;
    // (0*1 + 1*3) / (1+3) = 0.75
    expect(m.mastery).toBeCloseTo(0.75, 5);
    expect(m.lowData).toBe(true);
  });

  it("su kien cu anh huong it hon (half-life 30 ngay)", () => {
    const events = [
      ev({ topicId: "t1", correct: false, createdAt: NOW - 60 * DAY }),
      ev({ topicId: "t1", correct: true, createdAt: NOW }),
    ];
    const m = masteryByTopic(events, NOW).find((x) => x.topicId === "t1")!;
    // weights: 0.25 vs 1 -> (0 + 1) / 1.25 = 0.8
    expect(m.mastery).toBeCloseTo(0.8, 5);
  });

  it("du 5 luot thi het co it du lieu", () => {
    const events = Array.from({ length: 5 }, () => ev({ topicId: "t1" }));
    expect(masteryByTopic(events, NOW)[0]!.lowData).toBe(false);
  });
});

describe("predictScore", () => {
  it(`duoi ${MIN_EVENTS_PREDICT} luot thi bao chua du du lieu`, () => {
    expect(predictScore(Array.from({ length: 9 }, () => ev({ topicId: "t" })))).toBeNull();
  });

  it("lam dung het -> du doan 10 diem", () => {
    const events: MasteryEvent[] = [];
    for (let i = 0; i < 24; i++) events.push(ev({ topicId: "t", qtype: "mcq", correct: true }));
    for (let i = 0; i < 4; i++) events.push(ev({ topicId: "t", qtype: "tf4", correct: true, correctCount: 4 }));
    const p = predictScore(events)!;
    expect(p.point).toBe(10);
    expect(p.lo).toBe(10);
    expect(p.hi).toBe(10);
  });

  it("sai het -> du doan 0 diem", () => {
    const events: MasteryEvent[] = [];
    for (let i = 0; i < 8; i++) events.push(ev({ topicId: "t", qtype: "mcq", correct: false }));
    for (let i = 0; i < 2; i++) events.push(ev({ topicId: "t", qtype: "tf4", correct: false, correctCount: 0 }));
    expect(predictScore(events)!.point).toBe(0);
  });

  it("tf4 dung 2/4 y dem 0,25 diem theo bang chuan", () => {
    // Chi co du lieu tf4: cac o mcq dung global fallback (rong -> 0), tf4 du doan theo mean.
    const events: MasteryEvent[] = Array.from({ length: 10 }, () =>
      ev({ topicId: "t", qtype: "tf4", correct: false, correctCount: 2 })
    );
    const p = predictScore(events)!;
    // 4 cau tf4 x 0,25 = 1,0; mcq khong du lieu -> 0.
    expect(p.point).toBe(1);
  });

  it("khoang tin cay bao quanh diem du doan", () => {
    const events: MasteryEvent[] = [];
    for (let i = 0; i < 7; i++) events.push(ev({ topicId: "t", qtype: "mcq", correct: i % 2 === 0 }));
    for (let i = 0; i < 3; i++) events.push(ev({ topicId: "t", qtype: "tf4", correct: i !== 0, correctCount: i === 0 ? 1 : 4 }));
    const p = predictScore(events)!;
    expect(p.lo).toBeLessThanOrEqual(p.point);
    expect(p.hi).toBeGreaterThanOrEqual(p.point);
    expect(p.lo).toBeGreaterThanOrEqual(0);
    expect(p.hi).toBeLessThanOrEqual(10);
  });
});

describe("streak & heatmap", () => {
  it("chuoi ngay lien tuc, hom nay chua hoc van giu", () => {
    const times = [NOW, NOW - DAY, NOW - 2 * DAY];
    expect(currentStreak(times, NOW).days).toBe(3);
    expect(currentStreak([NOW - DAY], NOW)).toEqual({ days: 1, activeToday: false, totalActiveDays: 1 });
    expect(currentStreak([], NOW).days).toBe(0);
  });

  it("heatmap 12 tuan, cu nhat truoc", () => {
    const h = heatmap([NOW], 2, NOW);
    expect(h).toHaveLength(14);
    expect(h[13]!.count).toBe(1);
    expect(h[0]!.date < h[13]!.date).toBe(true);
    expect(dayKey(NOW)).toBe(h[13]!.date);
  });
});
