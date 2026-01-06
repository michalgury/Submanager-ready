"use client";

import { useMemo, useState } from "react";

type AnySub = Record<string, any>;

function num(v: any, fallback = 0) {
  const n =
    typeof v === "number" ? v : Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

// --- DOPASOWANIE DO TWOJEJ STRUKTURY DANYCH (zrobione tak, zeby dzialalo “z marszu”) ---
function getId(s: AnySub): string {
  return String(s.id ?? s._id ?? s.uuid ?? s.key ?? s.slug ?? s.name ?? "");
}

function getName(s: AnySub): string {
  return String(s.name ?? s.title ?? s.service ?? s.label ?? "Subskrypcja");
}

function getCurrency(s: AnySub): string {
  return String(
    s.currency ?? s.ccy ?? s.money?.currency ?? "PLN"
  ).toUpperCase();
}

function getPrice(s: AnySub): number {
  // typowe nazwy pól spotykane w takich apkach
  return num(
    s.price ??
      s.amount ??
      s.cost ??
      s.value ??
      s.money?.amount ??
      s.money?.value ??
      0
  );
}

/**
 * Próbuje policzyć koszt miesięczny (przybliżenie), żeby "koszt/h" miał sens.
 * Jeśli nie rozpozna cyklu – zakłada, że cena jest miesięczna.
 */
function toMonthlyCost(sub: AnySub): number {
  const price = getPrice(sub);

  const unitRaw = String(
    sub.cycleUnit ??
      sub.intervalUnit ??
      sub.billingUnit ??
      sub.unit ??
      sub.periodUnit ??
      sub.cycle?.unit ??
      sub.billing?.unit ??
      sub.interval ??
      sub.period ??
      ""
  )
    .toLowerCase()
    .trim();

  const every = Math.max(
    1,
    Math.round(
      num(
        sub.cycleEvery ??
          sub.every ??
          sub.intervalEvery ??
          sub.billingEvery ??
          sub.cycle?.every ??
          sub.billing?.every ??
          1,
        1
      )
    )
  );

  // proste rozpoznawanie PL/EN
  const isYear =
    unitRaw.includes("year") ||
    unitRaw.includes("rok") ||
    unitRaw.includes("rocz");
  const isMonth = unitRaw.includes("month") || unitRaw.includes("mies");
  const isWeek = unitRaw.includes("week") || unitRaw.includes("tyg");
  const isDay =
    unitRaw.includes("day") ||
    unitRaw.includes("dzien") ||
    unitRaw.includes("dni");

  if (isYear) return price / (12 * every);
  if (isMonth) return price / every;
  if (isWeek) return (price * 4.345) / every; // średnio tygodni w miesiącu
  if (isDay) return (price * 30.437) / every; // średnio dni w miesiącu

  // fallback: cena traktowana jako miesięczna
  return price;
}

function formatMoney(amount: number, currency: string) {
  // bezpieczny format (nie wywali apki, nawet jak currency nietypowe)
  try {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function score(costPerHour: number, currency: string) {
  if (!Number.isFinite(costPerHour) || costPerHour <= 0) {
    return {
      label: "Brak danych",
      hint: "Uzupełnij godziny, aby policzyć koszt/h.",
    };
  }

  // Progi “użyteczności” (praktyczne, a nie kino/Netflix marketing)
  const c = currency.toUpperCase();

  const t =
    c === "PLN"
      ? { a: 1, b: 3, c: 6 } // <=1 super, <=3 ok, <=6 średnio, >6 słabo
      : c === "EUR" || c === "USD"
      ? { a: 0.25, b: 0.75, c: 1.5 }
      : { a: 0.25, b: 0.75, c: 1.5 };

  if (costPerHour <= t.a)
    return {
      label: "Bardzo opłacalne",
      hint: "Dobry stosunek kosztu do użycia.",
    };
  if (costPerHour <= t.b)
    return {
      label: "Opłacalne",
      hint: "W porządku, szczególnie jeśli korzystasz regularnie.",
    };
  if (costPerHour <= t.c)
    return {
      label: "Średnio opłacalne",
      hint: "Albo zwiększ godziny, albo podziel koszt na więcej osób.",
    };
  return {
    label: "Słabo opłacalne",
    hint: "Rozważ rezygnację / tańszy plan / większe współdzielenie.",
  };
}

export default function WatchingCostCalculator({
  subscriptions,
}: {
  subscriptions: AnySub[];
}) {
  const options = useMemo(() => {
    return (subscriptions ?? [])
      .map((s) => ({
        id: getId(s),
        name: getName(s),
        currency: getCurrency(s),
        monthly: toMonthlyCost(s),
        raw: s,
      }))
      .filter((x) => x.id && x.name);
  }, [subscriptions]);

  const [selectedId, setSelectedId] = useState<string>(
    () => options[0]?.id ?? ""
  );
  const [payers, setPayers] = useState<number>(1);
  const [yourHours, setYourHours] = useState<number>(10);
  const [totalHoursAll, setTotalHoursAll] = useState<number>(10);

  const selected = useMemo(
    () => options.find((o) => o.id === selectedId) ?? options[0],
    [options, selectedId]
  );
  const currency = selected?.currency ?? "PLN";
  const monthlyCost = selected?.monthly ?? 0;

  const safePayers = Math.max(1, Math.floor(num(payers, 1)));
  const safeYourHours = Math.max(0, num(yourHours, 0));
  const safeTotalHours = Math.max(0, num(totalHoursAll, 0));

  const yourShare = monthlyCost / safePayers;

  const yourCostPerHour = safeYourHours > 0 ? yourShare / safeYourHours : NaN;
  const totalCostPerHour =
    safeTotalHours > 0 ? monthlyCost / safeTotalHours : NaN;

  const verdict = score(yourCostPerHour, currency);

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">
            Kalkulator: koszt za godzinę oglądania
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Wybierz subskrypcję, podaj ile osób płaci i ile godzin oglądasz w
            miesiącu.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/10">
          <div className="font-semibold text-zinc-900 dark:text-white">
            {verdict.label}
          </div>
          <div className="mt-1 text-zinc-600 dark:text-zinc-300">
            {verdict.hint}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        <label className="block">
          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Subskrypcja
          </div>
          <select
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {options.length === 0 ? (
              <option value="">Brak subskrypcji</option>
            ) : (
              options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))
            )}
          </select>
        </label>

        <label className="block">
          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Ile osób płaci
          </div>
          <input
            type="number"
            min={1}
            step={1}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
            value={payers}
            onChange={(e) => setPayers(num(e.target.value, 1))}
          />
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Koszt zostanie podzielony równo.
          </div>
        </label>

        <label className="block">
          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Twoje godziny / miesiąc
          </div>
          <input
            type="number"
            min={0}
            step={0.5}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
            value={yourHours}
            onChange={(e) => setYourHours(num(e.target.value, 0))}
          />
        </label>

        <label className="block">
          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Łączne godziny wszystkich / miesiąc (opcjonalnie)
          </div>
          <input
            type="number"
            min={0}
            step={0.5}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
            value={totalHoursAll}
            onChange={(e) => setTotalHoursAll(num(e.target.value, 0))}
          />
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Jeśli nie wiesz – wpisz tyle co Twoje godziny.
          </div>
        </label>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
          <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            Koszt / miesiąc (przybliż.)
          </div>
          <div className="mt-1 text-lg font-black text-zinc-950 dark:text-white">
            {formatMoney(monthlyCost, currency)}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
          <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            Twoja część (podział)
          </div>
          <div className="mt-1 text-lg font-black text-zinc-950 dark:text-white">
            {formatMoney(yourShare, currency)}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
          <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            Koszt / godzinę (Twoja część)
          </div>
          <div className="mt-1 text-lg font-black text-zinc-950 dark:text-white">
            {Number.isFinite(yourCostPerHour)
              ? formatMoney(yourCostPerHour, currency)
              : "—"}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
          <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            Koszt / godzinę (całość)
          </div>
          <div className="mt-1 text-lg font-black text-zinc-950 dark:text-white">
            {Number.isFinite(totalCostPerHour)
              ? formatMoney(totalCostPerHour, currency)
              : "—"}
          </div>
        </div>
      </div>
    </section>
  );
}
