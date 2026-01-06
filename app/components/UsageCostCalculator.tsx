"use client";

import { useMemo, useState } from "react";

export type CalcSub = {
  id: string;
  name: string;
  currency: string;
  amount: number; // kwota za cykl
  cycle: "MONTH" | "YEAR" | "WEEK" | "DAY";
  people: number; // na ile osób dzielisz
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function perMonth(amount: number, cycle: CalcSub["cycle"]) {
  if (!Number.isFinite(amount)) return 0;
  if (cycle === "MONTH") return amount;
  if (cycle === "YEAR") return amount / 12;
  if (cycle === "WEEK") return (amount * 52) / 12;
  if (cycle === "DAY") return (amount * 365) / 12;
  return amount;
}

export default function UsageCostCalculator(props: {
  subscriptions: CalcSub[];
}) {
  const list = props.subscriptions ?? [];

  // domyślnie: wszystko zaznaczone
  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const s of list) init[s.id] = true;
    return init;
  });

  const [hours, setHours] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const s of list) init[s.id] = 10; // domyślnie 10h / miesiąc
    return init;
  });

  const selectedList = useMemo(() => {
    return list.filter((s) => selected[s.id] !== false);
  }, [list, selected]);

  const summary = useMemo(() => {
    let totalMonthly = 0;
    for (const s of selectedList) {
      const m = perMonth(Number(s.amount) || 0, s.cycle);
      const ppl = Math.max(1, Number(s.people) || 1);
      totalMonthly += m / ppl;
    }

    let totalHours = 0;
    for (const s of selectedList) {
      totalHours += Math.max(0, Number(hours[s.id]) || 0);
    }

    const perHour = totalHours > 0 ? totalMonthly / totalHours : 0;

    return {
      totalMonthly: round2(totalMonthly),
      totalHours: round2(totalHours),
      perHour: round2(perHour),
    };
  }, [selectedList, hours]);

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-black text-zinc-950 dark:text-white">
            Kalkulator kosztu użycia
          </div>
          <div className="mt-1 text-xs font-semibold text-zinc-600 dark:text-white/60">
            Wybierz subskrypcje i podaj ile godzin realnie używasz miesięcznie.
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const next: Record<string, boolean> = {};
            for (const s of list) next[s.id] = true;
            setSelected(next);
          }}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-black text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-black dark:text-white dark:hover:bg-white/5"
        >
          Zaznacz wszystko
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5">
          <div className="text-[11px] font-black tracking-wide text-zinc-600 dark:text-white/60">
            Suma / miesiąc (po podziale)
          </div>
          <div className="mt-1 text-xl font-black text-zinc-950 dark:text-white">
            {summary.totalMonthly}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5">
          <div className="text-[11px] font-black tracking-wide text-zinc-600 dark:text-white/60">
            Godziny użycia (mies.)
          </div>
          <div className="mt-1 text-xl font-black text-zinc-950 dark:text-white">
            {summary.totalHours}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5">
          <div className="text-[11px] font-black tracking-wide text-zinc-600 dark:text-white/60">
            Koszt / godz.
          </div>
          <div className="mt-1 text-xl font-black text-zinc-950 dark:text-white">
            {summary.perHour}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {list.map((s) => (
          <div
            key={s.id}
            className="rounded-2xl border border-zinc-200 p-3 dark:border-white/10"
          >
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selected[s.id] !== false}
                  onChange={(e) =>
                    setSelected((p) => ({ ...p, [s.id]: e.target.checked }))
                  }
                />
                <div className="text-sm font-black text-zinc-950 dark:text-white">
                  {s.name}
                </div>
              </label>

              <div className="text-xs font-semibold text-zinc-600 dark:text-white/60">
                {s.amount} {s.currency} / {s.cycle} •{" "}
                {Math.max(1, s.people || 1)} os.
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <div className="text-xs font-black text-zinc-700 dark:text-white/70">
                  Godziny użycia / miesiąc
                </div>
                <input
                  type="number"
                  min={0}
                  value={hours[s.id] ?? 10}
                  onChange={(e) =>
                    setHours((p) => ({ ...p, [s.id]: Number(e.target.value) }))
                  }
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-300 dark:border-white/10 dark:bg-black dark:text-white"
                />
              </label>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs font-semibold text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                Miesięcznie (po podziale):{" "}
                <span className="font-black text-zinc-950 dark:text-white">
                  {round2(
                    perMonth(Number(s.amount) || 0, s.cycle) /
                      Math.max(1, Number(s.people) || 1)
                  )}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
