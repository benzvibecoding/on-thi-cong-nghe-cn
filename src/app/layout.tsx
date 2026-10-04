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
  weight: ["400", "500", "600", "700"],
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
    { media: "(prefers-color-scheme: light)", color: "#faf7f1" },
    { media: "(prefers-color-scheme: dark)", color: "#16130e" },
  ],
};

const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("cncn-theme");var d=s==="dark"||(s!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

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
        <header className="relative overflow-hidden border-b border-[var(--line)]">
          <div className="pcb-traces absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-lg font-bold leading-tight">{APP_CONFIG.appName}</p>
              <p className="text-sm text-[var(--ink-muted)]">{APP_CONFIG.tagline}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/tim-kiem"
                aria-label="Tìm kiếm toàn app"
                className="touch-target rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] px-3 py-2 text-sm hover:bg-[var(--bg-sunken)]"
              >
                Tìm kiếm
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <div className="mx-auto flex w-full max-w-5xl flex-1 gap-6 px-4 pb-24 pt-4 md:pb-10">
          <aside className="hidden w-52 shrink-0 md:block">
            <AppNav />
          </aside>
          <main id="noi-dung-chinh" className="min-w-0 flex-1">
            {children}
          </main>
        </div>
        <div className="md:hidden">
          <AppNav />
        </div>
        <footer className="border-t border-[var(--line)] pb-24 md:pb-6">
          <div className="mx-auto flex w-full max-w-5xl flex-wrap gap-x-4 gap-y-1 px-4 py-4 text-sm text-[var(--ink-muted)]">
            <span>{APP_CONFIG.disclaimer}</span>
            <nav aria-label="Liên kết pháp lý" className="flex flex-wrap gap-x-4">
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
