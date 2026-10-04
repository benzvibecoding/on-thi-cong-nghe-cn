import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { APP_CONFIG } from "@/domain/exam-config";
import { AppNav } from "@/components/AppNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SwRegister } from "@/components/SwRegister";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-bevnpro",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: APP_CONFIG.appName,
    template: `%s | ${APP_CONFIG.appName}`,
  },
  description: APP_CONFIG.tagline,
  manifest: "/manifest.webmanifest",
  robots: { index: true, follow: true },
  openGraph: {
    title: APP_CONFIG.appName,
    description: APP_CONFIG.tagline,
    type: "website",
    locale: "vi_VN",
  },
  icons: { icon: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("cncn-theme");var d=s==="dark"||(s!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

function BrandMark() {
  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 17h4V7h4v10h4" />
        <circle cx="4" cy="17" r="1.6" fill="var(--accent-ink)" stroke="none" />
        <circle cx="20" cy="17" r="1.6" fill="var(--accent-ink)" stroke="none" />
      </svg>
    </span>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col antialiased">
        <SwRegister />
        <a
          href="#noi-dung-chinh"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-[var(--bg-raised)] focus:px-3 focus:py-2"
        >
          Bỏ qua tới nội dung chính
        </a>
        <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur">
          <div aria-hidden="true" className="h-[3px] bg-[var(--accent)]" />
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-2.5">
            <Link href="/" className="flex items-center gap-2.5" aria-label={`${APP_CONFIG.appName} — trang chủ`}>
              <BrandMark />
              <span>
                <span className="block text-[17px] font-extrabold leading-tight tracking-tight">
                  {APP_CONFIG.appName}
                </span>
                <span className="hidden text-[13px] text-[var(--ink-muted)] sm:block">
                  {APP_CONFIG.tagline}
                </span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/tim-kiem"
                aria-label="Tìm kiếm toàn app"
                className="touch-target rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] px-3 py-2 text-sm font-semibold hover:border-[var(--accent)]"
              >
                Tìm kiếm
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <div className="mx-auto flex w-full max-w-5xl flex-1 gap-6 px-4 pb-24 pt-4 md:pb-10">
          <aside className="hidden w-56 shrink-0 md:block">
            <div className="sticky top-[68px]">
              <AppNav />
            </div>
          </aside>
          <main id="noi-dung-chinh" className="min-w-0 flex-1">
            {children}
          </main>
        </div>
        <div className="md:hidden">
          <AppNav />
        </div>
        <footer className="border-t border-[var(--line)] bg-[var(--bg-raised)] pb-24 md:pb-6">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-5 text-sm text-[var(--ink-muted)]">
            <span>{APP_CONFIG.disclaimer}</span>
            <nav aria-label="Liên kết pháp lý" className="flex flex-wrap gap-x-4 gap-y-1">
              <Link className="underline" href="/thong-tin-ky-thi">Thông tin kỳ thi</Link>
              <Link className="underline" href="/chinh-sach-rieng-tu">Riêng tư</Link>
              <Link className="underline" href="/dieu-khoan">Điều khoản</Link>
              <Link className="underline" href="/ghi-cong">Ghi công</Link>
              <Link className="underline" href="/studio">Studio</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
