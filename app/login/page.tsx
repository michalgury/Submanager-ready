"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        // Kluczowe: wysyłamy login (nick), nie email
        body: JSON.stringify({
          login: login.trim(),
          username: login.trim(), // na wypadek gdy backend używa username
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Nieprawidłowy login lub hasło.");
        return;
      }

      router.push("/subskrypcja");
      router.refresh();
    } catch {
      setError("Błąd sieci. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Zaloguj się</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Wpisz login (nick) i hasło.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
          >
            Wróć
          </Link>
        </div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm font-medium text-zinc-700">Login (nick)</label>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-300"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="np. michal34"
              autoComplete="username"
              required
            />
            <div className="mt-1 text-xs text-zinc-500">
              To ten login, który podałeś przy rejestracji.
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700">Hasło</label>

            <div className="mt-1 flex gap-2">
              <input
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-300"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Twoje hasło"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-zinc-100"
              >
                {show ? "Ukryj" : "Pokaż"}
              </button>
            </div>

            <div className="mt-2 text-sm">
              <Link href="/register" className="font-semibold text-zinc-900 underline">
                Nie masz konta? Zarejestruj się
              </Link>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {loading ? "Logowanie..." : "Zaloguj"}
          </button>
        </form>
      </div>
    </main>
  );
}
