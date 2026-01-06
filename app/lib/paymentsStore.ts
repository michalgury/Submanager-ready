import { Currency } from "./subscriptionsStore";
import { getStorageOwner } from "./storageOwner";

export type PaymentEntry = {
  id: string;
  subscriptionId: string;
  name: string;
  amount: number;
  currency: Currency;
  paidAt: string;
  dueDate?: string;
};

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function ownerKey(...parts: string[]) {
  const o = getStorageOwner().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  return ["submanager", o, ...parts].join(":");
}

const KEY = (profileId: string) => ownerKey("payments:v1", profileId);

export function loadPayments(profileId: string): PaymentEntry[] {
  try {
    const raw = localStorage.getItem(KEY(profileId));
    const parsed = raw ? (JSON.parse(raw) as PaymentEntry[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePayments(profileId: string, entries: PaymentEntry[]) {
  localStorage.setItem(KEY(profileId), JSON.stringify(entries));
}

export function addPayment(profileId: string, data: Omit<PaymentEntry, "id">): PaymentEntry {
  const entry: PaymentEntry = { id: uid(), ...data };
  const prev = loadPayments(profileId);
  const next = [entry, ...prev].slice(0, 500);
  savePayments(profileId, next);
  return entry;
}
