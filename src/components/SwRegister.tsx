"use client";

import { useEffect } from "react";

/** Register the M1 offline service worker. Failures are silent by design. */
export function SwRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        // Offline support is best-effort in M1; app works without it.
      }
    };
    void register();
  }, []);
  return null;
}
