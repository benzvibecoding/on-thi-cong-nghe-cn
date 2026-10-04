import { describe, expect, it } from "vitest";
import { buildPlan } from "@/domain/planner";

describe("planner", () => {
  const inputs = [
    { topicId: "yeu", mastery: 0.2 },
    { topicId: "kha", mastery: 0.7 },
    { topicId: "moi", mastery: null },
    { topicId: "gioi", mastery: 0.95 },
  ];

  it("uu tien chu de yeu va moi, phan phut du tong", () => {
    const plan = buildPlan(inputs, 60, 30);
    expect(plan.items[0]!.topicId).toBe("moi"); // (1-0)*1 = 1 cao nhat
    expect(plan.items[1]!.topicId).toBe("yeu");
    expect(plan.items.reduce((s, i) => s + i.minutes, 0)).toBe(60);
    expect(plan.items.every((i) => i.minutes >= 5)).toBe(true);
    expect(plan.daysLeft).toBe(30);
  });

  it("loai tru chu de duoc ton trong", () => {
    const plan = buildPlan(inputs, 60, 30, new Set(["moi", "yeu"]));
    expect(plan.items.map((i) => i.topicId)).toEqual(["kha", "gioi"]);
  });

  it("ly do de hieu, giong dong vien", () => {
    const plan = buildPlan(inputs, 60, 30);
    expect(plan.items[0]!.reason).toMatch(/Mới bắt đầu/);
    expect(plan.items.find((i) => i.topicId === "gioi")!.reason).toMatch(/Giữ phong độ/);
  });
});
