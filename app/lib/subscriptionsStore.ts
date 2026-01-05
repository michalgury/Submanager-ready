export type Currency = "PLN" | "EUR" | "USD";
export type BillingCycle = "monthly" | "yearly" | "custom";

export type PricePoint = { price: number; currency: Currency; at: string };

export type Subscription = {
  id: string;
  name: string;

  startDate: string; // yyyy-mm-dd
  endDate?: string;  // legacy

  price: string;
  currency: Currency;

  subscribed: boolean;

  billingCycle?: BillingCycle;
  cycleDays?: number;
  archived?: boolean;

  category?: string;
  notes?: string;

  // NOWE (dla skanowania / historii / oznaczeń)
  usage?: "unknown" | "often" | "rare" | "unused";
  priceHistory?: PricePoint[];
  flags?: {
    expensive?: boolean;
    unused?: boolean;
    priceIncreased?: boolean;
  };

  createdAt?: string;
  updatedAt?: string;
};

const STORAGE_KEY_V2_BASE = "submanager_subscriptions_v2";
const STORAGE_KEY_V1 = "submanager_subscriptions_v1";

type StoredV2 = {
  version: 2;
  updatedAt: string;
  items: Subscription[];
};

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function isCurrency(x: unknown): x is Currency {
  return x === "PLN" || x === "EUR" || x === "USD";
}

