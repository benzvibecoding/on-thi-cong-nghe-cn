/**
 * SINGLE SOURCE OF TRUTH for exam structure and app identity.
 * If the 2027 exam format changes, edit ONLY this file.
 *
 * Sources (re-checked online 04/10/2026):
 * - QD 764/QD-BGDDT 2024 (trich van ban goc): mon cong nghe = 28 cau, 2 phan:
 *   Phan I 24 cau + Phan II 4 cau; thang diem 0,25 / 0,1-0,25-0,5-1,0; tong 10.
 *   Trang tong hop ghi 18/4/6 la SAI (do la cau truc mon Ly/Hoa/Sinh/Dia),
 *   khong ap dung cho Cong nghe.
 * - Ti le 4:3:3 da xac thuc cho de 2025 (Cuc truong Cuc QLCL, bao chi 03/2025).
 * - Lich thi: QD 2308/QD-BGDDT (06/08/2026): 11-12/6 hang nam.
 * - Hinh thuc 2027: thi TREN GIAY (Ket luan Pho Thu tuong 10/09/2026:
 *   chua thi diem tren may tinh nam 2027). App giu 2 che do giao dien
 *   (Giay/May tinh) de luyen thao tac, khong phai mo phong quy che.
 * - Pham vi: chu yeu lop 12, co xen kien thuc 10/11 (bao chi dan nguon Bo).
 */
export const APP_CONFIG = {
  appName: "Ôn thi Công nghệ CN",
  tagline: "Học chắc – Luyện đúng – Thi thử như thi thật",
  disclaimer:
    "Ứng dụng ôn tập độc lập, KHÔNG phải sản phẩm của Bộ Giáo dục và Đào tạo.",
  officialLinks: [
    { label: "Bộ GD&ĐT", href: "https://moet.gov.vn" },
    {
      label: "QĐ 764/QĐ-BGDĐT 2024 (cấu trúc đề thi)",
      href: "https://luatvietnam.vn/giao-duc/quyet-dinh-764-qd-bgddt-2024-cau-truc-de-thi-ky-thi-tot-nghiep-thpt-tu-2025-302643-d1.html",
    },
    {
      label: "QĐ 2308/QĐ-BGDĐT 2026 (khung thời gian năm học, lịch thi 11–12/6)",
      href: "https://thuvienphapluat.vn/banan/tin-tuc/lich-thi-tot-nghiep-thpt-2027-du-kien-theo-quyet-dinh-2308-qd-bgddt-nam-2026-nhu-the-nao-52117.html",
    },
    {
      label: "Bộ GD&ĐT về thi trên máy tính (07/2026)",
      href: "https://vqa.moet.gov.vn/vi/news/tin-tuc-su-kien/bo-gddt-noi-gi-ve-de-an-to-chuc-thi-tot-nghiep-thpt-tren-may-tinh-286.html",
    },
    {
      label: "Kết luận chưa thí điểm máy năm 2027 (09/2026)",
      href: "https://tuoitre.vn/nam-2027-chua-thi-diem-thi-tot-nghiep-thpt-tren-may-tinh-100260920193150321.htm",
    },
  ],
  /** De thi va dap an do bao chi dang tai (ban quyen thuoc Bo GD&DT / co quan dang). */
  examPaperLinks: [
    {
      label: "Đề minh họa 2025 + hướng dẫn giải (Tuyển sinh 247)",
      href: "https://thi.tuyensinh247.com/huong-dan-giai-de-thi-minh-hoa-mon-cong-nghe-tot-nghiep-thpt-2025-c31a78787.html",
    },
    {
      label: "Đề + đáp án chính thức 2025 (MIT)",
      href: "https://mit.vn/dap-an-va-de-thi-chinh-thuc-mon-cong-nghe-ky-thi-tot-nghiep-thpt-nam-2025/",
    },
    {
      label: "Đáp án chính thức 2025 của Bộ (Dân trí)",
      href: "https://dantri.com.vn/giao-duc/dap-an-chinh-thuc-mon-cong-nghe-cong-nghiep-thi-tot-nghiep-thpt-20250706150652430.htm",
    },
    {
      label: "Đề + đáp án các mã đề 2026 (Dân trí)",
      href: "https://dantri.com.vn/giao-duc/de-va-dap-an-tat-ca-cac-ma-de-mon-cong-nghe-cong-nghiep-20260611205753872.htm",
    },
    {
      label: "Đáp án các mã đề 2026 (VOV)",
      href: "https://vov.vn/xa-hoi/dap-an-cac-ma-de-mon-cong-nghe-cong-nghiep-ky-thi-tot-nghiep-thpt-2026-post1305700.vov",
    },
    {
      label: "Đáp án 2026 đầy đủ mã đề (Olm)",
      href: "https://olm.vn/bai-viet/dap-an-de-thi-tot-nghiep-thpt-2026-mon-cong-nghe-cong-nghiep-day-du-ma-de-683132577",
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
  // Da xac thuc cho de 2025 (Cuc truong Cuc QLCL tra loi bao chi, 40/30/30).
  // Cho 2027 gia dinh giu on dinh; kiem tra lai khi Bo cong bo.
  levelRatio: { nb: 4, th: 3, vd: 3 } as const,
  // Exam dates per QD 2308/QD-BGDDT (06/08/2026): 11-12/06 yearly.
  examDateISO: "2027-06-11",
  examDateNote: "Theo QĐ 2308/QĐ-BGDĐT (06/8/2026): thi 11–12/6 hằng năm.",
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
