import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import { isExamEligible, questionSchema, type Question } from "@/domain/question-schema";
import { taxonomySchema } from "@/domain/taxonomy";

const root = process.cwd();

function loadSeed(): Question[] {
  const dir = join(root, "content", "questions");
  const out: Question[] = [];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".yaml") && !f.endsWith(".yml")) continue;
    const data = parseYaml(readFileSync(join(dir, f), "utf8"));
    for (const q of data) out.push(questionSchema.parse(q));
  }
  return out;
}

describe("seed content passes Zod schema", () => {
  const questions = loadSeed();

  it("co 10 chu de trong taxonomy", () => {
    const taxonomy = taxonomySchema.parse(
      parseYaml(readFileSync(join(root, "content", "taxonomy.yaml"), "utf8"))
    );
    expect(taxonomy.topics).toHaveLength(10);
  });

  it("10 chu de; moi chu de du 2 dang, du 3 muc do", () => {
    const byTopic = new Map<string, Question[]>();
    for (const q of questions) {
      if (!byTopic.has(q.topicId)) byTopic.set(q.topicId, []);
      byTopic.get(q.topicId)!.push(q);
    }
    expect(byTopic.size).toBe(10);
    for (const [topicId, qs] of byTopic) {
      expect(qs.filter((q) => q.type === "mcq").length, `${topicId} mcq`).toBeGreaterThanOrEqual(8);
      expect(qs.filter((q) => q.type === "tf4").length, `${topicId} tf4`).toBeGreaterThanOrEqual(2);
    }
    expect(questions.length).toBeGreaterThanOrEqual(140);
  });

  it("moi chu de phu du 3 muc do nb/th/vd", () => {
    const levels = new Map<string, Set<string>>();
    for (const q of questions) {
      if (!levels.has(q.topicId)) levels.set(q.topicId, new Set());
      levels.get(q.topicId)!.add(q.level);
    }
    for (const [topicId, lv] of levels) {
      expect([...lv].sort(), topicId).toEqual(["nb", "th", "vd"]);
    }
  });

  it("tat ca seed deu draft nen KHONG duoc vao thi thu", () => {
    expect(questions.length).toBeGreaterThan(0);
    for (const q of questions) {
      expect(q.status).toBe("draft");
      expect(isExamEligible(q)).toBe(false);
    }
  });

  it("id on dinh, khong trung", () => {
    const ids = questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("hinh nao cung co alt mo ta du", () => {
    for (const q of questions) {
      for (const m of q.media ?? []) {
        expect(m.alt.length).toBeGreaterThanOrEqual(10);
      }
    }
  });
});
