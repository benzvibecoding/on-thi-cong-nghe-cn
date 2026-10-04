"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/hoc", label: "Học" },
  { href: "/luyen-tap", label: "Luyện" },
  { href: "/thi-thu", label: "Thi thử" },
  { href: "/on-tap", label: "Ôn tập" },
  { href: "/thong-ke", label: "Thống kê" },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Điều hướng chính">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-col md:gap-1 md:p-3">
        <Link
          href="/"
          className="touch-target rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[var(--bg-sunken)]"
        >
          Trang chủ
        </Link>
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
            className={cn(
              "touch-target rounded-lg px-3 py-2 text-sm",
              pathname === item.href
                ? "bg-[var(--accent)] font-semibold text-[var(--accent-ink)]"
                : "hover:bg-[var(--bg-sunken)]"
            )}
          >
            {item.label}
          </Link>
        ))}
        <Link
          href="/cai-dat"
          className="touch-target rounded-lg px-3 py-2 text-sm hover:bg-[var(--bg-sunken)]"
        >
          Cài đặt
        </Link>
      </div>
      {/* Mobile bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--bg-raised)] md:hidden">
        <div className="grid grid-cols-5" role="list">
          {ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="listitem"
              aria-current={pathname === item.href ? "page" : undefined}
              className={cn(
                "touch-target flex items-center justify-center px-1 py-3 text-center text-[13px] leading-tight",
                pathname === item.href
                  ? "font-semibold text-[var(--accent)]"
                  : "text-[var(--ink-muted)]"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
