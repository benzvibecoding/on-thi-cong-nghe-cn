"use client";

import { create } from "zustand";

export type Theme = "light" | "dark";

interface UiState {
  theme: Theme;
  onboardingDone: boolean;
  studyGoal: number | null;
  minutesPerDay: number;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setOnboardingDone: (done: boolean) => void;
  setStudyGoal: (goal: number | null) => void;
  setMinutesPerDay: (minutes: number) => void;
}

function initialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem("cncn-theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export const useUiStore = create<UiState>()((set) => ({
  theme: typeof window === "undefined" ? "light" : initialTheme(),
  onboardingDone:
    typeof window !== "undefined" &&
    window.localStorage.getItem("cncn-onboarding") === "done",
  studyGoal:
    typeof window === "undefined"
      ? null
      : Number(window.localStorage.getItem("cncn-goal")) || null,
  minutesPerDay:
    typeof window === "undefined"
      ? 30
      : Number(window.localStorage.getItem("cncn-minutes")) || 30,
  setTheme: (theme) => {
    try {
      window.localStorage.setItem("cncn-theme", theme);
      document.documentElement.classList.toggle("dark", theme === "dark");
    } catch {
      // Storage may be unavailable (private mode); theme still applies in-memory.
    }
    set({ theme });
  },
  toggleTheme: () =>
    set((s) => {
      const next: Theme = s.theme === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem("cncn-theme", next);
        document.documentElement.classList.toggle("dark", next === "dark");
      } catch {
        // ignore storage errors
      }
      return { theme: next };
    }),
  setOnboardingDone: (done) => {
    try {
      window.localStorage.setItem("cncn-onboarding", done ? "done" : "");
    } catch {
      // ignore storage errors
    }
    set({ onboardingDone: done });
  },
  setStudyGoal: (goal) => {
    try {
      window.localStorage.setItem("cncn-goal", goal === null ? "" : String(goal));
    } catch {
      // ignore storage errors
    }
    set({ studyGoal: goal });
  },
  setMinutesPerDay: (minutes) => {
    const v = Math.max(5, Math.min(240, Math.round(minutes) || 30));
    try {
      window.localStorage.setItem("cncn-minutes", String(v));
    } catch {
      // ignore storage errors
    }
    set({ minutesPerDay: v });
  },
}));
