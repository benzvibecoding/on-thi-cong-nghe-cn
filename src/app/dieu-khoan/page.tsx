import type { Metadata } from "next";

export const metadata: Metadata = { title: "Điều khoản sử dụng" };

export default function TermsPage() {
  return (
    <article className="flex flex-col gap-4">
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <h1 className="text-2xl font-bold">Điều khoản sử dụng</h1>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-[15px]">
          <li>
            Ứng dụng ôn tập độc lập, <strong>không phải sản phẩm của Bộ Giáo dục và Đào tạo</strong>.
            Cấu trúc đề và lịch thi trong app chỉ mang tính tham khảo — luôn đối chiếu văn bản
            chính thức trước kỳ thi.
          </li>
          <li>
            Câu hỏi gắn huy hiệu “Chưa kiểm duyệt” có thể sai. Chỉ câu đã kiểm duyệt mới dùng cho
            thi thử, và nội dung AI (nếu bật) luôn gắn nhãn “do AI tạo, có thể sai”.
          </li>
          <li>Điểm dự kiến là ước lượng thống kê, không phải cam kết kết quả thi thật.</li>
          <li>Chỉ dùng cho học tập cá nhân, phi thương mại. Không sao chép đề thi có bản quyền vào app.</li>
          <li>App cung cấp “nguyên trạng”; người phát triển không chịu trách nhiệm về thiệt hại do
            dùng thông tin chưa kiểm chứng.</li>
        </ul>
      </section>
    </article>
  );
}
