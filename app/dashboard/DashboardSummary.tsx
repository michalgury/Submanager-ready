"use client";

type Sub = {
  id: string;
  name: string;
  startDate: string; // ISO albo yyyy-mm-dd
  endDate: string;   // ISO albo yyyy-mm-dd
  price: number;
  currency: string;
  active?: boolean;  // jeśli masz
};

function toDate(v: string) {
  // obsłuży ISO i yyyy-mm-dd
  const d = new Date(v);
  return isNaN(d.getTime()) ? new Date(v.replaceAll(".", "-")) : d;
}

function daysLeft(endDate: string) {
  const now = new Date();
  const end = toDate(endDate);
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function DashboardSummary({ subscriptions }: { subscriptions: Sub[] }) {
  const subs = subscriptions ?? [];

  const activeSubs = subs.filter((s) => {
    if (typeof s.active === "boolean") return s.active;
    return daysLeft(s.endDate) >= 0; // fallback: aktywna jeśli jeszcze nie minęła
  });

  const expiringSoon = activeSubs
    .map((s) => ({ ...s, left: daysLeft(s.endDate) }))
    .filter((s) => s.left >= 0 && s.left <= 7)
    .sort((a, b) => a.left - b.left);

  const next = activeSubs
    .map((s) => ({ ...s, left: daysLeft(s.endDate) }))
    .filter((s) => s.left >= 0)
    .sort((a, b) => a.left - b.left)[0];

  return (
    <section className="mt-10 w-full max-w-5xl">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-zinc-600">Aktywne subskrypcje</div>
          <div className="mt-2 text-3xl font-bold text-zinc-950">{activeSubs.length}</div>
          <div className="mt-2 text-xs text-zinc-500">Liczone po dacie końca (lub polu active).</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-zinc-600">Kończy się w 7 dni</div>
          <div className="mt-2 text-3xl font-bold text-zinc-950">{expiringSoon.length}</div>
          <div className="mt-2 text-xs text-zinc-500">To są alerty “pilne”.</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-zinc-600">Najbliższa kończąca się</div>
          {next ? (
            <>
              <div className="mt-2 text-xl font-bold text-zinc-950">{next.name}</div>
              <div className="mt-1 text-sm text-zinc-700">Za {next.left} dni</div>
            </>
          ) : (
            <div className="mt-2 text-sm text-zinc-700">Brak aktywnych.</div>
          )}
          <div className="mt-2 text-xs text-zinc-500">Sortowane po dacie końca.</div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-semibold text-zinc-950">Nadchodzące zakończenia</div>
            <div className="text-sm text-zinc-600">Top 3 najbliższe.</div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {activeSubs
            .map((s) => ({ ...s, left: daysLeft(s.endDate) }))
            .filter((s) => s.left >= 0)
            .sort((a, b) => a.left - b.left)
            .slice(0, 3)
            .map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3">
                <div>
                  <div className="font-semibold text-zinc-950">{s.name}</div>
                  <div className="text-sm text-zinc-600">Kończy się za {s.left} dni</div>
                </div>
                <div className="text-sm font-semibold text-zinc-950">
                  {Number(s.price).toFixed(2)} {s.currency}
                </div>
              </div>
            ))}

          {activeSubs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-sm text-zinc-600">
              Brak aktywnych subskrypcji do pokazania.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
