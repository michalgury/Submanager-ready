"use client";

import { useEffect, useMemo, useState } from "react";
import {
  computeNextRenewalDate,
  daysUntil,
  formatPL,
  Subscription,
} from "@/app/lib/subscriptionsStore";
import { getStorageOwner } from "@/app/lib/storageOwner";

type CalendarItem = {
  id: string;
  name: string;
  currency: string;
  price: string;
  profileId: string;
  date: Date;
  daysLeft: number;
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function sanitizeOwner(owner: string) {
  return String(owner || "guest").toLowerCase().replace(/[^a-z0-9_-]/g, "_");
}

function detectProfilesFromLocalStorage(owner: string): string[] {
  if (typeof window === "undefined") return [];
  const rawOwner = owner || "guest";
  const ownerA = rawOwner;
  const ownerB = sanitizeOwner(rawOwner);

  const prefixes = [
    `submanager:${ownerA}:subs:`,
    `submanager:${ownerB}:subs:`,
  ];

  const keys = Object.keys(localStorage);
  const profileIds = new Set<string>();

  for (const k of keys) {
    for (const p of prefixes) {
      if (k.startsWith(p)) {
        profileIds.add(k.slice(p.length));
      }
    }
  }

  return Array.from(profileIds).sort((a, b) => a.localeCompare(b));
}

function loadSubs(owner: string, profileId: string): Subscription[] {
  if (typeof window === "undefined") return [];
  const rawOwner = owner || "guest";
  const ownerA = rawOwner;
  const ownerB = sanitizeOwner(rawOwner);

  const candidates = [
    `submanager:${ownerA}:subs:${profileId}`,
    `submanager:${ownerB}:subs:${profileId}`,
  ];

  for (const key of candidates) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Subscription[];
      if (Array.isArray(parsed?.items)) return parsed.items as Subscription[];
      if (Array.isArray(parsed?.subscriptions))
        return parsed.subscriptions as Subscription[];
    } catch {
      // ignoruj
    }
  }

  return [];
}

