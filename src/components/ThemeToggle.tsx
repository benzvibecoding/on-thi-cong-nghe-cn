"use client";

import { useEffect } from "react";
import { useUiStore } from "@/store/ui-store";

export function ThemeToggle() {
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  useEffect(() => {
    // Keep the <html> class in sync when theme changes elsewhere.
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={theme === "dark"}
      aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
      className="touch-target rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] px-3 text-sm hover:bg-[var(--bg-sunken)]"
    >
      {theme === "dark" ? "Sáng" : "Tối"}
    </button>
  );
}
