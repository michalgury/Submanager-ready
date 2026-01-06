"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import AppShell from "../components/AppShell";

type Msg = { id: string; role: "user" | "assistant" | "system"; text: string; at: number };

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function bubbleClass(role: Msg["role"]) {
  if (role === "user") return "ml-auto bg-zinc-950 text-white dark:bg-white dark:text-zinc-950";
  if (role === "assistant") return "mr-auto bg-white text-zinc-950 ring-1 ring-zinc-200 dark:bg-white/5 dark:text-white dark:ring-white/10";
  return "mx-auto bg-zinc-100 text-zinc-800 dark:bg-white/10 dark:text-white/80";
}

export default function ChatPage() {
  const [msgs, setMsgs] = useState<Msg[]>(() => [
    {
      id: uid(),
      role: "assistant",
      text:
        "To jest prosty chat do wysyłania wiadomości na Discorda. W produkcji możesz go rozbudować o historię, role, komendy i logikę bota.",
      at: Date.now(),
    },
  ]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  const hint = useMemo(
    () =>
      "Konfiguracja Discorda: ustaw DISCORD_WEBHOOK_URL albo DISCORD_BOT_TOKEN + DISCORD_CHANNEL_ID w .env.local.",
    []
  );

  async function send() {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    setErr("");
    setBusy(true);

    const userMsg: Msg = { id: uid(), role: "user", text: trimmed, at: Date.now() };
    setMsgs((p) => [...p, userMsg]);
    setText("");

    try {
      const res = await fetch("/api/discord/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      const json = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) {
        throw new Error(json?.error || "Nie udało się wysłać na Discord.");
      }

      setMsgs((p) => [
        ...p,
        {
          id: uid(),
          role: "assistant",
          text: "Wysłane na Discord.",
          at: Date.now(),
        },
      ]);
    } catch (e: any) {
      const msg = String(e?.message || "Błąd wysyłki.");
      setErr(msg);
      setMsgs((p) => [
        ...p,
        {
          id: uid(),
          role: "assistant",
          text: `Błąd: ${msg}`,
          at: Date.now(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Chat">
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-zinc-950 dark:text-white">Chat</h1>
            <p className="mt-1 text-sm font-semibold text-zinc-600 dark:text-white/60">{hint}</p>
          </div>
        </div>

        {err ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
            {err}
          </div>
        ) : null}

        <div
          ref={boxRef}
          className="mt-4 h-[520px] overflow-y-auto rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5"
        >
          <div className="space-y-3">
            {msgs.map((m) => (
              <div key={m.id} className={"max-w-[85%] rounded-3xl px-4 py-3 text-sm font-semibold " + bubbleClass(m.role)}>
                {m.text}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Napisz wiadomość…"
            className="w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white/30"
            disabled={busy}
          />
          <button
            onClick={() => void send()}
            disabled={busy}
            className="rounded-2xl bg-zinc-950 px-4 py-2 text-sm font-black text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
          >
            {busy ? "…" : "Wyślij"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
