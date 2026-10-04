import type { Metadata } from "next";
import { CREDITS } from "@/data/credits.generated";

export const metadata: Metadata = { title: "Ghi công & giấy phép" };

export default function CreditsPage() {
  return (
    <article className="flex flex-col gap-4">
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <h1 className="text-2xl font-bold">Ghi công & giấy phép</h1>
        <p className="mt-2 text-[15px] text-[var(--ink-muted)]">
          Nội dung bài học và câu hỏi do nhóm biên soạn (giấy phép ghi trong từng file khi công
          bố). Hình vẽ là SVG tự vẽ. Bảng dưới liệt kê thư viện mã nguồn mở đang dùng, đọc trực
          tiếp từ gói đã cài (phiên bản thật).
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          {CREDITS.map((c) => (
            <li key={c.name} className="flex justify-between gap-2 rounded-lg bg-[var(--bg-sunken)] px-3 py-2">
              <span className="font-mono">{c.name}@{c.version}</span>
              <span className="text-[var(--ink-muted)]">{c.license}</span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
