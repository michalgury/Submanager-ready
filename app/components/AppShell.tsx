"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";

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
  const router = useRouter();
  const pathname = usePathname();

  const [username, setUsername] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanStatus | null>(null);

  const authenticated = !!username;

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const r = await fetch("/api/me", { cache: "no-store" });
        const j = (await r.json()) as Me;
        if (!alive) return;
        setUsername(j.ok ? j.username : null);
      } catch {
        if (!alive) return;
        setUsername(null);
      }

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

    void load();

    // odśwież przy zmianie trasy (np. po logowaniu)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const badge = useMemo(() => {
    if (!authenticated) return { who: "Gość", sub: "Zaloguj się" };
    const p = plan && plan.ok && plan.active ? planLabel(plan.plan) : "Brak planu";
    return { who: username ?? "Użytkownik", sub: p };
  }, [authenticated, username, plan]);

  async function logout() {
    await fetch("/api/logout", { method: "POST" }).catch(() => null);
    router.push("/?auth=login");
    router.refresh();
  }

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

              <div className="flex items-center gap-2">
                {authenticated ? (
                  <button
                    onClick={logout}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-black text-zinc-950 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                  >
                    Wyloguj
                  </button>
                ) : (
                  <button
                    onClick={() => router.push("/?auth=login")}
                    className="rounded-xl bg-white px-3 py-2 text-xs font-black text-zinc-950 hover:bg-zinc-100"
                  >
                    Zaloguj
                  </button>
                )}
              </div>
            </div>
          </header>
        ) : null}

        <main className="flex-1">
          {props.container === false ? (
            props.children
          ) : (
            <div className="mx-auto w-full max-w-6xl px-4 py-6">{props.children}</div>
          )}
        </main>
      </div>
    </div>
  );
}
