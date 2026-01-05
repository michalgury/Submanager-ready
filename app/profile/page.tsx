"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AppShell from "../components/AppShell";

type Me = { ok: true; username: string } | { ok: false };
type Plan = "none" | "basic" | "pro" | "elite";
type PlanStatus = { ok: true; plan: Plan; active: boolean } | { ok: false };

function planLabel(plan: Plan) {
  if (plan === "basic") return "Basic";
  if (plan === "pro") return "Pro";
  if (plan === "elite") return "Elite";
  return "Brak";
}

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [status, setStatus] = useState<PlanStatus | null>(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/me", { cache: "no-store" }).catch(() => null);
      if (!r) {
        router.push("/?auth=login");
        return;
      }
      const j = (await r.json().catch(() => ({ ok: false }))) as Me;
      if (!j.ok) {
        router.push("/?auth=login");
        return;
      }
      setMe(j);

      const p = await fetch("/api/billing/status", { cache: "no-store" }).catch(() => null);
      const pj = (await p?.json().catch(() => ({ ok: false }))) as PlanStatus;
      setStatus(pj);
    })();
  }, [router]);

  const planText = useMemo(() => {
    if (!status) return "…";
    if (!status.ok || !status.active) return "Brak aktywnego planu";
    return planLabel(status.plan);
  }, [status]);

  async function changePass(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok: boolean; error?: string };
      if (!json.ok) {
        setErr(json.error || "Nie udało się zmienić hasła.");
        return;
      }
      setMsg("Hasło zostało zmienione.");
      setOldPassword("");
      setNewPassword("");
    } finally {
      setLoading(false);
    }
  }

  if (!me) return null;

  return (
    <AppShell title="Profil">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h1 className="text-xl font-black text-zinc-950 dark:text-white">Twoje konto</h1>
          <p className="mt-2 text-sm font-semibold text-zinc-700 dark:text-white/70">
            Zalogowany jako: <span className="font-black">{me.username}</span>
          </p>
          <p className="mt-1 text-sm font-semibold text-zinc-700 dark:text-white/70">
            Plan: <span className="font-black">{planText}</span>
          </p>

          <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-black tracking-wide text-zinc-500 dark:text-white/50">Skróty</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => router.push("/subskrypcja")}
                className="rounded-2xl bg-zinc-950 px-4 py-2 text-xs font-black text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
              >
                Otwórz Subskrypcję
              </button>
              <button
                onClick={() => router.push("/chat")}
                className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-xs font-black text-zinc-950 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              >
                Otwórz Chat
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h2 className="text-xl font-black text-zinc-950 dark:text-white">Zmiana hasła</h2>
          <p className="mt-2 text-sm font-semibold text-zinc-600 dark:text-white/60">
            Hasła nie da się podejrzeć (w bazie jest tylko hash). Możesz je tylko zmienić.
          </p>

          {err ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
              {err}
            </div>
          ) : null}
          {msg ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
              {msg}
            </div>
          ) : null}

          <form onSubmit={changePass} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-black text-zinc-800 dark:text-white/70">Stare hasło</label>
              <div className="mt-1 flex gap-2">
                <input
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  type={showOld ? "text" : "password"}
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white/30"
                />
                <button
                  type="button"
                  onClick={() => setShowOld((v) => !v)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                  aria-label="Pokaż/ukryj"
                >
                  {showOld ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-zinc-800 dark:text-white/70">Nowe hasło</label>
              <div className="mt-1 flex gap-2">
                <input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  type={showNew ? "text" : "password"}
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white/30"
                  placeholder="min. 6 znaków"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                  aria-label="Pokaż/ukryj"
                >
                  {showNew ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full rounded-2xl bg-zinc-950 px-4 py-2.5 text-sm font-black text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
            >
              {loading ? "Zmieniam…" : "Zmień hasło"}
            </button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
