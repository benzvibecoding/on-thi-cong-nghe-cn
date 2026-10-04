"use client";

import { useState } from "react";
import { EXAM_CONFIG } from "@/domain/exam-config";
import { useUiStore } from "@/store/ui-store";

/** Onboarding 3 buoc, bo qua duoc. Chi hien khi chua hoan thanh. */
export function OnboardingGate() {
  const onboardingDone = useUiStore((s) => s.onboardingDone);
  const setOnboardingDone = useUiStore((s) => s.setOnboardingDone);
  const studyGoal = useUiStore((s) => s.studyGoal);
  const setStudyGoal = useUiStore((s) => s.setStudyGoal);
  const minutesPerDay = useUiStore((s) => s.minutesPerDay);
  const setMinutesPerDay = useUiStore((s) => s.setMinutesPerDay);
  const [step, setStep] = useState(0);

  if (onboardingDone) return null;

  const finish = () => setOnboardingDone(true);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="lam-quen" className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-[var(--bg-raised)] p-5">
        <h2 id="lam-quen" className="text-lg font-bold">
          Làm quen nhanh ({step + 1}/3)
        </h2>
        {step === 0 && (
          <div>
            <p className="mt-2 text-[15px]">Mục tiêu điểm môn Công nghệ của bạn?</p>
            <div className="mt-2 grid grid-cols-5 gap-1" role="group" aria-label="Mục tiêu điểm">
              {[6, 7, 8, 9, 10].map((g) => (
                <button
                  key={g}
                  type="button"
                  aria-pressed={studyGoal === g}
                  onClick={() => setStudyGoal(g)}
                  className={`touch-target rounded-lg border font-mono ${studyGoal === g ? "border-[var(--accent)] bg-[var(--bg-sunken)] font-bold" : "border-[var(--line)]"}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}
        {step === 1 && (
          <div>
            <p className="mt-2 text-[15px]">
              Kỳ thi dự kiến <strong>{EXAM_CONFIG.examDateISO}</strong> ({EXAM_CONFIG.examDateNote}).
              App sẽ đếm ngược và gợi ý kế hoạch theo số ngày còn lại.
            </p>
          </div>
        )}
        {step === 2 && (
          <div>
            <p className="mt-2 text-[15px]">Mỗi ngày bạn học được khoảng bao nhiêu phút?</p>
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input
                type="number"
                min={5}
                max={240}
                value={minutesPerDay}
                onChange={(e) => setMinutesPerDay(Number(e.target.value))}
                aria-label="Số phút học mỗi ngày"
                className="touch-target w-24 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2"
              />
              phút/ngày
            </label>
          </div>
        )}
        <div className="mt-4 flex gap-2">
          {step < 2 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="touch-target flex-1 rounded-lg bg-[var(--accent)] font-semibold text-[var(--accent-ink)]"
            >
              Tiếp tục
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              className="touch-target flex-1 rounded-lg bg-[var(--accent)] font-semibold text-[var(--accent-ink)]"
            >
              Bắt đầu học
            </button>
          )}
          <button type="button" onClick={finish} className="touch-target rounded-lg border border-[var(--line)] px-4">
            Bỏ qua
          </button>
        </div>
      </div>
    </div>
  );
}
