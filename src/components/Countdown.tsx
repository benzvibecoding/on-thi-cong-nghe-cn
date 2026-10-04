"use client";

import { useEffect, useState } from "react";
import { EXAM_CONFIG } from "@/domain/exam-config";

function parts(): { days: number; hours: number; minutes: number; past: boolean } {
  const target = new Date(`${EXAM_CONFIG.examDateISO}T07:30:00+07:00`).getTime();
  const diff = target - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, past: true };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    past: false,
  };
}

/** Live countdown tiles to exam morning. Decorative; exact date stays in text. */
export function Countdown() {
  const [now, setNow] = useState<ReturnType<typeof parts> | null>(null);

  useEffect(() => {
    // Compute only on the client to avoid SSR/client clock mismatch (hydration).
    let timer: ReturnType<typeof setInterval> | undefined;
    const raf = requestAnimationFrame(() => {
      setNow(parts());
      timer = setInterval(() => setNow(parts()), 30000);
    });
    return () => {
      cancelAnimationFrame(raf);
      if (timer) clearInterval(timer);
    };
  }, []);

  if (!now) {
    return (
      <div className="flex items-stretch gap-2" aria-label="Đang tải đếm ngược">
        {[0, 1, 2].map((i) => (
          <div key={i} className="min-w-[68px] flex-1 animate-pulse rounded-xl bg-[var(--bg-sunken)] px-2 py-2 text-center">
            <p className="font-mono text-2xl font-extrabold leading-none">–</p>
            <p className="mt-1 text-[12px]">&nbsp;</p>
          </div>
        ))}
      </div>
    );
  }

  if (now.past) {
    return <p className="chip chip-warn">Đã qua ngày thi dự kiến</p>;
  }
  const tiles = [
    { value: now.days, label: "ngày" },
    { value: now.hours, label: "giờ" },
    { value: now.minutes, label: "phút" },
  ];
  return (
    <div className="flex items-stretch gap-2" role="timer" aria-label={`Còn ${now.days} ngày ${now.hours} giờ ${now.minutes} phút tới kỳ thi`}>
      {tiles.map((t) => (
        <div key={t.label} className="min-w-[68px] flex-1 rounded-xl bg-[var(--accent)] px-2 py-2 text-center text-[var(--accent-ink)]">
          <p className="font-mono text-2xl font-extrabold leading-none">{t.value}</p>
          <p className="mt-1 text-[12px] opacity-90">{t.label}</p>
        </div>
      ))}
      <div className="flex flex-1 items-center rounded-xl bg-[var(--bg-sunken)] px-3 text-[13px] leading-snug text-[var(--ink-muted)]">
        tới sáng thi 11/6 — mỗi ngày một tiến bộ
      </div>
    </div>
  );
}
