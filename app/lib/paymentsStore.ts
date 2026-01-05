import type { Currency } from "./subscriptionsStore";

export type PaymentEntry = {
  id: string;
  profileId: string;
  subscriptionId: string;
  name: string;
  amount: number;
  currency: Currency;
  paidAt: string;     // ISO
  dueDate?: string;   // yyyy-mm-dd (opcjonalnie)
};

const LS_PREFIX = "submanager_payments_v1::";

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function safeParse<T>(text: string | null): T | null {
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function loadPayments(profileId: string): PaymentEntry[] {
  if (typeof window === "undefined") return [];
  const raw = safeParse<PaymentEntry[]>(window.localStorage.getItem(LS_PREFIX + profileId));
  return Array.isArray(raw) ? raw : [];
}

export function savePayments(profileId: string, items: PaymentEntry[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_PREFIX + profileId, JSON.stringify(items));
}

export function addPayment(profileId: string, entry: Omit<PaymentEntry, "id" | "profileId">): PaymentEntry {
  return { id: uid(), profileId, ...entry };
}
