import Link from "next/link";
import { APP_CONFIG, EXAM_CONFIG, daysUntilExam, examTotalPoints } from "@/domain/exam-config";
import { OnboardingGate } from "@/components/Onboarding";

const CARDS = [
  { href: "/hoc", title: "Học theo chủ đề", desc: "Tóm tắt lý thuyết, công thức, ký hiệu. Có ở M5." },
  { href: "/luyen-tap", title: "Luyện tập", desc: "Lọc theo chủ đề, mức độ, dạng câu. Có ở M3." },
  { href: "/thi-thu", title: "Thi thử", desc: "Đúng cấu trúc 24 + 4, 50 phút. Có ở M4." },
  { href: "/on-tap", title: "Ôn tập", desc: "Sổ câu sai, SRS, flashcards. Có ở M5." },
  { href: "/thong-ke", title: "Thống kê", desc: "Mức nắm vững, điểm dự kiến. Có ở M6." },
];

export default function HomePage() {
  const days = daysUntilExam();
  return (
    <div className="flex flex-col gap-4">
      <OnboardingGate />
      <section
        aria-labelledby="gioi-thieu"
        className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5"
      >
        <h1 id="gioi-thieu" className="text-2xl font-bold">
          {APP_CONFIG.appName}
        </h1>
        <p className="mt-1 text-[var(--ink-muted)]">{APP_CONFIG.tagline}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-[var(--bg-sunken)] p-3">
            <dt className="text-[var(--ink-muted)]">Cấu trúc đề</dt>
            <dd className="font-semibold">
              {EXAM_CONFIG.part1.count} trắc nghiệm + {EXAM_CONFIG.part2.count} Đúng/Sai
            </dd>
          </div>
          <div className="rounded-xl bg-[var(--bg-sunken)] p-3">
            <dt className="text-[var(--ink-muted)]">Thang điểm</dt>
            <dd className="font-semibold">Tối đa {examTotalPoints().toFixed(0)}/10</dd>
          </div>
          <div className="rounded-xl bg-[var(--bg-sunken)] p-3">
            <dt className="text-[var(--ink-muted)]">Thời gian</dt>
            <dd className="font-semibold">{EXAM_CONFIG.totalMinutes} phút</dd>
          </div>
          <div className="rounded-xl bg-[var(--bg-sunken)] p-3">
            <dt className="text-[var(--ink-muted)]">Còn lại</dt>
            <dd className="font-semibold">
              {days >= 0 ? `${days} ngày tới kỳ thi` : "Đã qua ngày thi dự kiến"}
            </dd>
          </div>
        </dl>
      </section>
      <section aria-label="Các phần chính" className="grid gap-3 sm:grid-cols-2">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="touch-target rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4 hover:border-[var(--accent)]"
          >
            <span className="font-semibold">{card.title}</span>
            <span className="block text-sm text-[var(--ink-muted)]">{card.desc}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
