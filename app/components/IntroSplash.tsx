"use client";

import { useEffect, useState } from "react";

export default function IntroSplash() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const seen = window.sessionStorage.getItem("intro_seen");
      if (!seen) {
        window.sessionStorage.setItem("intro_seen", "1");
        setOpen(true);
        const t = window.setTimeout(() => setOpen(false), 1200);
        return () => window.clearTimeout(t);
      }
    } catch {
      setOpen(true);
      const t = window.setTimeout(() => setOpen(false), 1200);
      return () => window.clearTimeout(t);
    }
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-zinc-950 text-white">
      <div className="text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
          <span className="text-xl font-black">S</span>
        </div>
        <h1 className="mt-4 text-2xl font-black tracking-tight">SubManager</h1>
        <p className="mt-1 text-sm font-semibold text-white/70">Uruchamiam panel…</p>
        <div className="mt-5 h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-full origin-left animate-[intro_1.1s_ease-in-out_forwards] rounded-full bg-white" />
        </div>
      </div>

      <style jsx>{`
        @keyframes intro {
          0% { transform: scaleX(0); opacity: 0.7; }
          100% { transform: scaleX(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
