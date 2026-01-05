"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

export default function ProfileClient({ email }: { email: string }) {
  const router = useRouter();

  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showNew2, setShowNew2] = useState(false);

  const [msg, setMsg] = useState<string>("");
  const [err, setErr] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function changePass(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (newPass !== newPass2) {
      setErr("Nowe hasła nie są takie same.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass }),
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setErr(data?.error ?? `Nie udało się zmienić hasła (HTTP ${res.status}).`);
        return;
      }

      setMsg("Hasło zmienione.");
      setOldPass("");
      setNewPass("");
      setNewPass2("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950 px-4 py-10">
      <div className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Profil</h1>
            <p className="mt-1 text-sm text-zinc-800">Zalogowany jako: <span className="font-medium">{email}</span></p>
          </div>
          <button
            onClick={logout}
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-950 shadow-sm ring-1 ring-zinc-200 hover:bg-zinc-50"
          >
            Wyloguj
          </button>
        </div>

        <hr className="my-6" />

        <h2 className="text-lg font-semibold">Zmień hasło</h2>

        <form onSubmit={changePass} className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-zinc-800">Stare hasło</label>
            <div className="mt-1 flex items-center rounded-xl border border-zinc-200 focus-within:border-zinc-400">
              <input
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
                type={showOld ? "text" : "password"}
                className="w-full rounded-xl px-3 py-2 outline-none"
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowOld((v) => !v)} className="px-3 text-zinc-700 hover:text-zinc-950">
                <Eye open={showOld} />
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-800">Nowe hasło</label>
            <div className="mt-1 flex items-center rounded-xl border border-zinc-200 focus-within:border-zinc-400">
              <input
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                type={showNew ? "text" : "password"}
                className="w-full rounded-xl px-3 py-2 outline-none"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowNew((v) => !v)} className="px-3 text-zinc-700 hover:text-zinc-950">
                <Eye open={showNew} />
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-800">Powtórz nowe hasło</label>
            <div className="mt-1 flex items-center rounded-xl border border-zinc-200 focus-within:border-zinc-400">
              <input
                value={newPass2}
                onChange={(e) => setNewPass2(e.target.value)}
                type={showNew2 ? "text" : "password"}
                className="w-full rounded-xl px-3 py-2 outline-none"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowNew2((v) => !v)} className="px-3 text-zinc-700 hover:text-zinc-950">
                <Eye open={showNew2} />
              </button>
            </div>
          </div>

          {err ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{err}</div> : null}
          {msg ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{msg}</div> : null}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-black py-3 text-white font-medium hover:bg-zinc-800 disabled:opacity-60"
          >
            {loading ? "Zmieniam..." : "Zmień hasło"}
          </button>
        </form>
      </div>
    </main>
  );
}
