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
            {EXAM_CONFIG.levelRatio.vd} (đã xác thực cho đề 2025; 2027 giả định
            giữ ổn định).
          </li>
          <li>
            Phạm vi: chủ yếu chương trình lớp 12, có xen kiến thức lớp 10 và 11.
          </li>
          <li>
            Ngày thi: {EXAM_CONFIG.examDateISO} ({EXAM_CONFIG.examDateNote})
          </li>
          <li>
            Hình thức 2027: thi <strong>trên giấy</strong> (kết luận của Phó Thủ
            tướng ngày 10/9/2026: chưa thí điểm thi trên máy tính năm 2027). App
            vẫn có 2 chế độ giao diện Giấy/Máy tính để bạn luyện thao tác.
          </li>
        </ul>
      </section>
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <h2 className="text-lg font-bold">Đề thi và đáp án các năm (báo chí đăng tải)</h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Bản quyền thuộc Bộ GD&ĐT và cơ quan đăng tải. App chỉ dẫn link, không
          sao chép đề vào ngân hàng.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px]">
          {APP_CONFIG.examPaperLinks.map((link) => (
            <li key={link.href}>
              <a className="underline" href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
