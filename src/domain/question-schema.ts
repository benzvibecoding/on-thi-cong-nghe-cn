import { z } from "zod";

/**
 * SINGLE SOURCE OF TRUTH for the Question model.
 * scripts/content-validate.mjs mirrors these rules in plain JS (it cannot
 * import TS); tests/unit/content-packs.test.ts enforces this schema on seed.
 */

export const questionTypeSchema = z.enum(["mcq", "tf4"]);
export const levelSchema = z.enum(["nb", "th", "vd"]);
export const skillSchema = z.enum([
  "recall",
  "interpret-diagram",
  "compute",
  "real-world",
  "troubleshoot",
]);
export const statusSchema = z.enum(["draft", "reviewed", "published"]);
export const sourceKindSchema = z.enum([
  "original",
  "official-exam",
  "licensed",
  "ai-assisted",
]);

const mediaSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(10, "alt phai mo ta du de hieu khi khong nhin thay hinh"),
  credit: z.string().optional(),
});

const mcqSchema = z
  .object({
    options: z.array(z.string().min(1)).length(4, "mcq phai co dung 4 lua chon"),
    correct: z.enum(["A", "B", "C", "D"]),
  })
  .strict();

const tf4StatementSchema = z
  .object({
    key: z.enum(["a", "b", "c", "d"]),
    text: z.string().min(1),
    isTrue: z.boolean(),
    explanation: z.string().min(1),
  })
  .strict();

const tf4Schema = z
  .object({
    context: z.string().optional(),
    statements: z
      .array(tf4StatementSchema)
      .length(4, "tf4 phai co dung 4 y")
      .refine(
        (ss) => new Set(ss.map((s) => s.key)).size === 4,
        "tf4 phai co du 4 khoa a-d"
      ),
  })
  .strict();

export const questionSchema = z
  .object({
    id: z.string().min(1),
    type: questionTypeSchema,
    topicId: z.string().min(1),
    subtopicId: z.string().optional(),
    level: levelSchema,
    skill: skillSchema.optional(),
    stem: z.string().min(1),
    media: z.array(mediaSchema).optional(),
    mcq: mcqSchema.optional(),
    tf4: tf4Schema.optional(),
    explanation: z.string().min(1, "moi cau phai co loi giai"),
    commonMistake: z.string().optional(),
    source: z
      .object({
        kind: sourceKindSchema,
        ref: z.string().optional(),
        year: z.number().int().optional(),
      })
      .strict(),
    status: statusSchema,
    reviewedBy: z.string().optional(),
    reviewedAt: z.string().optional(),
    version: z.number().int().min(1),
    tags: z.array(z.string()).default([]),
  })
  .strict()
  .refine((q) => (q.type === "mcq" ? q.mcq !== undefined : q.tf4 !== undefined), {
    message: "mcq phai co khoi mcq, tf4 phai co khoi tf4",
  });

export type Question = z.infer<typeof questionSchema>;
export type QuestionType = z.infer<typeof questionTypeSchema>;
export type QuestionLevel = z.infer<typeof levelSchema>;

/** Only reviewed/published questions may enter mock exams. Draft stays in practice. */
export function isExamEligible(q: Question): boolean {
  return q.status === "reviewed" || q.status === "published";
}
