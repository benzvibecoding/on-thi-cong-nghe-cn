"use client";

import { useEffect, useState } from "react";
import { isCloudEnabled } from "@/lib/env";
import { getSupabase } from "@/lib/supabase";
import { getLocalEvents, pullEvents, pushEvents } from "@/data/sync";

export function SyncSection() {
  const [enabled] = useState(() => {
    try {
      return isCloudEnabled();
    } catch {
      return false;
    }
  });
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem("cncn-last-sync");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!enabled) return;
    const client = getSupabase();
    if (!client) return;
    let cancelled = false;
    client.auth.getSession().then(({ data }) => {
      if (!cancelled) setEmail(data.session?.user?.email ?? null);
    });
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) setEmail(session?.user?.email ?? null);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [enabled]);

  if (!enabled) {
    return (
      <section aria-labelledby="dong-bo" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <h2 id="dong-bo" className="font-bold">Đồng bộ đa thiết bị</h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Chưa được cấu hình nên app chạy hoàn toàn trên thiết bị này — không ảnh hưởng gì.
          (Người quản trị xem <span className="font-mono">docs/DEPLOY.md</span> để bật Supabase.)
        </p>
      </section>
    );
  }

  const signIn = async () => {
    setStatus(null);
    const client = getSupabase();
    if (!client) return;
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.href },
    });
    if (error) setStatus("Không mở được trang đăng nhập. Hãy thử lại.");
  };

  const signOut = async () => {
    const client = getSupabase();
    if (!client) return;
    await client.auth.signOut();
  };

  const syncNow = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const client = getSupabase();
      if (!client) throw new Error("missing client");
      const { data } = await client.auth.getSession();
      const userId = data.session?.user?.id;
      if (!userId) throw new Error("not signed in");
      const local = await getLocalEvents();
      const { pushed } = await pushEvents(client, userId, local);
      await pullEvents(client, 0).catch(() => []);
      const stamp = new Date().toLocaleString("vi-VN");
      try {
        window.localStorage.setItem("cncn-last-sync", stamp);
      } catch {
        // ignore
      }
      setLastSync(stamp);
      setStatus(`Đã đồng bộ ${pushed} lượt làm.`);
    } catch {
      setStatus("Đồng bộ thất bại (mất mạng hoặc máy chủ bận). Dữ liệu trên máy vẫn an toàn.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="dong-bo" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
      <h2 id="dong-bo" className="font-bold">Đồng bộ đa thiết bị (tùy chọn)</h2>
      {email ? (
        <div className="mt-2 flex flex-col gap-2 text-sm">
          <p>Đã đăng nhập: <strong>{email}</strong></p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void syncNow()} disabled={busy} className="touch-target rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-ink)] disabled:opacity-50">
              {busy ? "Đang đồng bộ…" : "Đồng bộ ngay"}
            </button>
            <button type="button" onClick={() => void signOut()} className="touch-target rounded-lg border border-[var(--line)] px-4">
              Đăng xuất
            </button>
          </div>
          {lastSync && <p className="text-[var(--ink-muted)]">Lần cuối: {lastSync}</p>}
        </div>
      ) : (
        <div className="mt-2">
          <button type="button" onClick={() => void signIn()} className="touch-target rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-ink)]">
            Đăng nhập bằng Google
          </button>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">Chỉ dùng để đồng bộ tiến độ giữa các thiết bị.</p>
        </div>
      )}
      {status && <p role="status" className="mt-2 text-sm">{status}</p>}
    </section>
  );
}
