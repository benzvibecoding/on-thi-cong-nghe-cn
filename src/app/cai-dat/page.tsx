"use client";

import { useEffect, useState } from "react";
import { collectBackup, restoreBackup, wipeLocalData } from "@/data/backup-store";
import { verifyBackup } from "@/domain/backup";
import { SyncSection } from "@/features/settings/SyncSection";
import { useUiStore } from "@/store/ui-store";

type Status = { kind: "ok" | "err"; text: string } | null;

export default function CaiDatPage() {
  const minutesPerDay = useUiStore((s) => s.minutesPerDay);
  const setMinutesPerDay = useUiStore((s) => s.setMinutesPerDay);
  const studyGoal = useUiStore((s) => s.studyGoal);
  const setStudyGoal = useUiStore((s) => s.setStudyGoal);
  const [status, setStatus] = useState<Status>(null);
  const [storageInfo, setStorageInfo] = useState("Đang kiểm tra…");
  const [confirmWipe, setConfirmWipe] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let persisted = false;
        let usage = "";
        if (navigator.storage?.persist) {
          try {
            persisted = await navigator.storage.persist();
          } catch {
              persisted = false;
            }
          }
        if (navigator.storage?.estimate) {
          const est = await navigator.storage.estimate();
          const mb = ((est.usage ?? 0) / 1024 / 1024).toFixed(1);
          usage = ` • đã dùng khoảng ${mb} MB`;
        }
        if (!cancelled) {
          setStorageInfo(
            `Trình duyệt ${persisted ? "đồng ý giữ" : "có thể xóa"} dữ liệu khi thiếu chỗ${usage}. Hãy sao lưu định kỳ.`
          );
        }
      } catch {
        if (!cancelled) setStorageInfo("Không kiểm tra được bộ nhớ trên thiết bị này.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const readSrsLimit = (): number => {
    try {
      return Number(window.localStorage.getItem("cncn-srs-limit")) || 10;
    } catch {
      return 10;
    }
  };

  const download = async () => {
    setStatus(null);
    try {
      const payload = await collectBackup({
        theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
        onboardingDone: window.localStorage.getItem("cncn-onboarding") === "done",
        studyGoal,
        minutesPerDay,
        srsLimit: readSrsLimit(),
      });
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cncn-backup-v${payload.version}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      const total =
        payload.stores.bookmarks.length + payload.stores.notes.length +
        payload.stores.practiceEvents.length + payload.stores.srsStates.length +
        payload.stores.examSessions.length + payload.stores.reports.length;
      setStatus({ kind: "ok", text: `Đã xuất ${total} mục (checksum ${payload.checksum.slice(0, 12)}…).` });
    } catch {
      setStatus({ kind: "err", text: "Không xuất được bản sao lưu (mã E104)." });
    }
  };

  const importFile = async (file: File) => {
    setStatus(null);
    try {
      const text = await file.text();
      const result = await verifyBackup(JSON.parse(text));
      if (!result.ok) {
        setStatus({ kind: "err", text: result.error });
        return;
      }
      if (!window.confirm("Khôi phục sẽ THAY THẾ toàn bộ dữ liệu hiện tại. Tiếp tục?")) return;
      const counts = await restoreBackup(result.payload);
      // Apply saved app settings (M7 leftover).
      const s = result.payload.settings;
      try {
        document.documentElement.classList.toggle("dark", s.theme === "dark");
        window.localStorage.setItem("cncn-theme", s.theme);
        window.localStorage.setItem("cncn-onboarding", s.onboardingDone ? "done" : "");
        window.localStorage.setItem("cncn-goal", s.studyGoal === null ? "" : String(s.studyGoal));
        window.localStorage.setItem("cncn-minutes", String(s.minutesPerDay));
        window.localStorage.setItem("cncn-srs-limit", String(s.srsLimit));
        setMinutesPerDay(s.minutesPerDay);
        setStudyGoal(s.studyGoal);
      } catch {
        // Settings apply is best-effort; data restore already succeeded.
      }
      const total = Object.values(counts).reduce((s2, n) => s2 + n, 0);
      setStatus({ kind: "ok", text: `Đã khôi phục ${total} mục. Tải lại trang để thấy dữ liệu.` });
    } catch {
      setStatus({ kind: "err", text: "File không đọc được hoặc đã hỏng." });
    }
  };

  const wipe = async () => {
    if (!confirmWipe) {
      setConfirmWipe(true);
      return;
    }
    try {
      await wipeLocalData();
      window.localStorage.removeItem("cncn-onboarding");
      setConfirmWipe(false);
      setStatus({ kind: "ok", text: "Đã xóa toàn bộ dữ liệu cục bộ trên thiết bị này." });
    } catch {
      setStatus({ kind: "err", text: "Không xóa được dữ liệu (mã E104)." });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Cài đặt</h1>
      {status && (
        <p role={status.kind === "err" ? "alert" : "status"} className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-3 text-sm">
          {status.text}
        </p>
      )}
      <section aria-labelledby="hoc-tap" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <h2 id="hoc-tap" className="font-bold">Học tập</h2>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <span className="font-semibold">Phút/ngày</span>
            <input
              type="number" min={5} max={240} value={minutesPerDay}
              onChange={(e) => setMinutesPerDay(Number(e.target.value))}
              className="touch-target w-20 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2"
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="font-semibold">Mục tiêu</span>
            <select
              value={studyGoal ?? ""}
              onChange={(e) => setStudyGoal(e.target.value === "" ? null : Number(e.target.value))}
              className="touch-target rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2"
            >
              <option value="">Chưa đặt</option>
              {[6, 7, 8, 9, 10].map((g) => (
                <option key={g} value={g}>{g} điểm</option>
              ))}
            </select>
          </label>
        </div>
      </section>
      <section aria-labelledby="sao-luu" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <h2 id="sao-luu" className="font-bold">Sao lưu và khôi phục</h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          File JSON có version và mã kiểm tra toàn vẹn. Giữ file ở nơi an toàn.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => void download()} className="touch-target rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-ink)]">
            Xuất bản sao lưu
          </button>
          <label className="touch-target cursor-pointer rounded-lg border border-[var(--line)] px-4 py-2">
            Nhập bản sao lưu
            <input
              type="file" accept="application/json,.json" className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importFile(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </section>
      <SyncSection />
      <section aria-labelledby="bo-nho" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <h2 id="bo-nho" className="font-bold">Bộ nhớ thiết bị</h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">{storageInfo}</p>
        <button
          type="button" onClick={() => void wipe()}
          className="touch-target mt-3 rounded-lg border border-[var(--danger)] px-4 text-[var(--danger)]"
        >
          {confirmWipe ? "Chạm lần nữa để xác nhận xóa hết" : "Xóa toàn bộ dữ liệu cục bộ"}
        </button>
      </section>
    </div>
  );
}
