"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Mode = "login" | "register";

export default function AuthPanel() {
  const router = useRouter();
  const sp = useSearchParams();
  const forced = sp.get("auth");
  const [mode, setMode] = useState<Mode>(() => (forced === "register" ? "register" : "login"));

  const next = useMemo(() => sp.get("next") || "/subskrypcja", [sp]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/login" : "/api/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) {
        setError(json.error || (mode === "login" ? "Błąd logowania." : "Błąd rejestracji."));
        return;
      }
      router.push(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={
            "flex-1 rounded-2xl px-3 py-2 text-sm font-black " +
            (mode === "login"
              ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
              : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15")
          }
        >
          Logowanie
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={
            "flex-1 rounded-2xl px-3 py-2 text-sm font-black " +
            (mode === "register"
              ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
              : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15")
          }
        >
          Rejestracja
        </button>
      </div>

      <div className="mt-4">
        <h2 className="text-lg font-black text-zinc-950 dark:text-white">
          {mode === "login" ? "Zaloguj się" : "Załóż konto"}
        </h2>
        <p className="mt-1 text-sm font-semibold text-zinc-600 dark:text-white/60">
          {mode === "login"
            ? "Dostęp do podstron i funkcji zależy od Twojego planu."
            : "Login: 3–32 znaki (litery/cyfry oraz ._-)."}
        </p>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-black text-zinc-800 dark:text-white/70">Login</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white/30"
              placeholder="np. michal_01"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="text-xs font-black text-zinc-800 dark:text-white/70">Hasło</label>
            <div className="mt-1 flex gap-2">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={show ? "text" : "password"}
                className="w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white/30"
                placeholder={mode === "register" ? "min. 6 znaków" : "••••••"}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                aria-label="Pokaż/ukryj hasło"
              >
                {show ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full rounded-2xl bg-zinc-950 px-4 py-2.5 text-sm font-black text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
          >
            {loading ? (mode === "login" ? "Loguję…" : "Tworzę konto…") : mode === "login" ? "Zaloguj" : "Zarejestruj"}
          </button>

          <p className="text-xs font-semibold text-zinc-600 dark:text-white/60">
            {mode === "login" ? (
              <>
                Nie masz konta?{" "}
                <button type="button" className="font-black underline underline-offset-4" onClick={() => setMode("register")}>
                  Zarejestruj się
                </button>
              </>
            ) : (
              <>
                Masz konto?{" "}
                <button type="button" className="font-black underline underline-offset-4" onClick={() => setMode("login")}>
                  Zaloguj się
                </button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
