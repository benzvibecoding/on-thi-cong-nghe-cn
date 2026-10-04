import { z } from "zod";

/** Taxonomy schema. Data lives in content/taxonomy.yaml; packs embed it as JSON. */

export const subtopicSchema = z
  .object({ id: z.string().min(1), title: z.string().min(1) })
  .strict();

export const topicSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    // Blueprint weight. Default 1 for every topic = equal split.
    // NOT an official figure. [CAN KIEM TRA]
    weight: z.number().positive().default(1),
    subtopics: z.array(subtopicSchema).default([]),
  })
  .strict();

export const taxonomySchema = z
  .object({ version: z.number().int().min(1), topics: z.array(topicSchema).min(1) })
  .strict();

export type Taxonomy = z.infer<typeof taxonomySchema>;
export type Topic = z.infer<typeof topicSchema>;

export interface LessonContent {
  title: string;
  /** Raw Markdown (+ LaTeX), rendered by MathText. */
  body: string;
}

export interface TopicPack {
  topicId: string;
  title: string;
  version: number;
  hash: string;
  lesson: LessonContent | null;
  flashcards: import("./flashcards").Flashcard[];
  questions: import("./question-schema").Question[];
}

export interface PacksManifest {
  version: number;
  taxonomyVersion: number;
  packs: Array<{ topicId: string; title: string; count: number; cards: number; hash: string }>;
}
