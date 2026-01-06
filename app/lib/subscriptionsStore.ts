import { getStorageOwner } from "./storageOwner";

export type Currency = "PLN" | "EUR" | "USD";
export type BillingCycle = "monthly" | "yearly" | "custom";
export type UsageFlag = "unknown" | "often" | "rare" | "unused";

export type Subscription = {
  id: string;
  name: string;
  price: string;
  currency: Currency;
  billingCycle: BillingCycle;
  cycleDays?: number;
  startDate: string;
  endDate?: string;
  subscribed: boolean;
  archived?: boolean;
  category?: string;
  notes?: string;
  usage?: UsageFlag;
  createdAt?: string;
  updatedAt?: string;
  priceHistory?: Array<{ price: number; currency: Currency; at: string }>;
};

function safeOwner(): string {
  // klucz localStorage musi być stabilny i bez dziwnych znaków
  return getStorageOwner().toLowerCase().replace(/[^a-z0-9_-]/g, "_") || "guest";
}

function keyForSubs(profileId: string) {
  const owner = safeOwner();
  const pid = String(profileId || "default");
  return `submanager:${owner}:subs:${pid}`;
}

export function loadSubscriptionsFor(profileId: string): Subscription[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(keyForSubs(profileId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return migrateFromAny(parsed);
  } catch {
    return [];
  }
}

export function saveSubscriptionsFor(profileId: string, items: Subscription[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(keyForSubs(profileId), JSON.stringify(items ?? []));
}

/** import: obsłuż różne formaty */
export function migrateFromAny(raw: unknown): Subscription[] {
  const any = raw as any;

  const arr =
    Array.isArray(any) ? any :
    Array.isArray(any?.items) ? any.items :
    Array.isArray(any?.subscriptions) ? any.subscriptions :
    Array.isArray(any?.data) ? any.data :
    [];

  const out: Subscription[] = [];

  for (const x of arr) {
    if (!x) continue;

    const s: Subscription = {
      id: String(x.id ?? ""),
      name: String(x.name ?? ""),
      price: String(x.price ?? ""),
      currency: (x.currency ?? "PLN") as Currency,
      billingCycle: (x.billingCycle ?? "monthly") as BillingCycle,
      cycleDays: x.cycleDays != null ? Number(x.cycleDays) : undefined,
      startDate: String(x.startDate ?? ""),
      endDate: x.endDate ? String(x.endDate) : undefined,
      subscribed: Boolean(x.subscribed ?? true),
      archived: Boolean(x.archived ?? false),
      category: x.category ? String(x.category) : "",
      notes: x.notes ? String(x.notes) : "",
      usage: (x.usage ?? "unknown") as UsageFlag,
      createdAt: x.createdAt ? String(x.createdAt) : undefined,
      updatedAt: x.updatedAt ? String(x.updatedAt) : undefined,
      priceHistory: Array.isArray(x.priceHistory) ? x.priceHistory : undefined,
    };

    if (!s.id || !s.name) continue;
    out.push(s);
  }

  return out;
}

export function mergeSubscriptions(existing: Subscription[], incoming: Subscription[]): Subscription[] {
  const map = new Map(existing.map((x) => [x.id, x]));
  for (const inc of incoming) {
    map.set(inc.id, { ...(map.get(inc.id) ?? {}), ...inc });
  }
  return Array.from(map.values());
}

export function parsePriceToNumber(s: string): number | null {
  const n = Number(String(s ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function monthlyEquivalent(s: Subscription): number | null {
  const p = parsePriceToNumber(s.price);
  if (p === null) return null;

  if (s.billingCycle === "monthly") return p;
  if (s.billingCycle === "yearly") return p / 12;

  const cd = Number(s.cycleDays);
  if (!Number.isFinite(cd) || cd <= 0) return null;

  // ~30 dni jako miesiąc
  return (p * 30) / cd;
}

export function getCycleLabel(s: Subscription): string {
  if (s.billingCycle === "monthly") return "Miesięczny";
  if (s.billingCycle === "yearly") return "Roczny";
  return "Niestandardowy";
}

export function formatPL(isoDate: string): string {
  try {
    const [y, m, d] = isoDate.split("-").map(Number);
    const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
    return dt.toLocaleDateString("pl-PL");
  } catch {
    return isoDate;
  }
}

export function computeNextRenewalDate(s: Subscription, now: Date): Date | null {
  if (!s.startDate) return null;

  const start = new Date(s.startDate + "T00:00:00");
  if (Number.isNaN(start.getTime())) return null;

  const end = s.endDate ? new Date(s.endDate + "T00:00:00") : null;
  if (end && now.getTime() > end.getTime()) return null;

  let cur = new Date(start);

  const guardMax = 2000;
  let guard = 0;

  while (cur.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) {
    if (guard++ > guardMax) return null;

    if (s.billingCycle === "monthly") cur.setMonth(cur.getMonth() + 1);
    else if (s.billingCycle === "yearly") cur.setFullYear(cur.getFullYear() + 1);
    else {
      const cd = Number(s.cycleDays);
      if (!Number.isFinite(cd) || cd <= 0) return null;
      cur.setDate(cur.getDate() + cd);
    }

    if (end && cur.getTime() > end.getTime()) return null;
  }

  return cur;
}

export function daysUntil(future: Date, now: Date): number {
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const b = new Date(future.getFullYear(), future.getMonth(), future.getDate()).getTime();
  return Math.round((b - a) / 86_400_000);
}
