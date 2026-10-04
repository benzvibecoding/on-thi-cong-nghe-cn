import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import { questionSchema } from "@/domain/question-schema";
import { questionToYaml } from "@/features/studio/toYaml";

describe("studio YAML roundtrip", () => {
  it("mcq: toYaml -> parse -> schema", () => {
    const q = questionSchema.parse({
      id: "st-mcq-01",
      type: "mcq",
      topicId: "t1",
      level: "th",
      skill: "compute",
      stem: "Chon $U = I \\cdot R$?",
      mcq: { options: ["a:b", "c", "d", "e"], correct: "A" },
      explanation: "Vi A.",
      commonMistake: "Nhan 'dau' nay.",
      source: { kind: "original" },
      status: "draft",
      version: 1,
      tags: ["studio"],
    });
    const yaml = questionToYaml(q);
    const back = questionSchema.parse((parseYaml(yaml) as unknown[])[0]);
    expect(back).toEqual(q);
  });

  it("tf4: toYaml -> parse -> schema (du 4 khoa a-d)", () => {
    const q = questionSchema.parse({
      id: "st-tf4-01",
      type: "tf4",
      topicId: "t1",
      level: "vd",
      stem: "Xet.",
      tf4: {
        context: "Boi canh.",
        statements: (["a", "b", "c", "d"] as const).map((key) => ({
          key, text: `Y ${key}`, isTrue: key !== "b", explanation: "Giai thich.",
        })),
      },
      explanation: "Ket luan.",
      source: { kind: "ai-assisted" },
      status: "draft",
      version: 2,
      tags: [],
    });
    const back = questionSchema.parse((parseYaml(questionToYaml(q)) as unknown[])[0]);
    expect(back).toEqual(q);
  });
});
