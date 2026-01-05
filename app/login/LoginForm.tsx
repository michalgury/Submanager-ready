"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function Eye({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M10.6 10.6a3 3 0 0 0 4.2 4.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7.1 7.1C4.3 9 2 12 2 12s3.5 7 10 7c2 0 3.7-.6 5.1-1.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M14.1 5.2c5 1.2 7.9 6.8 7.9 6.8s-1.2 2.5-3.5 4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setError(data?.error ?? `Logowanie nieudane (HTTP ${res.status}).`);
        return;
      }

      const next = sp.get("next") || "/dashboard";
      router.push(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 text-zinc-950 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-200">
        <h1 className="text-2xl font-semibold">Logowanie</h1>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-zinc-800">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-800">Hasło</label>
            <div className="mt-1 flex items-center rounded-xl border border-zinc-200 focus-within:border-zinc-400">
              <input
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                type={showPass ? "text" : "password"}
                className="w-full rounded-xl px-3 py-2 outline-none"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="px-3 text-zinc-700 hover:text-zinc-950"
                title={showPass ? "Ukryj hasło" : "Pokaż hasło"}
              >
                <Eye open={showPass} />
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</div>
          ) : null}

          <button
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-black py-3 text-white font-medium hover:bg-zinc-800 disabled:opacity-60"
          >
            {loading ? "Loguję..." : "Zaloguj"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/register")}
            className="w-full text-sm text-zinc-800 underline underline-offset-4"
          >
            Nie masz konta? Zarejestruj się
          </button>
        </div>
      </form>
    </main>
  );
}
