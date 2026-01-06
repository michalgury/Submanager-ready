"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Me = { ok: true; username: string } | { ok: false };

export default function TopRightNav() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;

    async function check() {
      try {
        const r = await fetch("/api/me", { cache: "no-store" });
        if (!alive) return;

        // jeśli /api/me zwraca JSON {ok: true/false}, to to obsłużymy:
        try {
          const j = (await r.json()) as Me;
          setAuthed(j.ok === true);
        } catch {
          // a jeśli nie, to polegamy na statusie
          setAuthed(r.ok);
        }
      } catch {
        if (!alive) return;
        setAuthed(false);
      }
    }

    void check();

    return () => {
      alive = false;
    };
  }, []);

  async function logout() {
    try {
      // próbujemy POST
      const r = await fetch("/api/logout", { method: "POST" });
      // jeśli backend ma GET-only, to spróbuj GET
      if (!r.ok) await fetch("/api/logout");
    } catch {
      // ignore
    } finally {
      setAuthed(false);
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/plany"
        className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-100"
      >
        Plany
      </Link>

      {authed === null ? null : authed ? (
        <button
          onClick={logout}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
        >
          Wyloguj
        </button>
      ) : (
        <Link
          href="/login"
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
        >
          Zaloguj
        </Link>
      )}
    </div>
  );
}
