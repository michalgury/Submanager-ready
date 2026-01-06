"use client";
import UsageCostCalculator from "../components/UsageCostCalculator";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import AppShell from "../components/AppShell";
import PlansPaywall from "../components/PlansPaywall";
import SubManagerFull from "./SubManagerFull";

type Plan = "none" | "basic" | "pro" | "elite";
type PlanStatus =
  | { ok: true; plan: Plan; active: boolean }
  | { ok: false; error?: string };

export default function SubskrypcjaPage() {
  const sp = useSearchParams();
  const success = sp.get("success");
  const planFromUrl = sp.get("plan");

  const [status, setStatus] = useState<PlanStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const banner = useMemo(() => {
    if (success === "1") {
      const p = planFromUrl ? String(planFromUrl).toUpperCase() : "";
      return `Płatność zakończona sukcesem. Plan: ${p || "OK"}.`;
    }
    return "";
  }, [success, planFromUrl]);

  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch("/api/billing/status", { cache: "no-store" });
      const j = (await r.json()) as PlanStatus;
      setStatus(j);
    } catch {
      setStatus({ ok: false, error: "Nie udało się pobrać statusu planu." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, planFromUrl]);

  const hasAccess = !!(status && status.ok && status.active);

  return (
    <AppShell title="Subskrypcja" showTopbar={false} container={false}>
      {banner ? (
        <div className="sticky top-0 z-30 border-b border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-950 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
          <div className="mx-auto w-full max-w-6xl">{banner}</div>
        </div>
      ) : null}

      {loading ? (
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="h-5 w-40 animate-pulse rounded bg-zinc-200/70 dark:bg-white/10" />
            <div className="mt-4 h-4 w-full animate-pulse rounded bg-zinc-200/70 dark:bg-white/10" />
            <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-zinc-200/70 dark:bg-white/10" />
          </div>
        </div>
      ) : hasAccess ? (
        <SubManagerFull />
      ) : (
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          <PlansPaywall onActivated={() => void refresh()} />
        </div>
      )}
    </AppShell>
  );
}
