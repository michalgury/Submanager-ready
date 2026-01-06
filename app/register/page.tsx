"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const loginTrim = login.trim();
  const emailTrim = email.trim();

  // walidacja po stronie UI (zgodna z komunikatem backendu)
  const loginOk = /^[a-zA-Z0-9_-]{3,32}$/.test(loginTrim);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);

    if (!loginOk) {
      setError("Login musi mieć 3–32 znaki: litery/cyfry/_/-");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        // kluczowa zmiana: wysyłamy login też jako "username",
        // bo część backendów tak właśnie tego wymaga
        body: JSON.stringify({
          login: loginTrim,
          username: loginTrim,
          email: emailTrim,
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Nie udało się założyć konta.");
        return;
      }

      setOk("Konto utworzone. Możesz się zalogować.");
      setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, 700);
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
            <h1 className="text-xl font-semibold text-zinc-900">Rejestracja</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Załóż konto, aby korzystać z aplikacji.
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
              onChange={(e) => {
                setLogin(e.target.value);
                if (error) setError(null);
                if (ok) setOk(null);
              }}
              placeholder="np. michal_123"
              autoComplete="username"
              required
            />
            <div className="mt-1 text-xs text-zinc-500">
              3–32 znaki, tylko litery/cyfry/_/-
            </div>
            {!loginOk && loginTrim.length > 0 && (
              <div className="mt-1 text-xs text-red-600">
                Login nie spełnia wymagań.
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700">Email</label>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-300"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
                if (ok) setOk(null);
              }}
              placeholder="np. jan@domena.pl"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700">Hasło</label>
            <div className="mt-1 flex gap-2">
              <input
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-300"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                  if (ok) setOk(null);
                }}
                placeholder="Ustal hasło"
                autoComplete="new-password"
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
              <Link href="/login" className="font-semibold text-zinc-900 underline">
                Masz już konto? Zaloguj się
              </Link>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {ok && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {ok}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {loading ? "Tworzenie..." : "Załóż konto"}
          </button>
        </form>
      </div>
    </main>
  );
}
