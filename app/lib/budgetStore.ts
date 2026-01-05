import { Currency } from "./subscriptionsStore";

export type BudgetByCurrency = Record<Currency, number | null>;

type StoredBudgets = {
  version: 1;
  updatedAt: string;
  budgets: BudgetByCurrency;
};

const DEFAULT: BudgetByCurrency = { PLN: null, EUR: null, USD: null };

function key(scope: string) {
  return `submanager_${scope}_budgets_v1`;
}

export function loadBudgets(scope = "global"): BudgetByCurrency {
  if (typeof window === "undefined") return { ...DEFAULT };
  const raw = window.localStorage.getItem(key(scope));
  if (!raw) return { ...DEFAULT };
  try {
    const parsed = JSON.parse(raw) as StoredBudgets;
    if (!parsed || parsed.version !== 1 || !parsed.budgets) return { ...DEFAULT };
    return {
      PLN: typeof parsed.budgets.PLN === "number" ? parsed.budgets.PLN : null,
      EUR: typeof parsed.budgets.EUR === "number" ? parsed.budgets.EUR : null,
      USD: typeof parsed.budgets.USD === "number" ? parsed.budgets.USD : null,
    };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveBudgets(budgets: BudgetByCurrency, scope = "global"): void {
  if (typeof window === "undefined") return;
  const payload: StoredBudgets = {
    version: 1,
    updatedAt: new Date().toISOString(),
    budgets: {
      PLN: typeof budgets.PLN === "number" && budgets.PLN >= 0 ? budgets.PLN : null,
      EUR: typeof budgets.EUR === "number" && budgets.EUR >= 0 ? budgets.EUR : null,
      USD: typeof budgets.USD === "number" && budgets.USD >= 0 ? budgets.USD : null,
    },
  };
  window.localStorage.setItem(key(scope), JSON.stringify(payload));
}