export default function SubscriptionsCalendar() {
  const owner = useMemo(() => getStorageOwner(), []);
  const [profiles, setProfiles] = useState<string[]>([]);
  const [profileId, setProfileId] = useState<string>("");
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [month, setMonth] = useState<Date>(() => new Date());

  const now = useMemo(() => new Date(), []);
  const monthStart = useMemo(() => startOfMonth(month), [month]);
  const monthEnd = useMemo(() => endOfMonth(month), [month]);

  // wykryj profile
  useEffect(() => {
    const ps = detectProfilesFromLocalStorage(owner);
    setProfiles(ps);
    setProfileId((prev) => prev || ps[0] || "default");
  }, [owner]);

  // wczytaj subskrypcje
  useEffect(() => {
    if (!profileId) return;
    const items = loadSubs(owner, profileId);
    setSubs(items);
  }, [owner, profileId]);

  // policz zdarzenia (odnowienia/płatności) w aktualnym miesiącu
  const itemsInMonth: CalendarItem[] = useMemo(() => {
    const out: CalendarItem[] = [];
    for (const s of subs) {
      if (!s) continue;
      if (s.archived) continue;
      if (s.subscribed === false) continue;

      const d = computeNextRenewalDate(s, new Date(monthStart));
      if (!d) continue;

      // chcemy tylko w danym miesiącu
      if (d.getTime() < monthStart.getTime() || d.getTime() > monthEnd.getTime())
        continue;

      out.push({
        id: s.id,
        name: s.name,
        currency: String(s.currency ?? "PLN"),
        price: String(s.price ?? ""),
        profileId,
        date: d,
        daysLeft: daysUntil(d, new Date()),
      });
    }

    out.sort((a, b) => a.date.getTime() - b.date.getTime());
    return out;
  }, [subs, profileId, monthStart, monthEnd]);

  // siatka dni (Pon–Niedz)
  const daysGrid = useMemo(() => {
    const start = new Date(monthStart);
    const day = start.getDay(); // 0 niedz, 1 pon...
    const mondayBased = (day + 6) % 7; // 0=pon, 6=niedz
    start.setDate(start.getDate() - mondayBased);

    const end = new Date(monthEnd);
    const endDay = end.getDay();
    const endMondayBased = (endDay + 6) % 7;
    end.setDate(end.getDate() + (6 - endMondayBased));

    const days: Date[] = [];
    const cur = new Date(start);

    // 6 tygodni max
    for (let i = 0; i < 42; i++) {
      days.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
      if (cur.getTime() > end.getTime() && i >= 27) break;
    }

    return days;
  }, [monthStart, monthEnd]);

  function prevMonth() {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }
  function nextMonth() {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  const monthLabel = useMemo(() => {
    return month.toLocaleDateString("pl-PL", { month: "long", year: "numeric" });
  }, [month]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      {/* KALENDARZ */}
      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-black text-zinc-950 dark:text-white">
              {monthLabel}
            </div>
            <div className="text-sm font-semibold text-zinc-600 dark:text-white/60">
              Odnowienia / płatności subskrypcji w tym miesiącu
            </div>
          </div>

          <div className="flex items-center gap-2">
            {profiles.length > 0 ? (
              <select
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold dark:border-white/10 dark:bg-black"
                value={profileId}
                onChange={(e) => setProfileId(e.target.value)}
              >
                {profiles.map((p) => (
                  <option key={p} value={p}>
                    Profil: {p}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm font-semibold text-zinc-600 dark:text-white/60">
                Brak wykrytych profili (localStorage)
              </div>
            )}

            <button
              onClick={prevMonth}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-black hover:bg-zinc-50 dark:border-white/10 dark:bg-black dark:hover:bg-white/5"
            >
              ←
            </button>
            <button
              onClick={nextMonth}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-black hover:bg-zinc-50 dark:border-white/10 dark:bg-black dark:hover:bg-white/5"
            >
              →
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2 text-xs font-bold text-zinc-600 dark:text-white/60">
          {["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"].map((x) => (
            <div key={x} className="px-2 py-1">
              {x}
            </div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {daysGrid.map((d) => {
            const inMonth = d.getMonth() === month.getMonth();
            const todays = sameDay(d, new Date());

            const dayItems = itemsInMonth.filter((it) => sameDay(it.date, d));

            return (
              <div
                key={d.toISOString()}
                className={[
                  "min-h-[92px] rounded-2xl border p-2",
                  inMonth
                    ? "border-zinc-200 bg-white dark:border-white/10 dark:bg-black"
                    : "border-zinc-100 bg-zinc-50 text-zinc-400 dark:border-white/5 dark:bg-white/5 dark:text-white/30",
                  todays ? "ring-2 ring-zinc-900 dark:ring-white/70" : "",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black">{d.getDate()}</div>
                  {todays ? (
                    <div className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-black text-white dark:bg-white dark:text-black">
                      Dziś
                    </div>
                  ) : null}
                </div>

                <div className="mt-2 space-y-1">
                  {dayItems.slice(0, 3).map((it) => (
                    <div
                      key={it.id}
                      className="truncate rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-semibold text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                      title={`${it.name} • ${it.price} ${it.currency}`}
                    >
                      {it.name}
                    </div>
                  ))}
                  {dayItems.length > 3 ? (
                    <div className="text-[11px] font-bold text-zinc-600 dark:text-white/60">
                      +{dayItems.length - 3} więcej
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* LISTA NAJBLIŻSZYCH */}
      <aside className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black">
        <div className="text-sm font-black text-zinc-950 dark:text-white">
          Najbliższe w tym miesiącu
        </div>
        <div className="mt-3 space-y-2">
          {itemsInMonth.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm font-semibold text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
              Brak odnowień/płatności w tym miesiącu.
            </div>
          ) : (
            itemsInMonth.map((it) => (
              <div
                key={it.id}
                className="rounded-2xl border border-zinc-200 p-3 dark:border-white/10"
              >
                <div className="text-sm font-black text-zinc-950 dark:text-white">
                  {it.name}
                </div>
                <div className="mt-1 text-xs font-semibold text-zinc-600 dark:text-white/60">
                  Data: {formatPL(it.date.toISOString().slice(0, 10))} • Cena:{" "}
                  {it.price} {it.currency}
                </div>
                <div className="mt-1 text-xs font-bold text-zinc-700 dark:text-white/70">
                  {it.daysLeft >= 0
                    ? `Za ${it.daysLeft} dni`
                    : `Minęło ${Math.abs(it.daysLeft)} dni temu`}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
