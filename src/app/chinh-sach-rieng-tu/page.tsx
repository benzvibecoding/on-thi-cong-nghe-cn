import type { Metadata } from "next";

export const metadata: Metadata = { title: "Chính sách riêng tư" };

export default function PrivacyPage() {
  return (
    <article className="flex flex-col gap-4">
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <h1 className="text-2xl font-bold">Chính sách riêng tư</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">Hiệu lực từ 04/10/2026 (bản MVP local-first).</p>
        <h2 className="mt-4 font-bold">1. Dữ liệu ở đâu?</h2>
        <p className="mt-1 text-[15px]">
          Mọi dữ liệu học tập (câu đã làm, ghi chú, thẻ SRS, phiên thi) chỉ lưu trên thiết bị
          của bạn (IndexedDB, localStorage). Không cần tài khoản, không gửi dữ liệu đi đâu.
        </p>
        <h2 className="mt-3 font-bold">2. Chúng tôi thu gì?</h2>
        <p className="mt-1 text-[15px]">
          Không thu tên thật, số điện thoại hay định vị. Không quảng cáo, không cookie theo dõi,
          không analytics bên thứ ba ở bản hiện tại.
        </p>
        <h2 className="mt-3 font-bold">3. Khi bật đồng bộ/AI (tương lai)</h2>
        <p className="mt-1 text-[15px]">
          Đồng bộ đa thiết bị và trợ lý AI là tính năng tùy chọn, mặc định TẮT. Khi bật, chỉ dữ
          liệu tối thiểu cần thiết được gửi tới nhà cung cấp (Supabase/Gemini) và bạn có thể tắt,
          xuất, xóa bất cứ lúc nào.
        </p>
        <h2 className="mt-3 font-bold">4. Quyền của bạn</h2>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-[15px]">
          <li>Xuất toàn bộ dữ liệu ra file JSON tại trang Cài đặt.</li>
          <li>Xóa toàn bộ dữ liệu cục bộ tại trang Cài đặt.</li>
          <li>Trình duyệt có thể tự xóa dữ liệu khi thiếu chỗ — hãy sao lưu định kỳ.</li>
        </ul>
        <h2 className="mt-3 font-bold">5. Học sinh THPT</h2>
        <p className="mt-1 text-[15px]">
          Người dùng chủ yếu là học sinh nên app tối thiểu hóa dữ liệu ngay từ thiết kế và không
          có nội dung tính phí, chat công khai hay thu thập không cần thiết.
        </p>
      </section>
    </article>
  );
}
