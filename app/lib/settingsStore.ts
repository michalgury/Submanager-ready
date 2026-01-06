import { Currency } from "./subscriptionsStore";
import { getStorageOwner } from "./storageOwner";

export type Settings = {
  budgets?: Partial<Record<Currency, number>>;
  expensiveThreshold?: Partial<Record<Currency, number>>;
  horizonDays?: number;
  notifyDays?: number;
  autoArchiveInactiveDays?: number;
};

function ownerKey(...parts: string[]) {
  const o = getStorageOwner().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  return ["submanager", o, ...parts].join(":");
}

const KEY = (profileId: string) => ownerKey("settings:v1", profileId);

const DEFAULTS: Settings = {
  budgets: { PLN: 0, EUR: 0, USD: 0 },
  expensiveThreshold: { PLN: 0, EUR: 0, USD: 0 },
  horizonDays: 90,
  notifyDays: 3,
  autoArchiveInactiveDays: 0,
};

export function loadSettings(profileId: string): Settings {
  try {
    const raw = localStorage.getItem(KEY(profileId));
    const parsed = raw ? (JSON.parse(raw) as Settings) : null;
    return { ...DEFAULTS, ...(parsed ?? {}) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(profileId: string, s: Settings) {
  localStorage.setItem(KEY(profileId), JSON.stringify(s));
}
