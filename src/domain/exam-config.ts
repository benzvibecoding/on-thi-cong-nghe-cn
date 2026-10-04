/**
 * SINGLE SOURCE OF TRUTH for exam structure and app identity.
 * If the 2027 exam format changes, edit ONLY this file.
 *
 * Sources (checked 04/10/2026, re-check originals before final release):
 * - QD 764/QD-BGDDT 2024, appendix: CNCN = 24 MCQ x 0.25 + 4 TF4 x 1.0 = 10, 50 minutes.
 * - A summary page lists CNCN as 18/4/6 which does NOT sum to 10 -> treated as
 *   inconsistent, NOT adopted. [CAN KIEM TRA van ban goc]
 */
export const APP_CONFIG = {
  appName: "Ôn thi Công nghệ CN",
  tagline: "Học chắc – Luyện đúng – Thi thử như thi thật",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  disclaimer:
    "Ứng dụng ôn tập độc lập, KHÔNG phải sản phẩm của Bộ Giáo dục và Đào tạo.",
  officialLinks: [
    { label: "Bộ GD&ĐT", href: "https://moet.gov.vn" },
    {
      label: "Thông tin thi tốt nghiệp THPT",
      href: "https://moet.gov.vn/tintuc/Pages/thi-tot-nghiep-thpt.aspx",
    },
  ],
} as const;

export const EXAM_CONFIG = {
  subject: "Công nghệ định hướng Công nghiệp",
  totalMinutes: 50,
  totalQuestions: 28,
  part1: { count: 24, choicesPerQuestion: 4, pointsPerQuestion: 0.25 },
  part2: {
    count: 4,
    statementsPerQuestion: 4,
    // Points by number of correctly judged statements (a-d).
    pointsByCorrectCount: { 0: 0, 1: 0.1, 2: 0.25, 3: 0.5, 4: 1.0 } as Record<
      number,
      number
    >,
  },
  // Thinking-level ratio Nhan biet : Thong hieu : Van dung = 4:3:3.
  // [CAN KIEM TRA cho 2027]
  levelRatio: { nb: 4, th: 3, vd: 3 } as const,
  // Exam date is approximate until the Ministry announces the official date.
  // [CAN KIEM TRA] Update here only.
  examDateISO: "2027-06-10",
  examDateNote: "Ngày dự kiến (tháng 6/2027). Cập nhật khi Bộ công bố chính thức.",
  lastReviewed: "2026-10-04",
} as const;

export type Level = keyof typeof EXAM_CONFIG.levelRatio; // "nb" | "th" | "vd"

export const LEVEL_LABEL: Record<Level, string> = {
  nb: "Nhận biết",
  th: "Thông hiểu",
  vd: "Vận dụng",
};

/** Total score for a full paper: 24 x 0.25 + 4 x 1.0 = 10. */
export function examTotalPoints(): number {
  const p1 = EXAM_CONFIG.part1.count * EXAM_CONFIG.part1.pointsPerQuestion;
  const p2 = EXAM_CONFIG.part2.count * EXAM_CONFIG.part2.pointsByCorrectCount[4]!;
  return Math.round((p1 + p2) * 100) / 100;
}

/**
 * EXAM BLUEPRINT — muc tieu chon cau cho de thi thu.
 * Phan I 24 cau theo ti le 4:3:3 (lam tron: 10/7/7). Phan II 4 cau mac dinh
 * 2/1/1 — chi la mac dinh hien thi, KHONG phai so lieu chinh thuc [CAN KIEM TRA].
 * Trong so chu de mac dinh chia deu (weight=1).
 */
export const EXAM_BLUEPRINT = {
  part1: { type: "mcq" as const, count: 24, levels: { nb: 10, th: 7, vd: 7 } as const },
  part2: { type: "tf4" as const, count: 4, levels: { nb: 2, th: 1, vd: 1 } as const },
} as const;

/** Days from `now` until the configured exam date (can be negative). */
export function daysUntilExam(now: Date = new Date()): number {
  const exam = new Date(EXAM_CONFIG.examDateISO + "T00:00:00+07:00");
  const ms = exam.getTime() - now.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}
