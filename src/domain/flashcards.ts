import { z } from "zod";

export const flashcardKindSchema = z.enum(["term", "formula", "symbol"]);

export const flashcardSchema = z
  .object({
    id: z.string().min(1),
    topicId: z.string().min(1),
    kind: flashcardKindSchema,
    front: z.string().min(1),
    back: z.string().min(1),
  })
  .strict();

export type Flashcard = z.infer<typeof flashcardSchema>;
export type FlashcardKind = z.infer<typeof flashcardKindSchema>;

export const FLASHCARD_KIND_LABEL: Record<FlashcardKind, string> = {
  term: "Thuật ngữ",
  formula: "Công thức",
  symbol: "Ký hiệu",
};
