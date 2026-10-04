import type { Metadata } from "next";
import { APP_CONFIG, EXAM_CONFIG, LEVEL_LABEL, examTotalPoints } from "@/domain/exam-config";

export const metadata: Metadata = { title: "Thông tin kỳ thi" };

export default function ThongTinKyThiPage() {
  return (
    <article className="flex flex-col gap-4">
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <h1 className="text-2xl font-bold">Thông tin kỳ thi</h1>
        <p className="mt-2 text-[var(--ink-muted)]">
          {APP_CONFIG.disclaimer} Nội dung dưới đây tổng hợp từ cấu hình đề thi trong
          app (cập nhật lần cuối {EXAM_CONFIG.lastReviewed}); luôn đối chiếu văn bản
          chính thức của Bộ GD&ĐT trước kỳ thi.
        </p>
        <ul className="mt-3 list-disc pl-5 text-sm">
          {APP_CONFIG.officialLinks.map((link) => (
            <li key={link.href}>
              <a className="underline" href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <h2 className="text-lg font-bold">Cấu trúc đề {EXAM_CONFIG.subject}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px]">
          <li>
            Phần I: {EXAM_CONFIG.part1.count} câu trắc nghiệm nhiều lựa chọn,{" "}
            {EXAM_CONFIG.part1.pointsPerQuestion} điểm/câu.
          </li>
          <li>
            Phần II: {EXAM_CONFIG.part2.count} câu Đúng/Sai, mỗi câu 4 ý. Điểm theo số
            ý đúng: 1 ý = 0,1; 2 ý = 0,25; 3 ý = 0,5; 4 ý = 1,0.
          </li>
          <li>
            Thời gian {EXAM_CONFIG.totalMinutes} phút. Tổng {examTotalPoints().toFixed(0)}
            /10 điểm. Không có Phần III.
          </li>
          <li>
            Tỉ lệ mức độ {LEVEL_LABEL.nb} : {LEVEL_LABEL.th} : {LEVEL_LABEL.vd} ={" "}
            {EXAM_CONFIG.levelRatio.nb}:{EXAM_CONFIG.levelRatio.th}:
            {EXAM_CONFIG.levelRatio.vd} [CẦN KIỂM TRA cho 2027].
          </li>
          <li>
            Ngày thi: {EXAM_CONFIG.examDateISO} ({EXAM_CONFIG.examDateNote})
          </li>
        </ul>
      </section>
    </article>
  );
}
