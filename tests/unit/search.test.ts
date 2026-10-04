import { describe, expect, it } from "vitest";
import { searchAll, type SearchCorpus } from "@/lib/search";

const corpus: SearchCorpus = {
  lessons: [
    { topicId: "t1", title: "Điện trở và mạch điện", lesson: { title: "t", body: "Điện trở hạn dòng" } },
  ],
  cards: [{ id: "c1", topicId: "t1", kind: "term", front: "Diode", back: "Một chiều" }],
  questions: [
    {
      id: "q1", type: "mcq", topicId: "t1", level: "nb", stem: "Cổng AND ra 1 khi nào?",
      mcq: { options: ["1", "2", "3", "4"], correct: "A" },
      explanation: "e", source: { kind: "original" }, status: "draft", version: 1, tags: [],
    },
  ],
};

describe("search khong dau", () => {
  it("go khong dau van tim duoc", () => {
    expect(searchAll(corpus, "dien tro").lessons).toHaveLength(1);
    expect(searchAll(corpus, "dinh").questions).toHaveLength(0);
    expect(searchAll(corpus, "cong and").questions).toHaveLength(1);
    expect(searchAll(corpus, "mot chieu").cards).toHaveLength(1);
  });

  it("tu khoa ngan hon 2 ky tu tra ve rong", () => {
    expect(searchAll(corpus, "a")).toEqual({ lessons: [], cards: [], questions: [] });
  });
});
