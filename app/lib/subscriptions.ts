import { randomUUID } from "crypto";

export type Subscription = {
  id: string;
  userEmail: string;
  name: string;
  startDate: string;
  endDate: string;
  price: number;
  currency: "PLN" | "EUR" | "USD";
  subscribed: boolean;
  createdAt: string;
  updatedAt: string;
};

const g = globalThis as unknown as { __submanager_subs?: Subscription[] };
if (!g.__submanager_subs) g.__submanager_subs = [];
const subs = g.__submanager_subs;

function normEmail(email: string) {
  return email.trim().toLowerCase();
}

export function listSubscriptions(userEmail: string) {
  const e = normEmail(userEmail);
  return subs.filter((s) => s.userEmail === e);
}

export function addSubscription(input: Omit<Subscription, "id" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  const sub: Subscription = {
    ...input,
    id: randomUUID(),
    userEmail: normEmail(input.userEmail),
    createdAt: now,
    updatedAt: now,
  };
  subs.push(sub);
  return sub;
}

export function updateSubscription(
  userEmail: string,
  id: string,
  patch: Partial<Omit<Subscription, "id" | "userEmail" | "createdAt" | "updatedAt">>
) {
  const e = normEmail(userEmail);
  const idx = subs.findIndex((s) => s.userEmail === e && s.id === id);
  if (idx === -1) return null;

  subs[idx] = { ...subs[idx], ...patch, updatedAt: new Date().toISOString() };
  return subs[idx];
}

export function deleteSubscription(userEmail: string, id: string) {
  const e = normEmail(userEmail);
  const idx = subs.findIndex((s) => s.userEmail === e && s.id === id);
  if (idx === -1) return false;
  subs.splice(idx, 1);
  return true;
}
