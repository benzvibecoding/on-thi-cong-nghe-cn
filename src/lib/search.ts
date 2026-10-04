import { removeVietnameseAccents } from "./utils";
import type { Flashcard } from "@/domain/flashcards";
import type { Question } from "@/domain/question-schema";
import type { LessonContent } from "@/domain/taxonomy";

export interface SearchCorpus {
  lessons: Array<{ topicId: string; title: string; lesson: LessonContent }>;
  cards: Flashcard[];
  questions: Question[];
}

export interface SearchHits {
  lessons: SearchCorpus["lessons"];
  cards: Flashcard[];
  questions: Question[];
}

function norm(s: string): string {
  return removeVietnameseAccents(s.toLowerCase());
}

/** Accent-insensitive substring search (gõ không dấu vẫn tìm được). */
export function searchAll(corpus: SearchCorpus, query: string, limit = 20): SearchHits {
  const q = norm(query.trim());
  if (q.length < 2) return { lessons: [], cards: [], questions: [] };
  const match = (text: string) => norm(text).includes(q);
  return {
    lessons: corpus.lessons
      .filter((l) => match(l.title) || match(l.lesson.body))
      .slice(0, limit),
    cards: corpus.cards
      .filter((c) => match(c.front) || match(c.back))
      .slice(0, limit),
    questions: corpus.questions
      .filter((x) => match(x.stem) || match(x.explanation))
      .slice(0, limit),
  };
}
