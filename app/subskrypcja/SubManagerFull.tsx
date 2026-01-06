"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Currency,
  Subscription,
  BillingCycle,
  loadSubscriptionsFor,
  saveSubscriptionsFor,
  migrateFromAny,
  mergeSubscriptions,
  computeNextRenewalDate,
  daysUntil,
  formatPL,
  monthlyEquivalent,
  getCycleLabel,
} from "../lib/subscriptionsStore";

import { buildICS, type IcsEvent } from "../lib/ics";
import {
  loadProfiles,
  saveProfiles,
  getActiveProfileId,
  setActiveProfileId,
  addProfile,
  renameProfile,
  type Profile,
} from "../lib/profilesStore";

import { loadSettings, saveSettings, type Settings } from "../lib/settingsStore";
import { loadPayments, savePayments, addPayment, type PaymentEntry } from "../lib/paymentsStore";

type StatusFilter = "all" | "active" | "inactive" | "expiring7" | "archived";
type SortBy = "nextRenewal" | "name" | "priceDesc" | "priceAsc";

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function downloadText(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value: unknown): string {
  const s = String(value ?? "");
  if (/[;"\n\r,]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function formatMoney(value: number, currency: Currency) {
  try {
    return new Intl.NumberFormat("pl-PL", { style: "currency", currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function parsePriceToNumber(s: string): number | null {
  const n = Number(String(s ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function badgeForDays(d: number) {
  if (d < 0) return { text: `Po terminie ${Math.abs(d)} dni`, cls: "bg-red-100 text-red-900 ring-1 ring-red-200" };
  if (d === 0) return { text: "Dziś", cls: "bg-amber-100 text-amber-900 ring-1 ring-amber-200" };
  if (d <= 3) return { text: `Za ${d} dni`, cls: "bg-amber-100 text-amber-900 ring-1 ring-amber-200" };
  if (d <= 7) return { text: `Za ${d} dni`, cls: "bg-yellow-100 text-yellow-900 ring-1 ring-yellow-200" };
  return { text: `Za ${d} dni`, cls: "bg-zinc-100 text-zinc-900 ring-1 ring-zinc-200" };
}

function normName(s: string) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function isProbableDuplicate(a: Subscription, b: Subscription) {
  const na = normName(a.name);
  const nb = normName(b.name);
  if (!na || !nb) return false;

  const nameMatch = na === nb || na.includes(nb) || nb.includes(na);
  if (!nameMatch) return false;

  if (a.currency !== b.currency) return false;

  const pa = parsePriceToNumber(a.price);
  const pb = parsePriceToNumber(b.price);
  if (pa === null || pb === null) return false;

  return Math.abs(pa - pb) <= 0.01;
}

function mergeTwo(base: Subscription, incoming: Subscription): Subscription {
  // incoming ma "wygrać" (nowsze info), ale nie wywalamy danych base
  const mergedNotes =
    base.notes && incoming.notes && base.notes !== incoming.notes
      ? `${base.notes}\n---\n${incoming.notes}`
      : (incoming.notes ?? base.notes);

  return {
    ...base,
    ...incoming,
    id: base.id,
    notes: mergedNotes,
    updatedAt: new Date().toISOString(),
    createdAt: base.createdAt ?? incoming.createdAt,
  };
}

function Modal(props: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
}) {
  if (!props.open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={props.onClose} />
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-xl ring-1 ring-black/10">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">{props.title}</h2>
          <button
            className="rounded-lg px-2 py-1 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            onClick={props.onClose}
            type="button"
          >
            Zamknij
          </button>
        </div>
        <div className="px-5 py-4">{props.children}</div>
        {props.footer ? <div className="border-t px-5 py-4">{props.footer}</div> : null}
      </div>
    </div>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  // profile + settings + payments
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileIdState] = useState<string>("default");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [payments, setPayments] = useState<PaymentEntry[]>([]);

  // data
  const [items, setItems] = useState<Subscription[]>([]);
  const [loaded, setLoaded] = useState(false);

  // UI state
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [currency, setCurrency] = useState<Currency | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<SortBy>("nextRenewal");
  const [showArchived, setShowArchived] = useState(false);

  // charts
  const [chartCurrency, setChartCurrency] = useState<Currency>("PLN");

  // modals
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  const [undo, setUndo] = useState<{ item: Subscription; index: number; expiresAt: number } | null>(null);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [importModal, setImportModal] = useState<{
    open: boolean;
    incoming: Subscription[];
    dupAgainstExisting: Array<{ incomingId: string; existingId: string; existingName: string }>;
    report: string[];
  }>({
    open: false,
    incoming: [],
    dupAgainstExisting: [],
    report: [],
  });

  const [profilesModal, setProfilesModal] = useState(false);

  const [dupeModal, setDupeModal] = useState<{
    open: boolean;
    candidate: Subscription | null;
    matches: Subscription[];
    selectedId: string | null;
  }>({ open: false, candidate: null, matches: [], selectedId: null });

  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const [draft, setDraft] = useState<Subscription>(() => ({
    id: uid(),
    name: "",
    startDate: "",
    price: "",
    currency: "PLN",
    subscribed: true,
    billingCycle: "monthly",
    archived: false,
    category: "",
    notes: "",
    usage: "unknown",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  // === INIT: profiles + active profile + settings + data ===
  useEffect(() => {
    const ps = loadProfiles();
    setProfiles(ps);

    const active = getActiveProfileId();
    setProfileIdState(active);

    const s = loadSettings(active);
    setSettings(s);

    const it = loadSubscriptionsFor(active);
    setItems(it);

    const pay = loadPayments(active);
    setPayments(pay);

    setLoaded(true);
  }, []);

  // Persist subscriptions
  useEffect(() => {
    if (!loaded) return;
    saveSubscriptionsFor(profileId, items);
  }, [items, loaded, profileId]);

  // Persist settings
  useEffect(() => {
    if (!loaded || !settings) return;
    saveSettings(profileId, settings);
  }, [settings, loaded, profileId]);

  // Persist payments
  useEffect(() => {
    if (!loaded) return;
    savePayments(profileId, payments);
  }, [payments, loaded, profileId]);

  // Undo timer
  useEffect(() => {
    if (!undo) return;
    const t = window.setInterval(() => {
      if (Date.now() > undo.expiresAt) setUndo(null);
    }, 250);
    return () => window.clearInterval(t);
  }, [undo]);

  // Toast timer
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Auto rules (archiwizacja nieaktywnych po N dniach)
  useEffect(() => {
    if (!loaded || !settings) return;
    const days = settings.autoArchiveInactiveDays;
    if (!Number.isFinite(days) || days <= 0) return;

    const now = Date.now();
    const msLimit = days * 86_400_000;

    setItems((prev) => {
      let changed = false;
      const next = prev.map((s) => {
        const isArchived = Boolean(s.archived);
        if (isArchived) return s;
        if (s.subscribed) return s;

        const upd = s.updatedAt ? Date.parse(s.updatedAt) : null;
        if (!upd) return s;

        if (now - upd > msLimit) {
          changed = true;
          return { ...s, archived: true, updatedAt: new Date().toISOString() };
        }
        return s;
      });
      return changed ? next : prev;
    });
  }, [loaded, settings]);

  const normalizedQuery = query.trim().toLowerCase();

  const computed = useMemo(() => {
    const now = new Date();

    const enriched = items.map((s) => {
      const next = computeNextRenewalDate(s, now);
      const d = next ? daysUntil(next, now) : null;

      const isArchived = Boolean(s.archived);
      const isActive = Boolean(s.subscribed) && !isArchived;

      const expiring7 = isActive && d !== null && d >= 0 && d <= 7;

      const matchesQuery =
        !normalizedQuery ||
        s.name.toLowerCase().includes(normalizedQuery) ||
        (s.category ?? "").toLowerCase().includes(normalizedQuery);

      const matchesCurrency = currency === "ALL" ? true : s.currency === currency;

      let matchesStatus = true;
      if (status === "active") matchesStatus = isActive && !isArchived;
      if (status === "inactive") matchesStatus = !s.subscribed && !isArchived;
      if (status === "archived") matchesStatus = isArchived;
      if (status === "expiring7") matchesStatus = expiring7;

      const visibleArchived = showArchived ? true : !isArchived;

      return { s, next, days: d, isArchived, isActive, expiring7, matchesQuery, matchesCurrency, matchesStatus, visibleArchived };
    });

    const filtered = enriched.filter((x) => x.matchesQuery && x.matchesCurrency && x.matchesStatus && x.visibleArchived);

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "name") return a.s.name.localeCompare(b.s.name, "pl");
      if (sortBy === "priceAsc") {
        const pa = parsePriceToNumber(a.s.price) ?? 0;
        const pb = parsePriceToNumber(b.s.price) ?? 0;
        return pa - pb;
      }
      if (sortBy === "priceDesc") {
        const pa = parsePriceToNumber(a.s.price) ?? 0;
        const pb = parsePriceToNumber(b.s.price) ?? 0;
        return pb - pa;
      }
      const da = a.days ?? Number.POSITIVE_INFINITY;
      const db = b.days ?? Number.POSITIVE_INFINITY;
      return da - db;
    });

    // Summary (na nie-archived)
    const active = enriched.filter((x) => x.isActive);
    const exp7 = enriched.filter((x) => x.expiring7);

    const totalsByCurrency: Record<Currency, number> = { PLN: 0, EUR: 0, USD: 0 };
    for (const x of active) {
      const m = monthlyEquivalent(x.s);
      if (m !== null) totalsByCurrency[x.s.currency] += m;
    }

    // category totals (monthly eq)
    const catByCurrency: Record<Currency, Record<string, number>> = { PLN: {}, EUR: {}, USD: {} };
    for (const x of active) {
      const m = monthlyEquivalent(x.s);
      if (m === null) continue;
      const cat = (x.s.category?.trim() || "Bez kategorii");
      catByCurrency[x.s.currency][cat] = (catByCurrency[x.s.currency][cat] || 0) + m;
    }

    const nearest = active
      .filter((x) => x.next && x.days !== null)
      .sort((a, b) => (a.days ?? 999999) - (b.days ?? 999999))[0];

    const upcomingH = settings?.horizonDays ?? 90;

    // upcoming 30 (UI)
    const upcoming30 = active
      .filter((x) => x.next && x.days !== null && x.days >= 0 && x.days <= 30)
      .sort((a, b) => (a.days ?? 999999) - (b.days ?? 999999))
      .slice(0, 8);

    // notifications
    const notifyDays = settings?.notifyDays ?? 3;
    const dueSoon = active
      .filter((x) => x.next && x.days !== null && x.days >= 0 && x.days <= notifyDays)
      .sort((a, b) => (a.days ?? 999999) - (b.days ?? 999999))
      .slice(0, 8);

    // cashflow horizon: list events (date + amount)
    const horizonEvents: Array<{ dateISO: string; s: Subscription; amount: number | null }> = [];
    for (const x of active) {
      let next = computeNextRenewalDate(x.s, now);
      if (!next) continue;

      const limit = new Date(now);
      limit.setDate(limit.getDate() + upcomingH);

      // generuj kolejne terminy do horyzontu
      let guard = 0;
      while (next.getTime() <= limit.getTime() && guard++ < 400) {
        const iso = toISODate(next);
        horizonEvents.push({ dateISO: iso, s: x.s, amount: parsePriceToNumber(x.s.price) });
        // następny po tym dniu
        const nextProbe = new Date(next);
        nextProbe.setDate(nextProbe.getDate() + 1);
        next = computeNextRenewalDate(x.s, nextProbe) ?? new Date(limit.getTime() + 1);
      }
    }

    horizonEvents.sort((a, b) => a.dateISO.localeCompare(b.dateISO));

    return {
      sorted,
      totalsByCurrency,
      activeCount: active.length,
      exp7Count: exp7.length,
      nearest,
      upcoming30,
      dueSoon,
      catByCurrency,
      horizonEvents,
      horizonDays: upcomingH,
      notifyDays,
    };
  }, [items, normalizedQuery, currency, status, sortBy, showArchived, settings]);

  // ====== budżet ======
  const budgetState = useMemo(() => {
    const s = settings;
    if (!s) return null;

    const budgets = s.budgets || {};
    const out: Record<Currency, { budget: number; used: number; over: boolean; pct: number }> = {
      PLN: { budget: Number(budgets.PLN ?? 0) || 0, used: computed.totalsByCurrency.PLN, over: false, pct: 0 },
      EUR: { budget: Number(budgets.EUR ?? 0) || 0, used: computed.totalsByCurrency.EUR, over: false, pct: 0 },
      USD: { budget: Number(budgets.USD ?? 0) || 0, used: computed.totalsByCurrency.USD, over: false, pct: 0 },
    };

    for (const c of ["PLN", "EUR", "USD"] as Currency[]) {
      const b = out[c].budget;
      const u = out[c].used;
      out[c].over = b > 0 && u > b;
      out[c].pct = b > 0 ? Math.min(200, (u / b) * 100) : 0;
    }
    return out;
  }, [settings, computed.totalsByCurrency]);

  // ====== skaner ukrytych kosztów ======
  const scanner = useMemo(() => {
    const s = settings;
    const expTh = s?.expensiveThreshold ?? { PLN: 0, EUR: 0, USD: 0 };

    const active = items.filter((x) => x.subscribed && !x.archived);
    const expensive: Subscription[] = [];
    const unused: Subscription[] = [];
    const increased: Array<{ s: Subscription; from: number; to: number }> = [];

    for (const it of active) {
      const m = monthlyEquivalent(it);
      if (m !== null) {
        const th = Number(expTh[it.currency] ?? 0) || 0;
        if (th > 0 && m >= th) expensive.push(it);
      }

      if (it.usage === "unused" || it.usage === "rare") unused.push(it);

      const ph = it.priceHistory ?? [];
      if (ph.length >= 2) {
        const last = ph[ph.length - 1];
        const prev = ph[ph.length - 2];
        if (last.currency === prev.currency && last.price > prev.price) {
          increased.push({ s: it, from: prev.price, to: last.price });
        }
      }
    }

    // kandydaci do anulowania: unused + expensive (unikalne)
    const map = new Map<string, Subscription>();
    for (const x of unused) map.set(x.id, x);
    for (const x of expensive) map.set(x.id, x);

    const candidates = Array.from(map.values());

    const savingsByCurrency: Record<Currency, number> = { PLN: 0, EUR: 0, USD: 0 };
    for (const x of candidates) {
      const m = monthlyEquivalent(x);
      if (m !== null) savingsByCurrency[x.currency] += m;
    }

    return { expensive, unused, increased, candidates, savingsByCurrency };
  }, [items, settings]);

  // ====== actions ======
  function switchProfile(nextId: string) {
    setError("");
    setActiveProfileId(nextId);
    setProfileIdState(nextId);

    const s = loadSettings(nextId);
    setSettings(s);

    const it = loadSubscriptionsFor(nextId);
    setItems(it);

    const pay = loadPayments(nextId);
    setPayments(pay);

    // reset filtrów per profile (czytelniej)
    setQuery("");
    setStatus("all");
    setCurrency("ALL");
    setSortBy("nextRenewal");
    setShowArchived(false);
  }

  function openAdd() {
    setError("");
    setEditingId(null);
    setDraft({
      id: uid(),
      name: "",
      startDate: "",
      price: "",
      currency: "PLN",
      subscribed: true,
      billingCycle: "monthly",
      cycleDays: undefined,
      archived: false,
      category: "",
      notes: "",
      usage: "unknown",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setEditorOpen(true);
  }

  function openEdit(id: string) {
    setError("");
    const found = items.find((x) => x.id === id);
    if (!found) {
      setError("Nie znaleziono rekordu do edycji (możliwe rozjechanie danych).");
      return;
    }
    setEditingId(id);
    setDraft({ ...found, updatedAt: new Date().toISOString() });
    setEditorOpen(true);
  }

  function validateDraft(d: Subscription): string | null {
    if (!d.name.trim()) return "Podaj nazwę subskrypcji.";
    if (!d.startDate) return "Podaj datę startu.";
    const p = parsePriceToNumber(d.price);
    if (p === null || p < 0) return "Cena musi być liczbą ≥ 0.";
    if (d.billingCycle === "custom") {
      const cd = Number(d.cycleDays);
      if (!Number.isFinite(cd) || cd <= 0) return "Dla niestandardowej subskrypcji podaj Cycle Days > 0.";
    }
    return null;
  }

  function applyPriceHistory(existing: Subscription | null, updated: Subscription): Subscription {
    const pNew = parsePriceToNumber(updated.price);
    if (pNew === null) return updated;

    const nowISO = new Date().toISOString();

    // jeśli to nowy rekord
    if (!existing) {
      const ph = updated.priceHistory ?? [];
      if (!ph.length) {
        return { ...updated, priceHistory: [{ price: pNew, currency: updated.currency, at: nowISO }] };
      }
      return updated;
    }

    const pOld = parsePriceToNumber(existing.price);
    if (pOld === null) return updated;

    const changed = pOld !== pNew || existing.currency !== updated.currency;
    if (!changed) return updated;

    const ph = [...(existing.priceHistory ?? [])];
    // jeśli historia pusta, dopisz stary punkt
    if (!ph.length) ph.push({ price: pOld, currency: existing.currency, at: existing.updatedAt ?? existing.createdAt ?? nowISO });
    ph.push({ price: pNew, currency: updated.currency, at: nowISO });

    return { ...updated, priceHistory: ph.slice(-12) };
  }

  function upsertDraft() {
    const msg = validateDraft(draft);
    if (msg) {
      setError(msg);
      return;
    }
    setError("");

    const nowISO = new Date().toISOString();
    const baseFinal: Subscription = { ...draft, updatedAt: nowISO, createdAt: draft.createdAt ?? nowISO };

    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === (editingId ?? baseFinal.id));
      const existing = idx === -1 ? null : prev[idx];

      const final = applyPriceHistory(existing, baseFinal);

      // DUPE CHECK tylko przy dodawaniu
      if (idx === -1 && !editingId) {
        const matches = prev.filter((x) => !x.archived && isProbableDuplicate(x, final));
        if (matches.length) {
          setDupeModal({ open: true, candidate: final, matches, selectedId: matches[0].id });
          return prev; // jeszcze nie zapisujemy
        }
      }

      if (idx === -1) return [final, ...prev];
      const next = [...prev];
      next[idx] = final;
      return next;
    });

    setEditorOpen(false);
  }

  function confirmMergeCandidateIntoExisting(existingId: string) {
    const candidate = dupeModal.candidate;
    if (!candidate) return;

    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === existingId);
      if (idx === -1) return [candidate, ...prev];

      const merged = mergeTwo(prev[idx], candidate);
      const next = [...prev];
      next[idx] = merged;
      return next;
    });

    setDupeModal({ open: false, candidate: null, matches: [], selectedId: null });
    setToast("Scalono z istniejącą subskrypcją (duplikat).");
  }

  function keepBothCandidate() {
    const candidate = dupeModal.candidate;
    if (!candidate) return;
    setItems((prev) => [candidate, ...prev]);
    setDupeModal({ open: false, candidate: null, matches: [], selectedId: null });
    setToast("Dodano mimo podobieństwa (pozostawiono obie).");
  }

  function toggleArchive(id: string) {
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, archived: !x.archived, updatedAt: new Date().toISOString() } : x))
    );
  }

  function askDelete(id: string) {
    setDeleteConfirm({ open: true, id });
  }

  function doDelete() {
    const id = deleteConfirm.id;
    setDeleteConfirm({ open: false, id: null });
    if (!id) return;

    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      if (idx === -1) return prev;

      const removed = prev[idx];
      setUndo({ item: removed, index: idx, expiresAt: Date.now() + 6000 });

      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
  }

  function undoDelete() {
    if (!undo) return;
    setItems((prev) => {
      const next = [...prev];
      next.splice(Math.min(undo.index, next.length), 0, undo.item);
      return next;
    });
    setUndo(null);
  }

  function exportJson() {
    const payload = { version: 2, exportedAt: new Date().toISOString(), profileId, items };
    const filename = `submanager-${profileId}-backup-${new Date().toISOString().slice(0, 10)}.json`;
    downloadText(filename, JSON.stringify(payload, null, 2), "application/json");
  }

  function exportCsv() {
    const headers = [
      "id","name","price","currency","billingCycle","cycleDays","startDate","endDate",
      "subscribed","archived","category","usage","notes"
    ];
    const sep = ";";

    const rows = items.map((s) =>
      [
        s.id,
        s.name,
        s.price,
        s.currency,
        s.billingCycle ?? "",
        s.cycleDays ?? "",
        s.startDate ?? "",
        s.endDate ?? "",
        s.subscribed ? "true" : "false",
        s.archived ? "true" : "false",
        s.category ?? "",
        s.usage ?? "unknown",
        s.notes ?? "",
      ].map(csvEscape).join(sep)
    );

    const csv = "\ufeff" + [headers.join(sep), ...rows].join("\n");
    const filename = `submanager-${profileId}-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadText(filename, csv, "text/csv;charset=utf-8");
  }

  function exportICS() {
    const horizonDays = settings?.horizonDays ?? 90;
    const now = new Date();
    const limit = new Date(now);
    limit.setDate(limit.getDate() + horizonDays);

    const active = items.filter((x) => x.subscribed && !x.archived);

    const events: IcsEvent[] = [];

    for (const s of active) {
      let next = computeNextRenewalDate(s, now);
      if (!next) continue;

      let guard = 0;
      while (next.getTime() <= limit.getTime() && guard++ < 400) {
        const iso = toISODate(next);
        events.push({
          uid: `${profileId}-${s.id}-${iso}`,
          dateISO: iso,
          summary: `${s.name} – ${s.price} ${s.currency}`,
          description: `Kategoria: ${s.category || "—"} | Cykl: ${getCycleLabel(s)}`,
        });

        const probe = new Date(next);
        probe.setDate(probe.getDate() + 1);
        next = computeNextRenewalDate(s, probe);
        if (!next) break;
      }
    }

    const ics = buildICS(events);
    const filename = `submanager-${profileId}-${horizonDays}d.ics`;
    downloadText(filename, ics, "text/calendar;charset=utf-8");
    setToast("Wyeksportowano .ics (możesz zaimportować do Google Calendar).");
  }

  function pickImportFile() {
    setError("");
    fileRef.current?.click();
  }

  async function onImportFileSelected(file: File | null) {
    if (!file) return;
    try {
      const text = await file.text();
      const raw = JSON.parse(text) as unknown;
      let incoming = migrateFromAny(raw);

      if (!incoming.length) {
        setError("Import: plik nie zawiera rozpoznawalnych subskrypcji.");
        return;
      }

      // wykryj duplikaty incoming vs existing
      const dupAgainstExisting: Array<{ incomingId: string; existingId: string; existingName: string }> = [];
      for (const inc of incoming) {
        const ex = items.find((e) => !e.archived && isProbableDuplicate(e, inc));
        if (ex) dupAgainstExisting.push({ incomingId: inc.id, existingId: ex.id, existingName: ex.name });
      }

      setImportModal({ open: true, incoming, dupAgainstExisting, report: [] });
    } catch {
      setError("Import: nie udało się wczytać pliku (sprawdź czy to poprawny JSON).");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function importReplace() {
    setItems(importModal.incoming);
    setImportModal({ open: false, incoming: [], dupAgainstExisting: [], report: [] });
    setToast("Zaimportowano: zastąpiono listę.");
  }

  function importMerge() {
    setItems((prev) => mergeSubscriptions(prev, importModal.incoming));
    setImportModal({ open: false, incoming: [], dupAgainstExisting: [], report: [] });
    setToast("Zaimportowano: scalono po ID.");
  }

  function importAutoMergeDuplicates() {
    // automatycznie łączy duplikaty incoming -> existing (po podobieństwie),
    // a resztę dodaje
    const report: string[] = [];
    setItems((prev) => {
      const next = [...prev];
      for (const inc of importModal.incoming) {
        const idx = next.findIndex((e) => !e.archived && isProbableDuplicate(e, inc));
        if (idx >= 0) {
          const before = next[idx];
          next[idx] = mergeTwo(before, inc);
          report.push(`Scalono: "${inc.name}" → istniejące "${before.name}"`);
        } else {
          next.unshift(inc);
          report.push(`Dodano: "${inc.name}"`);
        }
      }
      return next;
    });

    setImportModal((m) => ({ ...m, report }));
    setToast("Import: wykonano auto-merge duplikatów (raport w oknie importu).");
  }

  function markPaid(s: Subscription) {
    const amount = parsePriceToNumber(s.price);
    if (amount === null) {
      setError("Nie można oznaczyć jako zapłacone: nieprawidłowa cena.");
      return;
    }

    const now = new Date();
    const next = computeNextRenewalDate(s, now);
    const dueISO = next ? toISODate(next) : undefined;

    const entry = addPayment(profileId, {
      subscriptionId: s.id,
      name: s.name,
      amount,
      currency: s.currency,
      paidAt: new Date().toISOString(),
      dueDate: dueISO,
    });

    setPayments((prev) => [entry, ...prev].slice(0, 500));
    setToast(`Dodano do historii płatności: ${s.name}`);

    // aktualizuj flags (nie usuwamy nic – tylko dopis)
    setItems((prev) =>
      prev.map((x) => (x.id === s.id ? { ...x, updatedAt: new Date().toISOString() } : x))
    );
  }

  function updateBudget(c: Currency, val: string) {
    if (!settings) return;
    const n = Number(String(val).replace(",", "."));
    setSettings({
      ...settings,
      budgets: { ...(settings.budgets ?? {}), [c]: Number.isFinite(n) ? Math.max(0, n) : 0 },
    });
  }

  function updateExpensiveThreshold(c: Currency, val: string) {
    if (!settings) return;
    const n = Number(String(val).replace(",", "."));
    setSettings({
      ...settings,
      expensiveThreshold: { ...(settings.expensiveThreshold ?? {}), [c]: Number.isFinite(n) ? Math.max(0, n) : 0 },
    });
  }

  async function logout() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {
      // jeśli endpointu nie ma – i tak czyścimy UXowo
    }
    router.push("/?auth=login");
  }

  // ===== UI helpers =====
  const categoryBars = useMemo(() => {
    const map = computed.catByCurrency[chartCurrency] ?? {};
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const total = entries.reduce((s, [, v]) => s + v, 0);
    return { entries, total };
  }, [computed.catByCurrency, chartCurrency]);

  const recentPayments = useMemo(() => payments.slice(0, 12), [payments]);

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        {/* TOP BAR */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">SubManager — Subskrypcje</h1>
            <p className="mt-1 text-sm font-medium text-zinc-700">
              Profile + budżet + wykres kategorii + cashflow + .ics + historia płatności + duplikaty + reguły.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Profile switch */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfilesModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-zinc-200 hover:bg-zinc-50"
              >
                <IconUser />
                <span>
                  {profiles.find((p) => p.id === profileId)?.name ?? "Profil"}
                </span>
                <IconChevron />
              </button>
            </div>

            <button
              type="button"
              onClick={openAdd}
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              + Dodaj
            </button>

            <button
              type="button"
              onClick={pickImportFile}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-zinc-200 hover:bg-zinc-50"
            >
              Import JSON
            </button>

            <button
              type="button"
              onClick={exportJson}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-zinc-200 hover:bg-zinc-50"
            >
              Export JSON
            </button>

            <button
              type="button"
              onClick={exportCsv}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-zinc-200 hover:bg-zinc-50"
            >
              Export CSV
            </button>

            <button
              type="button"
              onClick={exportICS}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-zinc-200 hover:bg-zinc-50"
            >
              Export .ics
            </button>

            <button
              type="button"
              onClick={logout}
              className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-zinc-200 hover:bg-zinc-50"
              title="Wyloguj"
            >
              Wyloguj
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => void onImportFileSelected(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        {/* BANNER: due soon + budget exceeded */}
        {computed.dueSoon.length ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
            Płatność w ciągu {computed.notifyDays} dni:{" "}
            <span className="font-bold">
              {computed.dueSoon.map((x) => x.s.name).join(", ")}
            </span>
          </div>
        ) : null}

        {budgetState && (budgetState.PLN.over || budgetState.EUR.over || budgetState.USD.over) ? (
          <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-950">
            Przekroczony budżet:{" "}
            {(["PLN", "EUR", "USD"] as Currency[])
              .filter((c) => budgetState[c].over)
              .map((c) => `${c}`)
              .join(", ")}
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-950">
            {error}
          </div>
        ) : null}

        {/* SUMMARY */}
        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
            <div className="text-sm font-semibold text-zinc-700">Aktywne</div>
            <div className="mt-1 text-2xl font-bold text-zinc-950">{computed.activeCount}</div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
            <div className="text-sm font-semibold text-zinc-700">Wygasa w 7 dni</div>
            <div className="mt-1 text-2xl font-bold text-zinc-950">{computed.exp7Count}</div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
            <div className="text-sm font-semibold text-zinc-700">Suma / miesiąc (przybliż.)</div>
            <div className="mt-2 space-y-1 text-sm font-medium">
              {(["PLN", "EUR", "USD"] as Currency[]).map((c) => (
                <div key={c} className="flex items-center justify-between">
                  <span className="text-zinc-800">{c}</span>
                  <span className="font-bold text-zinc-950">{formatMoney(computed.totalsByCurrency[c], c)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
            <div className="text-sm font-semibold text-zinc-700">Najbliższa płatność</div>
            <div className="mt-2">
              {computed.nearest?.next ? (
                <>
                  <div className="text-base font-bold text-zinc-950">{computed.nearest.s.name}</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-800">
                    {formatPL(toISODate(computed.nearest.next))} ({badgeForDays(computed.nearest.days ?? 999).text})
                  </div>
                </>
              ) : (
                <div className="text-sm font-semibold text-zinc-700">Brak danych</div>
              )}
            </div>
          </div>
        </section>

        {/* BUDGET + CATEGORY CHART */}
        <section className="mt-6 grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-zinc-950">Budżet miesięczny</div>
              <div className="text-xs font-semibold text-zinc-700">Alert = przekroczenie</div>
            </div>

            {settings && budgetState ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {(["PLN", "EUR", "USD"] as Currency[]).map((c) => (
                  <div key={c} className="rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-200">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-zinc-800">{c}</div>
                      <div className={classNames("text-xs font-bold", budgetState[c].over ? "text-red-700" : "text-zinc-800")}>
                        {budgetState[c].budget > 0 ? `${Math.round(budgetState[c].pct)}%` : "—"}
                      </div>
                    </div>

                    <div className="mt-2 text-xs font-semibold text-zinc-700">
                      Użyte: <span className="font-bold text-zinc-950">{formatMoney(budgetState[c].used, c)}</span>
                    </div>

                    <div className="mt-2">
                      <label className="text-[11px] font-bold text-zinc-700">Budżet</label>
                      <input
                        value={String(settings.budgets?.[c] ?? 0)}
                        onChange={(e) => updateBudget(c, e.target.value)}
                        className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-400"
                        placeholder="np. 150"
                      />
                    </div>

                    <div className="mt-2">
                      <label className="text-[11px] font-bold text-zinc-700">Próg „droga” (mies.)</label>
                      <input
                        value={String(settings.expensiveThreshold?.[c] ?? 0)}
                        onChange={(e) => updateExpensiveThreshold(c, e.target.value)}
                        className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-400"
                        placeholder="np. 100"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 text-sm font-semibold text-zinc-700">Ładowanie ustawień…</div>
            )}
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-zinc-950">Kategorie — udział kosztów (mies.)</div>
              <select
                value={chartCurrency}
                onChange={(e) => setChartCurrency(e.target.value as Currency)}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-400"
              >
                <option value="PLN">PLN</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div className="mt-3 space-y-2">
              {categoryBars.entries.length ? (
                categoryBars.entries.map(([cat, val]) => {
                  const pct = categoryBars.total > 0 ? (val / categoryBars.total) * 100 : 0;
                  return (
                    <div key={cat} className="rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-200">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-zinc-950">{cat}</div>
                        <div className="text-sm font-bold text-zinc-950">{formatMoney(val, chartCurrency)}</div>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-white ring-1 ring-zinc-200">
                        <div className="h-2 rounded-full bg-zinc-900" style={{ width: `${Math.max(1, Math.min(100, pct))}%` }} />
                      </div>
                      <div className="mt-1 text-xs font-semibold text-zinc-700">{pct.toFixed(1)}%</div>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm font-semibold text-zinc-700">Brak danych (albo brak aktywnych subskrypcji).</div>
              )}
            </div>
          </div>
        </section>

        {/* CONTROLS */}
        <section className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
          <div className="grid gap-3 md:grid-cols-12">
            <div className="md:col-span-5">
              <label className="text-xs font-bold text-zinc-700">Szukaj (nazwa/kategoria)</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="np. Netflix, narzędzia, szkoła…"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-400"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-zinc-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-400"
              >
                <option value="all">Wszystkie</option>
                <option value="active">Aktywne</option>
                <option value="inactive">Nieaktywne</option>
                <option value="expiring7">Wygasa ≤ 7 dni</option>
                <option value="archived">Archiwum</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-zinc-700">Waluta</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency | "ALL")}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-400"
              >
                <option value="ALL">Wszystkie</option>
                <option value="PLN">PLN</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-zinc-700">Sortowanie</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-400"
              >
                <option value="nextRenewal">Najbliższa płatność</option>
                <option value="name">Nazwa</option>
                <option value="priceDesc">Cena ↓</option>
                <option value="priceAsc">Cena ↑</option>
              </select>
            </div>

            <div className="md:col-span-1 flex items-end">
              <label className="flex select-none items-center gap-2 text-sm font-semibold text-zinc-900">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                Archiwum
              </label>
            </div>
          </div>
        </section>

        {/* UPCOMING + LIST */}
        <section className="mt-6 grid gap-3 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 lg:col-span-1">
            <div className="text-sm font-bold text-zinc-950">Kolejne płatności (30 dni)</div>
            <div className="mt-3 space-y-2">
              {computed.upcoming30.length ? (
                computed.upcoming30.map((x) => {
                  const day = x.next!;
                  const iso = toISODate(day);
                  const b = badgeForDays(x.days ?? 999);
                  return (
                    <div key={x.s.id} className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 ring-1 ring-zinc-200">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-zinc-950">{x.s.name}</div>
                        <div className="text-xs font-semibold text-zinc-700">{formatPL(iso)}</div>
                      </div>
                      <span className={classNames("ml-3 shrink-0 rounded-full px-2 py-1 text-xs font-bold", b.cls)}>
                        {b.text}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm font-semibold text-zinc-700">Brak płatności w ciągu 30 dni.</div>
              )}
            </div>

            {/* CASHFLOW */}
            <div className="mt-6">
              <div className="text-sm font-bold text-zinc-950">Cashflow ({computed.horizonDays} dni)</div>
              <div className="mt-2 text-xs font-semibold text-zinc-700">
                Liczba zdarzeń: <span className="font-bold text-zinc-950">{computed.horizonEvents.length}</span>
              </div>

              <div className="mt-3 max-h-[260px] overflow-auto rounded-xl bg-zinc-50 p-2 ring-1 ring-zinc-200">
                {computed.horizonEvents.length ? (
                  <div className="space-y-2">
                    {computed.horizonEvents.slice(0, 40).map((e, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-zinc-200">
                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-zinc-950">{e.s.name}</div>
                          <div className="text-[11px] font-semibold text-zinc-700">{formatPL(e.dateISO)}</div>
                        </div>
                        <div className="text-xs font-bold text-zinc-950">
                          {e.amount === null ? "—" : `${e.amount.toFixed(2)} ${e.s.currency}`}
                        </div>
                      </div>
                    ))}
                    {computed.horizonEvents.length > 40 ? (
                      <div className="text-center text-xs font-semibold text-zinc-700">
                        +{computed.horizonEvents.length - 40} więcej…
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-sm font-semibold text-zinc-700">Brak zdarzeń w horyzoncie.</div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-zinc-950">Lista subskrypcji</div>
              <div className="text-sm font-semibold text-zinc-800">Wyniki: {computed.sorted.length}</div>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="text-xs font-bold text-zinc-800">
                  <tr className="border-b bg-zinc-50">
                    <th className="py-3 pr-4">Nazwa</th>
                    <th className="py-3 pr-4">Cena</th>
                    <th className="py-3 pr-4">Cykl</th>
                    <th className="py-3 pr-4">Następna płatność</th>
                    <th className="py-3 pr-4">Użycie</th>
                    <th className="py-3 pr-2 text-right">Akcje</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {computed.sorted.map((x) => {
                    const next = x.next;
                    const nextIso = next ? toISODate(next) : "";
                    const badge = x.days !== null ? badgeForDays(x.days) : null;

                    const m = monthlyEquivalent(x.s);
                    const th = settings?.expensiveThreshold?.[x.s.currency] ?? 0;
                    const isExpensive = (Number(th) || 0) > 0 && m !== null && m >= (Number(th) || 0);

                    return (
                      <tr key={x.s.id} className={classNames(x.isArchived && "opacity-80")}>
                        <td className="py-3 pr-4">
                          <div className="font-bold text-zinc-950">{x.s.name}</div>
                          <div className="text-xs font-semibold text-zinc-700">{x.s.category ? x.s.category : "—"}</div>
                          {isExpensive ? (
                            <div className="mt-1 inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-900 ring-1 ring-red-200">
                              Droga (mies.)
                            </div>
                          ) : null}
                        </td>

                        <td className="py-3 pr-4">
                          <div className="font-bold text-zinc-950">
                            {x.s.price} {x.s.currency}
                          </div>
                          <div className="text-xs font-semibold text-zinc-700">
                            / mies. ~{" "}
                            {m === null ? "—" : formatMoney(m, x.s.currency)}
                          </div>
                        </td>

                        <td className="py-3 pr-4">
                          <div className="font-bold text-zinc-950">{getCycleLabel(x.s)}</div>
                          <div className="text-xs font-semibold text-zinc-700">
                            {x.s.billingCycle === "custom" ? `co ${x.s.cycleDays ?? "?"} dni` : ""}
                          </div>
                        </td>

                        <td className="py-3 pr-4">
                          {next ? (
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-950">{formatPL(nextIso)}</span>
                              {badge ? (
                                <span className={classNames("rounded-full px-2 py-1 text-xs font-bold", badge.cls)}>
                                  {badge.text}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-zinc-700">—</span>
                          )}
                        </td>

                        <td className="py-3 pr-4">
                          <select
                            value={x.s.usage ?? "unknown"}
                            onChange={(e) =>
                              setItems((prev) =>
                                prev.map((it) =>
                                  it.id === x.s.id
                                    ? { ...it, usage: e.target.value as any, updatedAt: new Date().toISOString() }
                                    : it
                                )
                              )
                            }
                            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-900 outline-none focus:border-zinc-400"
                          >
                            <option value="unknown">Nie wiem</option>
                            <option value="often">Często</option>
                            <option value="rare">Rzadko</option>
                            <option value="unused">Nie używam</option>
                          </select>
                        </td>

                        <td className="py-3 pr-2 text-right">
                          <div className="inline-flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => markPaid(x.s)}
                              className="rounded-lg bg-black px-3 py-1.5 text-xs font-bold text-white hover:bg-zinc-800"
                            >
                              Zapłacone
                            </button>

                            <button
                              type="button"
                              onClick={() => openEdit(x.s.id)}
                              className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50"
                            >
                              Edytuj
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleArchive(x.s.id)}
                              className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50"
                            >
                              {x.isArchived ? "Przywróć" : "Archiwizuj"}
                            </button>

                            <button
                              type="button"
                              onClick={() => askDelete(x.s.id)}
                              className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-red-700 ring-1 ring-red-200 hover:bg-red-50"
                            >
                              Usuń
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {!computed.sorted.length ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm font-semibold text-zinc-700">
                        Brak wyników. Zmień filtry lub dodaj pierwszą subskrypcję.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {/* SCANNER + PAYMENTS */}
            <div className="mt-6 grid gap-3 lg:grid-cols-2">
              <div className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
                <div className="text-sm font-bold text-zinc-950">Skaner oszczędności</div>

                <div className="mt-2 text-xs font-semibold text-zinc-700">
                  Kandydaci do anulowania (unused/expensive):{" "}
                  <span className="font-bold text-zinc-950">{scanner.candidates.length}</span>
                </div>

                <div className="mt-2 space-y-1 text-xs font-semibold text-zinc-700">
                  {(["PLN", "EUR", "USD"] as Currency[]).map((c) => (
                    <div key={c} className="flex items-center justify-between">
                      <span>Potencjalna oszczędność / mies. ({c})</span>
                      <span className="font-bold text-zinc-950">{formatMoney(scanner.savingsByCurrency[c], c)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl bg-white p-3 ring-1 ring-zinc-200">
                    <div className="text-xs font-bold text-zinc-800">Drogie</div>
                    <div className="mt-1 text-lg font-bold text-zinc-950">{scanner.expensive.length}</div>
                  </div>
                  <div className="rounded-xl bg-white p-3 ring-1 ring-zinc-200">
                    <div className="text-xs font-bold text-zinc-800">Nieużywane / rzadko</div>
                    <div className="mt-1 text-lg font-bold text-zinc-950">{scanner.unused.length}</div>
                  </div>
                </div>

                {scanner.increased.length ? (
                  <div className="mt-3 rounded-xl bg-white p-3 ring-1 ring-zinc-200">
                    <div className="text-xs font-bold text-zinc-800">Wykryto wzrost ceny</div>
                    <div className="mt-2 space-y-1">
                      {scanner.increased.slice(0, 4).map((x) => (
                        <div key={x.s.id} className="flex items-center justify-between text-xs font-semibold text-zinc-800">
                          <span className="truncate">{x.s.name}</span>
                          <span className="font-bold text-zinc-950">
                            {x.from.toFixed(2)} → {x.to.toFixed(2)} {x.s.currency}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
                <div className="text-sm font-bold text-zinc-950">Historia płatności</div>
                <div className="mt-2 text-xs font-semibold text-zinc-700">
                  Ostatnie wpisy: <span className="font-bold text-zinc-950">{payments.length}</span>
                </div>

                <div className="mt-3 space-y-2">
                  {recentPayments.length ? (
                    recentPayments.map((p) => (
                      <div key={p.id} className="rounded-xl bg-white px-3 py-2 ring-1 ring-zinc-200">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <div className="truncate text-xs font-bold text-zinc-950">{p.name}</div>
                            <div className="text-[11px] font-semibold text-zinc-700">
                              {new Date(p.paidAt).toLocaleString("pl-PL")}
                              {p.dueDate ? ` • termin: ${formatPL(p.dueDate)}` : ""}
                            </div>
                          </div>
                          <div className="text-xs font-bold text-zinc-950">
                            {formatMoney(p.amount, p.currency)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm font-semibold text-zinc-700">
                      Brak historii — kliknij „Zapłacone” przy subskrypcji.
                    </div>
                  )}
                </div>

                {payments.length ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!confirm("Na pewno wyczyścić historię płatności w tym profilu?")) return;
                      setPayments([]);
                      setToast("Wyczyszczono historię płatności.");
                    }}
                    className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-bold text-red-700 ring-1 ring-red-200 hover:bg-red-50"
                  >
                    Wyczyść historię
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Editor modal */}
      <Modal
        open={editorOpen}
        title={editingId ? "Edytuj subskrypcję" : "Dodaj subskrypcję"}
        onClose={() => setEditorOpen(false)}
        footer={
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-semibold text-zinc-700">
              Tip: „Niestandardowa” jest super, jeśli masz cykl np. co 14 dni.
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={upsertDraft}
                className="rounded-xl bg-black px-4 py-2 text-sm font-bold text-white hover:bg-zinc-800"
              >
                Zapisz
              </button>
            </div>
          </div>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-zinc-700">Nazwa</label>
            <input
              value={draft.name}
              onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-400"
              placeholder="np. Netflix, Spotify, iCloud…"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700">Cena</label>
            <input
              value={draft.price}
              onChange={(e) => setDraft((p) => ({ ...p, price: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-400"
              placeholder="np. 29.99"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700">Waluta</label>
            <select
              value={draft.currency}
              onChange={(e) => setDraft((p) => ({ ...p, currency: e.target.value as Currency }))}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-400"
            >
              <option value="PLN">PLN</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700">Data startu</label>
            <input
              type="date"
              value={draft.startDate}
              onChange={(e) => setDraft((p) => ({ ...p, startDate: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700">Cykl</label>
            <select
              value={draft.billingCycle ?? "monthly"}
              onChange={(e) => {
                const v = e.target.value as BillingCycle;
                setDraft((p) => ({ ...p, billingCycle: v, cycleDays: v === "custom" ? (p.cycleDays ?? 30) : undefined }));
              }}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-400"
            >
              <option value="monthly">Miesięczny</option>
              <option value="yearly">Roczny</option>
              <option value="custom">Niestandardowy</option>
            </select>
          </div>

          {draft.billingCycle === "custom" ? (
            <div>
              <label className="text-xs font-bold text-zinc-700">Cycle Days</label>
              <input
                value={String(draft.cycleDays ?? "")}
                onChange={(e) => setDraft((p) => ({ ...p, cycleDays: Number(e.target.value) }))}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-400"
                placeholder="np. 14"
              />
            </div>
          ) : (
            <div />
          )}

          <div>
            <label className="text-xs font-bold text-zinc-700">Kategoria</label>
            <input
              value={draft.category ?? ""}
              onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-400"
              placeholder="np. Streaming / Narzędzia / Szkoła"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700">Użycie</label>
            <select
              value={draft.usage ?? "unknown"}
              onChange={(e) => setDraft((p) => ({ ...p, usage: e.target.value as any }))}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-400"
            >
              <option value="unknown">Nie wiem</option>
              <option value="often">Często</option>
              <option value="rare">Rzadko</option>
              <option value="unused">Nie używam</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex select-none items-center gap-2 text-sm font-semibold text-zinc-900">
              <input
                type="checkbox"
                checked={draft.subscribed}
                onChange={(e) => setDraft((p) => ({ ...p, subscribed: e.target.checked }))}
                className="h-4 w-4 rounded border-zinc-300"
              />
              Aktywna subskrypcja
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-bold text-zinc-700">Notatki (opcjonalnie)</label>
            <textarea
              value={draft.notes ?? ""}
              onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))}
              className="mt-1 min-h-[90px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-400"
              placeholder="np. plan rodzinny, płatność kartą X, itp."
            />
          </div>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={deleteConfirm.open}
        title="Potwierdź usunięcie"
        onClose={() => setDeleteConfirm({ open: false, id: null })}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteConfirm({ open: false, id: null })}
              className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50"
            >
              Anuluj
            </button>
            <button
              type="button"
              onClick={doDelete}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
            >
              Usuń
            </button>
          </div>
        }
      >
        <p className="text-sm font-semibold text-zinc-800">
          Usunięcie przeniesie rekord do „kosza” z opcją cofnięcia przez kilka sekund.
        </p>
      </Modal>

      {/* Import modal */}
      <Modal
        open={importModal.open}
        title="Import subskrypcji"
        onClose={() => setImportModal({ open: false, incoming: [], dupAgainstExisting: [], report: [] })}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setImportModal({ open: false, incoming: [], dupAgainstExisting: [], report: [] })}
              className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50"
            >
              Anuluj
            </button>

            <button
              type="button"
              onClick={importAutoMergeDuplicates}
              className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50"
            >
              Auto-merge duplikaty
            </button>

            <button
              type="button"
              onClick={importMerge}
              className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50"
            >
              Scal po ID
            </button>

            <button
              type="button"
              onClick={importReplace}
              className="rounded-xl bg-black px-4 py-2 text-sm font-bold text-white hover:bg-zinc-800"
            >
              Zastąp listę
            </button>
          </div>
        }
      >
        <p className="text-sm font-semibold text-zinc-900">
          Wczytano <span className="font-bold">{importModal.incoming.length}</span> rekordów.
        </p>

        {importModal.dupAgainstExisting.length ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-950">
            Wykryto możliwe duplikaty względem istniejącej listy:{" "}
            <span className="font-bold">{importModal.dupAgainstExisting.length}</span>.
            Najlepsza opcja: <span className="font-bold">Auto-merge duplikaty</span>.
          </div>
        ) : null}

        {importModal.report.length ? (
          <div className="mt-3 rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-200">
            <div className="text-xs font-bold text-zinc-800">Raport</div>
            <div className="mt-2 max-h-40 overflow-auto space-y-1 text-xs font-semibold text-zinc-800">
              {importModal.report.map((r, i) => <div key={i}>• {r}</div>)}
            </div>
          </div>
        ) : null}

        <p className="mt-3 text-sm font-semibold text-zinc-800">
          „Scal po ID” nadpisze rekordy o tych samych ID. „Zastąp” ustawi listę dokładnie jak w pliku.
        </p>
      </Modal>

      {/* Duplicate modal (on add) */}
      <Modal
        open={dupeModal.open}
        title="Wykryto możliwy duplikat"
        onClose={() => setDupeModal({ open: false, candidate: null, matches: [], selectedId: null })}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={keepBothCandidate}
              className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50"
            >
              Zostaw obie
            </button>
            <button
              type="button"
              onClick={() => dupeModal.selectedId && confirmMergeCandidateIntoExisting(dupeModal.selectedId)}
              className="rounded-xl bg-black px-4 py-2 text-sm font-bold text-white hover:bg-zinc-800"
            >
              Scal z wybraną
            </button>
          </div>
        }
      >
        <div className="text-sm font-semibold text-zinc-800">
          Nowa subskrypcja wygląda podobnie do istniejącej (nazwa + cena + waluta). Wybierz: scalić czy zostawić obie.
        </div>

        <div className="mt-4 rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-200">
          <div className="text-xs font-bold text-zinc-800">Nowa</div>
          <div className="mt-1 text-sm font-bold text-zinc-950">{dupeModal.candidate?.name}</div>
          <div className="text-xs font-semibold text-zinc-700">
            {dupeModal.candidate?.price} {dupeModal.candidate?.currency}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {dupeModal.matches.map((m) => (
            <label key={m.id} className="flex cursor-pointer items-center justify-between rounded-xl bg-white px-3 py-2 ring-1 ring-zinc-200">
              <div>
                <div className="text-sm font-bold text-zinc-950">{m.name}</div>
                <div className="text-xs font-semibold text-zinc-700">{m.price} {m.currency}</div>
              </div>
              <input
                type="radio"
                name="dupePick"
                checked={dupeModal.selectedId === m.id}
                onChange={() => setDupeModal((p) => ({ ...p, selectedId: m.id }))}
              />
            </label>
          ))}
        </div>
      </Modal>

      {/* Profiles modal */}
      <Modal
        open={profilesModal}
        title="Profile (Ja / Rodzina / Firma)"
        onClose={() => setProfilesModal(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setProfilesModal(false)}
              className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50"
            >
              Zamknij
            </button>
          </div>
        }
      >
        <div className="text-sm font-semibold text-zinc-800">
          Profile rozdzielają dane w localStorage (subskrypcje, budżet, historia płatności).
        </div>

        <div className="mt-4 space-y-2">
          {profiles.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-zinc-50 px-3 py-2 ring-1 ring-zinc-200">
              <div className="min-w-[200px]">
                <div className="text-sm font-bold text-zinc-950">{p.name}</div>
                <div className="text-xs font-semibold text-zinc-700">ID: {p.id}</div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => switchProfile(p.id)}
                  className={classNames(
                    "rounded-xl px-4 py-2 text-sm font-bold ring-1",
                    p.id === profileId
                      ? "bg-black text-white ring-black"
                      : "bg-white text-zinc-900 ring-zinc-200 hover:bg-zinc-50"
                  )}
                >
                  {p.id === profileId ? "Aktywny" : "Przełącz"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const name = prompt("Nowa nazwa profilu:", p.name);
                    if (!name) return;
                    const next = profiles.map((x) => (x.id === p.id ? renameProfile(x, name) : x));
                    setProfiles(next);
                    saveProfiles(next);
                  }}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50"
                >
                  Zmień nazwę
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            const name = prompt("Nazwa nowego profilu:", "Rodzina");
            if (!name) return;
            const p = addProfile(name);
            const next = [...profiles, p];
            setProfiles(next);
            saveProfiles(next);
            setToast("Dodano nowy profil. Możesz go teraz przełączyć.");
          }}
          className="mt-4 rounded-xl bg-black px-4 py-2 text-sm font-bold text-white hover:bg-zinc-800"
        >
          + Dodaj profil
        </button>
      </Modal>

      {/* Undo toast */}
      {undo ? (
        <div className="fixed bottom-4 left-1/2 z-50 w-[min(720px,calc(100%-2rem))] -translate-x-1/2 rounded-2xl bg-black px-4 py-3 text-white shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-bold">Usunięto: {undo.item.name}</div>
              <div className="text-xs text-white/70">Możesz cofnąć przez chwilę.</div>
            </div>
            <button
              type="button"
              onClick={undoDelete}
              className="shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-bold text-black hover:bg-zinc-100"
            >
              Cofnij
            </button>
          </div>
        </div>
      ) : null}

      {/* Toast */}
      {toast ? (
        <div className="fixed top-4 left-1/2 z-50 w-[min(720px,calc(100%-2rem))] -translate-x-1/2 rounded-2xl bg-zinc-900 px-4 py-3 text-white shadow-xl">
          <div className="text-sm font-bold">{toast}</div>
        </div>
      ) : null}
    </main>
  );
}
