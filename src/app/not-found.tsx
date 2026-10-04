import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-6">
      <h1 className="text-xl font-bold">Không tìm thấy trang (mã E102)</h1>
      <p className="mt-2 text-[var(--ink-muted)]">
        Trang bạn mở không tồn tại. Hãy về trang chủ và tiếp tục ôn tập.
      </p>
      <Link href="/" className="mt-4 inline-block underline">
        Về trang chủ
      </Link>
    </div>
  );
}
