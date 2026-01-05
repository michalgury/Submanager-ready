type BillingInterval = "day" | "week" | "month" | "year";

const HOURS: Record<BillingInterval, number> = {
  day: 24,
  week: 24 * 7,
  month: 24 * 30.4375,     // średni miesiąc
  year: 24 * 365.2425,     // średni rok
};

export function calcCostBreakdown(amount: number, interval: BillingInterval, intervalCount = 1) {
  const periodHours = HOURS[interval] * intervalCount;
  const perHour = amount / periodHours;
  const perDay = amount / (periodHours / 24);
  const perMinute = perHour / 60;

  return { perMinute, perHour, perDay, periodHours };
}

export function formatPLN(value: number) {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(value);
}

export function formatPerHourPL(perHourPLN: number) {
  // Czytelnie: jeśli < 1 zł/h, pokaż w groszach
  if (perHourPLN < 1) {
    const grosze = perHourPLN * 100;
    return `${grosze.toFixed(2)} gr/h`;
  }
  return `${perHourPLN.toFixed(2)} zł/h`;
}
