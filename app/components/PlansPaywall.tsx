"use client";

import { useMemo, useState } from "react";

export type Plan = "basic" | "pro" | "elite";

type PlanCard = {
  key: Plan;
  name: string;
  price: string;
  highlights: string[];
  note: string;
  popular?: boolean;
};

const PLANS: PlanCard[] = [
  {
    key: "basic",
    name: "Basic",
    price: "5 zł / miesiąc",
    highlights: [
      "Do 20 subskrypcji",
      "1 profil",
      "Powiadomienia: 7 dni",
      "Eksport CSV",
    ],
    note: "Dla startu i kontroli podstawowych wydatków.",
  },
  {
    key: "pro",
    name: "Pro",
    price: "10 zł / miesiąc",
    popular: true,
    highlights: [
      "Nielimitowane subskrypcje",
      "Do 5 profili",
      "Budżet + wykresy",
      "Export .ics + historia płatności",
    ],
    note: "Dla osób, które chcą ogarniać wszystko w jednym panelu.",
  },
  {
    key: "elite",
    name: "Elite",
    price: "15 zł / miesiąc",
    highlights: [
      "Wszystko z Pro",
      "Powiadomienia na Discord",
      "Reguły i automatyzacje",
      "Priorytetowe wsparcie",
    ],
    note: "Dla power-userów i małych zespołów.",
  },
];

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as T;
  if (!res.ok) {
    const anyJson = json as any;
    throw new Error(anyJson?.error || `HTTP ${res.status}`);
  }
  return json;
}

export default function PlansPaywall(props: { onActivated?: () => void }) {
  const [busy, setBusy] = useState<Plan | null>(null);
  const [error, setError] = useState<string>("");
  const [info, setInfo] = useState<string>("");

  const title = useMemo(() => "Ta funkcja jest płatna", []);

  async function checkout(plan: Plan) {
    setError("");
    setInfo("");
    setBusy(plan);
    try {
      // 1) Próba Stripe Checkout.
      try {
        const r = await postJson<{ ok: true; url: string | null }>("/api/billing/checkout", { plan });
        if (r.url) {
          window.location.href = r.url;
          return;
        }
      } catch (e: any) {
        // brak Stripe albo błąd — przechodzimy w tryb DEMO
        setInfo(String(e?.message || "Stripe nie jest skonfigurowany. Uruchamiam tryb demo."));
      }

      // 2) DEMO: aktywacja bez bramki płatności.
      await postJson("/api/billing/activate", { plan });
      props.onActivated?.();
      setInfo("Plan aktywowany (tryb demo). Jeżeli chcesz realne płatności — skonfiguruj Stripe w .env.local.");
    } catch (e: any) {
      setError(String(e?.message || "Nie udało się aktywować planu."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-black text-zinc-950 dark:text-white">{title}</h2>
        <p className="text-sm font-semibold text-zinc-600 dark:text-white/60">
          Podstrona <span className="font-black">Subskrypcja</span> to pełny panel do zarządzania subskrypcjami.
          Żeby korzystać z funkcji, wybierz jeden z planów.
        </p>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {info ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          {info}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <div
            key={p.key}
            className={
              "rounded-3xl border p-5 " +
              (p.popular
                ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                : "border-zinc-200 bg-white text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-white")
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-black opacity-90">{p.name}</div>
                <div className="mt-1 text-2xl font-black tracking-tight">{p.price}</div>
              </div>
              {p.popular ? (
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black text-white dark:bg-zinc-950/10 dark:text-zinc-950">
                  Najczęściej wybierany
                </span>
              ) : null}
            </div>

            <ul className={"mt-4 space-y-2 text-sm font-semibold " + (p.popular ? "text-white/80 dark:text-zinc-700" : "text-zinc-700 dark:text-white/70")}
            >
              {p.highlights.map((h) => (
                <li key={h} className="flex items-center gap-2">
                  <span className={"h-1.5 w-1.5 rounded-full " + (p.popular ? "bg-white" : "bg-zinc-950 dark:bg-white")} />
                  <span>{h}</span>
                </li>
              ))}
            </ul>

            <p className={"mt-4 text-xs font-semibold " + (p.popular ? "text-white/70 dark:text-zinc-700" : "text-zinc-600 dark:text-white/60")}
            >
              {p.note}
            </p>

            <button
              disabled={!!busy}
              onClick={() => void checkout(p.key)}
              className={
                "mt-5 w-full rounded-2xl px-4 py-2.5 text-sm font-black disabled:opacity-60 " +
                (p.popular
                  ? "bg-white text-zinc-950 hover:bg-zinc-100 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
                  : "bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100")
              }
            >
              {busy === p.key ? "Przetwarzam…" : "Wybieram"}
            </button>

            <div className={"mt-3 text-center text-xs font-semibold " + (p.popular ? "text-white/60 dark:text-zinc-700" : "text-zinc-500 dark:text-white/50")}
            >
              Bramka płatności: Stripe (opcjonalnie) / demo
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-xs font-semibold text-zinc-500 dark:text-white/50">
        Produkcja: skonfiguruj Stripe w <span className="font-black">.env.local</span> (STRIPE_SECRET_KEY, STRIPE_PRICE_BASIC/PRO/ELITE)
        i dodaj webhook do automatycznej aktywacji planu.
      </div>
    </div>
  );
}
