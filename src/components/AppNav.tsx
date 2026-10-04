"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  {
    href: "/hoc",
    label: "Học",
    icon: (
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13z M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
    ),
  },
  {
    href: "/luyen-tap",
    label: "Luyện",
    icon: (
      <path d="M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    ),
  },
  {
    href: "/thi-thu",
    label: "Thi thử",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  },
  {
    href: "/on-tap",
    label: "Ôn tập",
    icon: (
      <>
        <path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8L12 3z" />
      </>
    ),
  },
  {
    href: "/thong-ke",
    label: "Thống kê",
    icon: (
      <path d="M4 20V10 M10 20V4 M16 20v-8 M22 20H2" />
    ),
  },
];

function ItemIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Điều hướng chính">
      {/* Desktop sidebar */}
      <div className="card hidden gap-1 p-2 md:flex md:flex-col">
        <Link
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
          className={cn(
            "touch-target flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold",
            pathname === "/" ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "hover:bg-[var(--bg-sunken)]"
          )}
        >
          <ItemIcon>
            <path d="M3 11l9-8 9 8 M5 10v10h5v-6h4v6h5V10" />
          </ItemIcon>
          Trang chủ
        </Link>
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "touch-target flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm",
                active
                  ? "bg-[var(--accent-soft)] font-bold text-[var(--accent)]"
                  : "hover:bg-[var(--bg-sunken)]"
              )}
            >
              <ItemIcon>{item.icon}</ItemIcon>
              {item.label}
            </Link>
          );
        })}
        <Link
          href="/cai-dat"
          aria-current={pathname === "/cai-dat" ? "page" : undefined}
          className={cn(
            "touch-target flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm",
            pathname === "/cai-dat"
              ? "bg-[var(--accent-soft)] font-bold text-[var(--accent)]"
              : "hover:bg-[var(--bg-sunken)]"
          )}
        >
          <ItemIcon>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1z" />
          </ItemIcon>
          Cài đặt
        </Link>
      </div>
      {/* Mobile bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--bg-raised)]/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-5" role="list">
          {ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                role="listitem"
                aria-current={active ? "page" : undefined}
                className={cn(
                  "touch-target flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[12px] leading-tight",
                  active ? "font-bold text-[var(--accent)]" : "text-[var(--ink-muted)]"
                )}
              >
                <ItemIcon>{item.icon}</ItemIcon>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