function isBillingCycle(x: unknown): x is BillingCycle {
  return x === "monthly" || x === "yearly" || x === "custom";
}

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatPL(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d}.${m}.${y}`;
}

export function parseISODate(iso: string): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map((v) => Number(v));
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return dt;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(a: Date, b: Date): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / 86_400_000);
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function addMonthsSafe(date: Date, months: number): Date {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();

  const total = m + months;
  const ny = y + Math.floor(total / 12);
  const nm = ((total % 12) + 12) % 12;

  const dim = daysInMonth(ny, nm);
  const nd = Math.min(d, dim);
  return new Date(ny, nm, nd);
}

function addYearsSafe(date: Date, years: number): Date {
  return addMonthsSafe(date, years * 12);
}

export function getCycleLabel(s: Subscription): string {
  const cycle = s.billingCycle ?? inferBillingCycleFromLegacy(s);
  if (cycle === "monthly") return "Miesięczna";
  if (cycle === "yearly") return "Roczna";
  return "Niestandardowa";
}

function inferBillingCycleFromLegacy(s: Subscription): BillingCycle {
  if (isBillingCycle(s.billingCycle)) return s.billingCycle;
  if (typeof s.cycleDays === "number" && s.cycleDays > 0) return "custom";
  if (s.startDate && s.endDate) return "custom";
  return "monthly";
}

function inferCycleDays(s: Subscription): number | null {
  if (typeof s.cycleDays === "number" && s.cycleDays > 0) return s.cycleDays;
  const a = parseISODate(s.startDate);
  const b = parseISODate(s.endDate ?? "");
  if (a && b) {
    const diff = daysBetween(a, b);
    return diff > 0 ? diff : null;
  }
  return null;
}

export function computeNextRenewalDate(s: Subscription, now = new Date()): Date | null {
  const start = parseISODate(s.startDate);
  if (!start) return null;

  const cycle = inferBillingCycleFromLegacy(s);
  const nowDay = startOfDay(now);

  if (startOfDay(start).getTime() > nowDay.getTime()) return start;

  if (cycle === "custom") {
    const cd = inferCycleDays(s);
    if (!cd) return null;

    const diffDays = daysBetween(start, nowDay);
    const k = Math.floor(diffDays / cd) + 1;
    return addDays(start, k * cd);
  }

  if (cycle === "yearly") {
    let k = nowDay.getFullYear() - start.getFullYear();
    if (k < 0) k = 0;
    let candidate = addYearsSafe(start, k);
    while (startOfDay(candidate).getTime() <= nowDay.getTime()) {
      candidate = addYearsSafe(candidate, 1);
      if (k++ > 200) break;
    }
    return candidate;
  }

  const monthsDiff =
    (nowDay.getFullYear() - start.getFullYear()) * 12 + (nowDay.getMonth() - start.getMonth());
  let k = Math.max(0, monthsDiff);
  let candidate = addMonthsSafe(start, k);
  while (startOfDay(candidate).getTime() <= nowDay.getTime()) {
    candidate = addMonthsSafe(candidate, 1);
    if (k++ > 2400) break;
  }
  return candidate;
}

export function daysUntil(date: Date, now = new Date()): number {
  const a = startOfDay(now).getTime();
  const b = startOfDay(date).getTime();
  return Math.ceil((b - a) / 86_400_000);
}

export function monthlyEquivalent(s: Subscription): number | null {
  const price = Number(String(s.price).replace(",", "."));
  if (!Number.isFinite(price) || price < 0) return null;

  const cycle = inferBillingCycleFromLegacy(s);
  if (cycle === "monthly") return price;
  if (cycle === "yearly") return price / 12;

  const cd = inferCycleDays(s);
  if (!cd) return null;

  const avgMonthDays = 30.4375;
  return price * (avgMonthDays / cd);
}

function normalizeSubscription(input: unknown): Subscription | null {
  if (!isObject(input)) return null;

  const nowISO = new Date().toISOString();

  const idRaw = input.id;
  const id = typeof idRaw === "string" && idRaw.trim() ? idRaw : null;

  const nameRaw = input.name;
  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";

  const startDateRaw = input.startDate;
  const startDate = typeof startDateRaw === "string" ? startDateRaw : "";

  const endDateRaw = input.endDate;
  const endDate = typeof endDateRaw === "string" ? endDateRaw : undefined;

  const priceRaw = input.price;
  const price = typeof priceRaw === "string" ? priceRaw : String(priceRaw ?? "");

  const currencyRaw = input.currency;
  const currency: Currency = isCurrency(currencyRaw) ? currencyRaw : "PLN";

  const subscribedRaw = input.subscribed;
  const subscribed = typeof subscribedRaw === "boolean" ? subscribedRaw : true;

  const billingCycleRaw = input.billingCycle;
  const billingCycle: BillingCycle | undefined = isBillingCycle(billingCycleRaw) ? billingCycleRaw : undefined;

  const cycleDaysRaw = input.cycleDays;
  const cycleDays = typeof cycleDaysRaw === "number" && cycleDaysRaw > 0 ? Math.floor(cycleDaysRaw) : undefined;

  const archivedRaw = input.archived;
  const archived = typeof archivedRaw === "boolean" ? archivedRaw : false;

  const categoryRaw = input.category;
  const category = typeof categoryRaw === "string" ? categoryRaw.trim() : undefined;

  const notesRaw = input.notes;
  const notes = typeof notesRaw === "string" ? notesRaw : undefined;

  const createdAtRaw = input.createdAt;
  const createdAt = typeof createdAtRaw === "string" ? createdAtRaw : nowISO;

  const updatedAtRaw = input.updatedAt;
  const updatedAt = typeof updatedAtRaw === "string" ? updatedAtRaw : nowISO;

  const usageRaw = input.usage;
  const usage =
    usageRaw === "often" || usageRaw === "rare" || usageRaw === "unused" || usageRaw === "unknown"
      ? usageRaw
      : "unknown";

  // priceHistory (opcjonalnie)
  let priceHistory: PricePoint[] | undefined = undefined;
  const ph = (input as any).priceHistory;
  if (Array.isArray(ph)) {
    priceHistory = ph
      .map((x) => {
        if (!isObject(x)) return null;
        const p = Number((x as any).price);
        const c = (x as any).currency;
        const at = (x as any).at;
        if (!Number.isFinite(p)) return null;
        if (!isCurrency(c)) return null;
        if (typeof at !== "string") return null;
        return { price: p, currency: c, at };
      })
      .filter((x): x is PricePoint => Boolean(x));
  }

  if (!id) return null;

  let finalBilling: BillingCycle | undefined = billingCycle;
  let finalCycleDays: number | undefined = cycleDays;

  if (!finalBilling) {
    if (startDate && endDate) {
      finalBilling = "custom";
      const a = parseISODate(startDate);
      const b = parseISODate(endDate);
      if (a && b) {
        const diff = daysBetween(a, b);
        if (diff > 0) finalCycleDays = diff;
      }
    } else {
      finalBilling = "monthly";
    }
  }

  return {
    id,
    name,
    startDate: startDate || todayISO(),
    endDate,
    price,
    currency,
    subscribed,
    billingCycle: finalBilling,
    cycleDays: finalCycleDays,
    archived,
    category,
    notes,
    usage,
    priceHistory,
    createdAt,
    updatedAt,
  };
}

export function migrateFromAny(raw: unknown): Subscription[] {
  if (isObject(raw) && raw.version === 2 && Array.isArray((raw as any).items)) {
    const out = (raw as any).items
      .map((x: unknown) => normalizeSubscription(x))
      .filter((x: Subscription | null): x is Subscription => Boolean(x));
    return dedupeById(out);
  }

  if (Array.isArray(raw)) {
    const out = raw
      .map((x) => normalizeSubscription(x))
      .filter((x): x is Subscription => Boolean(x));
    return dedupeById(out);
  }

  if (isObject(raw) && Array.isArray((raw as any).items)) {
    const out = (raw as any).items
      .map((x: unknown) => normalizeSubscription(x))
      .filter((x: Subscription | null): x is Subscription => Boolean(x));
    return dedupeById(out);
  }

  return [];
}

function dedupeById(items: Subscription[]): Subscription[] {
  const seen = new Set<string>();
  const out: Subscription[] = [];
  for (const it of items) {
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    out.push(it);
  }
  return out;
}

export function mergeSubscriptions(existing: Subscription[], incoming: Subscription[]): Subscription[] {
  const byId = new Map(existing.map((x) => [x.id, x]));
  for (const it of incoming) byId.set(it.id, it);
  return Array.from(byId.values());
}

// ======== MULTI-PROFILE (NOWE) ========

function keyV2(profileId: string) {
  return `${STORAGE_KEY_V2_BASE}::${profileId || "default"}`;
}

export function loadSubscriptionsFor(profileId: string): Subscription[] {
  if (typeof window === "undefined") return [];

  const k = keyV2(profileId);

  // migracja 1x: jeśli istnieje stary v2 bez profilu, a profil to "default"
  if (profileId === "default") {
    const legacyV2 = window.localStorage.getItem(STORAGE_KEY_V2_BASE);
    const already = window.localStorage.getItem(k);
    if (legacyV2 && !already) {
      const raw = safeJsonParse(legacyV2);
      const items = migrateFromAny(raw);
      saveSubscriptionsFor("default", items);
      return items;
    }
  }

  const v2Text = window.localStorage.getItem(k);
  if (v2Text) {
    const raw = safeJsonParse(v2Text);
    return migrateFromAny(raw);
  }

  // fallback: v1 (tylko dla default)
  if (profileId === "default") {
    const v1Text = window.localStorage.getItem(STORAGE_KEY_V1);
    if (v1Text) {
      const raw = safeJsonParse(v1Text);
      const items = migrateFromAny(raw);
      saveSubscriptionsFor("default", items);
      return items;
    }
  }

  return [];
}

export function saveSubscriptionsFor(profileId: string, items: Subscription[]): void {
  if (typeof window === "undefined") return;
  const nowISO = new Date().toISOString();
  const payload: StoredV2 = { version: 2, updatedAt: nowISO, items };
  window.localStorage.setItem(keyV2(profileId), JSON.stringify(payload));
}

// kompatybilność ze starym kodem
export function loadSubscriptions(): Subscription[] {
  return loadSubscriptionsFor("default");
}

export function saveSubscriptions(items: Subscription[]): void {
  saveSubscriptionsFor("default", items);
}
