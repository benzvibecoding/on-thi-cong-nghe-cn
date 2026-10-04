import { describe, expect, it } from "vitest";
import { EXAM_CONFIG, daysUntilExam, examTotalPoints } from "@/domain/exam-config";

describe("exam-config", () => {
  it("tong diem toan bai la 10", () => {
    expect(examTotalPoints()).toBe(10);
  });

  it("dung cau truc 24 + 4, 50 phut", () => {
    expect(EXAM_CONFIG.part1.count).toBe(24);
    expect(EXAM_CONFIG.part2.count).toBe(4);
    expect(EXAM_CONFIG.totalMinutes).toBe(50);
    expect(EXAM_CONFIG.totalQuestions).toBe(28);
  });

  it("thang diem phan II dung bang chuan", () => {
    expect(EXAM_CONFIG.part2.pointsByCorrectCount).toEqual({
      0: 0,
      1: 0.1,
      2: 0.25,
      3: 0.5,
      4: 1.0,
    });
  });

  it("ti le muc do 4:3:3", () => {
    expect(EXAM_CONFIG.levelRatio).toEqual({ nb: 4, th: 3, vd: 3 });
  });

  it("ngay thi 2027 theo QD 2308: 11/6", () => {
    expect(EXAM_CONFIG.examDateISO).toBe("2027-06-11");
  });

  it("dem nguoc ngay thi giam dan theo thoi gian", () => {
    const a = daysUntilExam(new Date("2027-06-01T00:00:00+07:00"));
    const b = daysUntilExam(new Date("2027-06-09T00:00:00+07:00"));
    expect(a).toBeGreaterThan(b);
  });
});
