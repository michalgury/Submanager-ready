"use client";

import { useEffect, useState } from "react";

type Currency = "PLN" | "EUR" | "USD";

type Subscription = {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  price: number;
  currency: Currency;
  subscribed: boolean;
};

export default function SubscriptionsPanel() {
  const [items, setItems] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<Currency>("PLN");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/subscriptions");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Błąd pobierania subskrypcji.");
      setItems(data.items ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Błąd pobierania subskrypcji.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setEditId(null);
    setName("");
    setStartDate("");
    setEndDate("");
    setPrice("");
    setCurrency("PLN");
    setErr(null);
  }

  function openAdd() {
    resetForm();
    setOpen(true);
  }

  function openEdit(s: Subscription) {
    setEditId(s.id);
    setName(s.name);
    setStartDate(s.startDate);
    setEndDate(s.endDate);
    setPrice(String(s.price));
    setCurrency(s.currency);
    setErr(null);
    setOpen(true);
  }

  async function save() {
    setErr(null);

    if (!name.trim()) return setErr("Podaj nazwę subskrypcji.");
    if (!startDate) return setErr("Wybierz datę: od kiedy.");
    if (!endDate) return setErr("Wybierz datę: do kiedy.");
    if (startDate > endDate) return setErr("Data „od” nie może być później niż „do”.");
    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0) return setErr("Podaj poprawną cenę (większą od 0).");

    try {
      if (editId) {
        const res = await fetch(`/api/subscriptions/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), startDate, endDate, price: p, currency }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Nie udało się zapisać zmian.");
        setItems((prev) => prev.map((x) => (x.id === editId ? data.item : x)));
      } else {
        const res = await fetch("/api/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), startDate, endDate, price: p, currency }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Nie udało się dodać subskrypcji.");
        setItems((prev) => [data.item, ...prev]);
      }

      setOpen(false);
      resetForm();
    } catch (e: any) {
      setErr(e?.message ?? "Błąd zapisu.");
    }
  }

  async function remove(id: string) {
    if (!confirm("Usunąć subskrypcję?")) return;
    try {
      const res = await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Nie udało się usunąć.");
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      alert(e?.message ?? "Błąd usuwania.");
    }
  }

  async function toggleSubscribe(s: Subscription) {
    try {
      const res = await fetch(`/api/subscriptions/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscribed: !s.subscribed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Nie udało się zmienić statusu.");
      setItems((prev) => prev.map((x) => (x.id === s.id ? data.item : x)));
    } catch (e: any) {
      alert(e?.message ?? "Błąd zmiany statusu.");
    }
  }

  return (
    <section className="mx-auto mt-10 w-full max-w-5xl px-6">
      <div className="rounded-[40px] border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 px-8 pt-8">
          <div>
            <h2 className="text-xl font-bold text-zinc-950">Twoje subskrypcje</h2>
            <p className="mt-1 text-sm text-zinc-600">Dodawaj, edytuj i subskrybuj.</p>
          </div>

          <button
            onClick={openAdd}
            className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900"
          >
            Dodaj
          </button>
        </div>

        <div className="px-8 pb-8 pt-6">
          <div className="max-h-[320px] overflow-y-auto pr-2">
            {loading ? (
              <div className="text-zinc-700">Ładowanie...</div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-zinc-700">
                Brak subskrypcji. Kliknij „Dodaj”.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((s) => (
                  <div key={s.id} className="rounded-2xl border border-zinc-200 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-base font-semibold text-zinc-950">{s.name}</p>
                          {s.subscribed ? (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-900">
                              aktywna
                            </span>
                          ) : (
                            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-semibold text-zinc-700">
                              nieaktywna
                            </span>
                          )}
                        </div>

                        <div className="mt-1 text-sm text-zinc-700">
                          {s.startDate} → {s.endDate}
                        </div>

                        <div className="mt-1 text-sm text-zinc-700">
                          <span className="font-semibold text-zinc-950">
                            {s.price.toFixed(2)} {s.currency}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <button
                          onClick={() => toggleSubscribe(s)}
                          className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900"
                        >
                          {s.subscribed ? "Subskrybujesz" : "Subskrybuj"}
                        </button>

                        <button
                          onClick={() => openEdit(s)}
                          className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-50"
                        >
                          Edytuj
                        </button>

                        <button
                          onClick={() => remove(s.id)}
                          className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                        >
                          Usuń
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {err ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {err}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-6">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-950">
                  {editId ? "Edytuj subskrypcję" : "Dodaj subskrypcję"}
                </h3>
                <p className="mt-1 text-sm text-zinc-600">Daty wybierasz z kalendarza.</p>
              </div>

              <button
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                Zamknij
              </button>
            </div>

            {err ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {err}
              </div>
            ) : null}

            <div className="mt-5 grid gap-4">
              <div>
                <label className="text-sm font-semibold text-zinc-900">Nazwa</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-950 outline-none focus:border-zinc-400"
                  placeholder="np. Netflix / Spotify..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-zinc-900">Od kiedy</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-950 outline-none focus:border-zinc-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-zinc-900">Do kiedy</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-950 outline-none focus:border-zinc-400"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-zinc-900">Cena</label>
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    inputMode="decimal"
                    className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-950 outline-none focus:border-zinc-400"
                    placeholder="np. 29.99"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-zinc-900">Waluta</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as Currency)}
                    className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-950 outline-none focus:border-zinc-400"
                  >
                    <option value="PLN">PLN</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                  }}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-50"
                >
                  Anuluj
                </button>
                <button
                  onClick={save}
                  className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900"
                >
                  {editId ? "Zapisz" : "Dodaj"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
