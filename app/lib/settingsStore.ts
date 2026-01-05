import type { Currency } from "./subscriptionsStore";

export type Settings = {
  version: 1;
  budgets: Partial<Record<Currency, number>>; // miesięczny budżet per waluta
  notifyDays: number;                         // banner: płatność ≤ N dni
  horizonDays: number;                        // cashflow + .ics: ile dni w przód
  autoArchiveInactiveDays: number;            // reguła archiwizacji
  expensiveThreshold: Partial<Record<Currency, number>>; // próg "droga" per waluta
};

const LS_PREFIX = "submanager_settings_v1::";

function safeParse<T>(text: string | null): T | null {
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function defaultSettings(): Settings {
  return {
    version: 1,
    budgets: { PLN: 0, EUR: 0, USD: 0 },
    notifyDays: 3,
    horizonDays: 90,
    autoArchiveInactiveDays: 60,
    expensiveThreshold: { PLN: 100, EUR: 25, USD: 25 },
  };
}

export function loadSettings(profileId: string): Settings {
  if (typeof window === "undefined") return defaultSettings();
  const raw = safeParse<Settings>(window.localStorage.getItem(LS_PREFIX + profileId));
  if (raw && raw.version === 1) return { ...defaultSettings(), ...raw };
  const d = defaultSettings();
  window.localStorage.setItem(LS_PREFIX + profileId, JSON.stringify(d));
  return d;
}

export function saveSettings(profileId: string, s: Settings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_PREFIX + profileId, JSON.stringify(s));
}
