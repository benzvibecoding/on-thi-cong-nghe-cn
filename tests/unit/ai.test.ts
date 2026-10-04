import { describe, expect, it } from "vitest";
import {
  AI_LABEL,
  aiCacheKey,
  aiRequestSchema,
  buildExplainPrompt,
} from "@/domain/ai";

const base = {
  questionId: "q1",
  version: 2,
  mode: "explain" as const,
  stem: "Chon dap an dung?",
  explanation: "Vi A dung.",
};

describe("ai domain", () => {
  it("prompt bam nen: co cau hoi + loi giai chuan + tieng Viet + tu choi lac de", () => {
    const prompt = buildExplainPrompt(base);
    expect(prompt).toContain(base.stem);
    expect(prompt).toContain(base.explanation);
    expect(prompt).toMatch(/TIẾNG VIỆT/);
    expect(prompt).toMatch(/ngoài phạm vi môn học/);
  });

  it("che do hint cam lo dap an", () => {
    const prompt = buildExplainPrompt({ ...base, mode: "hint" });
    expect(prompt).toMatch(/không tiết lộ đáp án/);
  });

  it("validate input: chan mode la, text qua dai, thieu truong", () => {
    expect(aiRequestSchema.safeParse(base).success).toBe(true);
    expect(aiRequestSchema.safeParse({ ...base, mode: "solve" }).success).toBe(false);
    expect(aiRequestSchema.safeParse({ ...base, stem: "x".repeat(2001) }).success).toBe(false);
    expect(aiRequestSchema.safeParse({ ...base, questionId: "" }).success).toBe(false);
  });

  it("cache key on dinh theo (questionId, version, mode)", () => {
    expect(aiCacheKey(base)).toBe("q1:v2:explain");
    expect(aiCacheKey({ ...base, version: 3 })).not.toBe(aiCacheKey(base));
    expect(aiCacheKey({ ...base, mode: "hint" })).not.toBe(aiCacheKey(base));
  });

  it("nhan AI bat buoc", () => {
    expect(AI_LABEL).toMatch(/do AI tạo, có thể sai/);
  });
});
