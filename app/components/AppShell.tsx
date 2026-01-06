"use client";

import TopRightNav from "./TopRightNav";
import Sidebar from "./Sidebar";
import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { clearOwnerStorage, setStorageOwner } from "../lib/storageOwner";


type Me = { ok: true; username: string } | { ok: false };

type Plan = "none" | "basic" | "pro" | "elite";
type PlanStatus = { ok: true; plan: Plan; active: boolean } | { ok: false };

function planLabel(plan: Plan) {
  if (plan === "basic") return "Basic";
  if (plan === "pro") return "Pro";
  if (plan === "elite") return "Elite";
  return "Brak";
}

export default function AppShell(props: {
  title?: string;
  children: React.ReactNode;
  showTopbar?: boolean;
  container?: boolean;
}) {
  const pathname = usePathname();

  const [username, setUsername] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanStatus | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const authenticated = !!username;

  useEffect(() => {
    let alive = true;

    async function load() {
      setAuthReady(false);

      // 1) Najpierw sesja (owner) – MUSI być ustawiony przed czytaniem localStorage przez dzieci
      try {
        const r = await fetch("/api/me", { cache: "no-store" });
        const j = (await r.json()) as Me;
        if (!alive) return;

        const newOwner = j.ok ? j.username : "guest";

        setStorageOwner(newOwner);
        // żeby dane "gościa" nie mieszały się z kontem po logowaniu
        if (newOwner !== "guest") clearOwnerStorage("guest");

        setUsername(j.ok ? j.username : null);
      } catch {
        if (!alive) return;
        setStorageOwner("guest");
        setUsername(null);
      }

      // 2) Potem status planu (może się nie udać – nie blokujemy aplikacji)
      try {
        const r = await fetch("/api/billing/status", { cache: "no-store" });
        const j = (await r.json()) as PlanStatus;
        if (!alive) return;
        setPlan(j);
      } catch {
        if (!alive) return;
        setPlan({ ok: false } as any);
      }
    }

    load()
      .catch(() => null)
      .finally(() => {
        if (!alive) return;
        setAuthReady(true);
      });

    return () => {
      alive = false;
    };
  }, [pathname]);

  const badge = useMemo(() => {
    if (!authenticated) return { who: "Gość", sub: "Zaloguj się" };
    const p = plan && plan.ok && plan.active ? planLabel(plan.plan) : "Brak planu";
    return { who: username ?? "Użytkownik", sub: p };
  }, [authenticated, username, plan]);

  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Sidebar authenticated={authenticated} />

      <div className="flex min-h-screen flex-1 flex-col">
        {props.showTopbar !== false ? (
          <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-[var(--background)]/80 backdrop-blur dark:border-white/10">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
              <div>
                <div className="text-sm font-black text-zinc-950 dark:text-white">
                  {props.title ?? "Panel"}
                </div>
                <div className="text-xs font-semibold text-zinc-600 dark:text-white/60">
                  {badge.who} • {badge.sub}
                </div>
              </div>

              <TopRightNav />
            </div>
          </header>
        ) : null}

        <main className="flex-1">
          {!authReady ? (
            <div className="mx-auto w-full max-w-6xl px-4 py-6">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700 dark:border-white/10 dark:bg-black dark:text-white/70">
                Ładowanie sesji...
              </div>
            </div>
          ) : props.container === false ? (
            props.children
          ) : (
            <div className="mx-auto w-full max-w-6xl px-4 py-6">{props.children}</div>
          )}
        </main>
      </div>
    </div>
  );
}
