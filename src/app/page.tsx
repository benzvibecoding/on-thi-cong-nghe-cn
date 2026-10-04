import Link from "next/link";
import { APP_CONFIG, EXAM_CONFIG, examTotalPoints } from "@/domain/exam-config";
import { OnboardingGate } from "@/components/Onboarding";
import { Countdown } from "@/components/Countdown";

function ActionIcon({ d }: { d: React.ReactNode }) {
  return (
    <span aria-hidden="true" className="tint h-11 w-11">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {d}
      </svg>
    </span>
  );
}

const CARDS = [
  {
    href: "/hoc",
    title: "Học theo chủ đề",
    desc: "Lý thuyết, công thức, ký hiệu và lỗi thường gặp.",
    icon: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13z M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />,
  },
  {
    href: "/luyen-tap",
    title: "Luyện tập",
    desc: "Lọc theo chủ đề, mức độ, dạng câu và trạng thái.",
    icon: <path d="M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />,
  },
  {
    href: "/thi-thu",
    title: "Thi thử",
    desc: "Đúng cấu trúc 24 + 4, 50 phút, tự nộp khi hết giờ.",
    icon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  },
  {
    href: "/on-tap",
    title: "Ôn tập",
    desc: "Sổ câu sai, thẻ ghi nhớ ngắt quãng.",
    icon: <path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8L12 3z" />,
  },
  {
    href: "/thong-ke",
    title: "Thống kê",
    desc: "Mức nắm vững, điểm dự kiến, kế hoạch ôn.",
    icon: <path d="M4 20V10 M10 20V4 M16 20v-8 M22 20H2" />,
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-4">
      <OnboardingGate />
      <section aria-labelledby="gioi-thieu" className="card rise relative overflow-hidden p-5 sm:p-6">
        <div className="hero-dots absolute inset-0" aria-hidden="true" />
        <div className="relative">
          <h1 id="gioi-thieu" className="text-[26px] font-extrabold leading-snug tracking-tight sm:text-3xl">
            {APP_CONFIG.appName}
          </h1>
          <p className="mt-1 text-[var(--ink-muted)]">{APP_CONFIG.tagline}</p>
          <div className="mt-4">
            <Countdown />
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/luyen-tap"
              className="btn-primary touch-target flex flex-1 items-center justify-center px-4 py-2"
            >
              Bắt đầu luyện ngay →
            </Link>
            <Link
              href="/thi-thu"
              className="btn-ghost touch-target flex flex-1 items-center justify-center px-4 py-2 font-semibold"
            >
              Thi thử 50 phút
            </Link>
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-sm sm:gap-3">
            <div className="rounded-xl bg-[var(--bg-sunken)] px-2 py-3">
              <dt className="text-[13px] text-[var(--ink-muted)]">Cấu trúc</dt>
              <dd className="font-bold">
                {EXAM_CONFIG.part1.count} + {EXAM_CONFIG.part2.count}
              </dd>
            </div>
            <div className="rounded-xl bg-[var(--bg-sunken)] px-2 py-3">
              <dt className="text-[13px] text-[var(--ink-muted)]">Thang điểm</dt>
              <dd className="font-bold">{examTotalPoints().toFixed(0)}/10</dd>
            </div>
            <div className="rounded-xl bg-[var(--bg-sunken)] px-2 py-3">
              <dt className="text-[13px] text-[var(--ink-muted)]">Thời gian</dt>
              <dd className="font-bold">{EXAM_CONFIG.totalMinutes}&apos;</dd>
            </div>
          </dl>
        </div>
      </section>
      <section aria-label="Các phần chính" className="grid gap-3 sm:grid-cols-2">
        {CARDS.map((card, i) => (
          <Link
            key={card.href}
            href={card.href}
            style={{ animationDelay: `${Math.min(i, 4) * 60}ms` }}
            className="card card-hover rise touch-target flex items-center gap-3 p-4"
          >
            <ActionIcon d={card.icon} />
            <span className="min-w-0 flex-1">
              <span className="block font-bold">{card.title}</span>
              <span className="block text-sm text-[var(--ink-muted)]">{card.desc}</span>
            </span>
            <span aria-hidden="true" className="text-xl font-bold text-[var(--ink-muted)]">
              →
            </span>
          </Link>
        ))}
        <Link
          href="/thong-tin-ky-thi"
          className="touch-target rounded-2xl border border-dashed border-[var(--line)] p-4 text-sm text-[var(--ink-muted)] hover:border-[var(--accent)]"
        >
          <span className="block font-bold text-[var(--ink)]">Thông tin kỳ thi</span>
          Cấu trúc đề, lịch thi, đề chính thức các năm.
        </Link>
      </section>
    </div>
  );
}
