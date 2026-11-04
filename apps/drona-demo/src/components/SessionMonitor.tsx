"use client";

import * as React from "react";

/** Recheck access after returning to a tab; private data never enters a shared store. */
export function SessionMonitor(): React.ReactElement | null {
  const [unavailable, setUnavailable] = React.useState(false);
  React.useEffect(() => {
    let active = true;
    let pending = false;
    const check = async () => {
      if (pending || document.visibilityState === "hidden") return;
      pending = true;
      try {
        const response = await fetch("/api/auth/status", { cache: "no-store", credentials: "same-origin" });
        if (!active) return;
        if (response.status === 401) {
          window.location.replace("/login?expired=1");
          return;
        }
        setUnavailable(!response.ok);
      } catch {
        if (active) setUnavailable(true);
      } finally { pending = false; }
    };
    void check();
    const timer = window.setInterval(() => void check(), 30000);
    const resume = () => void check();
    window.addEventListener("focus", resume);
    document.addEventListener("visibilitychange", resume);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", resume); document.removeEventListener("visibilitychange", resume); };
  }, []);
  return unavailable ? <div role="status" className="fixed left-1/2 top-2 z-[90] max-w-[90vw] -translate-x-1/2 rounded-card border border-separator bg-surface px-4 py-2 text-caption text-label-secondary">Connection interrupted. Access will be checked again when the connection returns.</div> : null;
}
