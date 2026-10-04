import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import { flashcardSchema, type Flashcard } from "@/domain/flashcards";

describe("seed flashcards pass Zod schema", () => {
  const dir = join(process.cwd(), "content", "flashcards");
  const cards: Flashcard[] = [];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".yaml") && !f.endsWith(".yml")) continue;
    for (const c of parseYaml(readFileSync(join(dir, f), "utf8"))) {
      cards.push(flashcardSchema.parse(c));
    }
  }

  it("moi chu de co 4 the (term/formula/symbol)", () => {
    const byTopic = new Map<string, typeof cards>();
    for (const c of cards) {
      if (!byTopic.has(c.topicId)) byTopic.set(c.topicId, []);
      byTopic.get(c.topicId)!.push(c);
    }
    expect(byTopic.size).toBe(9);
    for (const list of byTopic.values()) expect(list).toHaveLength(4);
  });

  it("36 the, id khong trung", () => {
    expect(cards).toHaveLength(36);
    expect(new Set(cards.map((c) => c.id)).size).toBe(36);
  });
});
