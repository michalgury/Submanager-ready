import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type Currency = "PLN" | "EUR" | "USD";

type Subscription = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  price: number;
  currency: Currency;
  subscribed: boolean;
};

// MUSI być ten sam obiekt db co w route.ts.
// Najprościej: wynieś db do osobnego pliku (np. app/lib/subscriptionsDb.ts)
// ale na szybko wklejamy identyczny, bo w dev i tak jest jeden runtime procesu.
//
// Jeśli chcesz porządnie: powiedz, to zrobię wersję z osobnym plikiem shared.

declare global {
  // eslint-disable-next-line no-var
  var __sub_db: Record<string, Subscription[]> | undefined;
}
const db = globalThis.__sub_db ?? (globalThis.__sub_db = {});

function getEmail(req: NextRequest) {
  return req.cookies.get("submanager_email")?.value || null;
}

function findItem(email: string, id: string) {
  const list = db[email] ?? [];
  const idx = list.findIndex((x) => x.id === id);
  return { list, idx };
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  const email = getEmail(req);
  if (!email) return NextResponse.json({ error: "Brak sesji." }, { status: 401 });

  const id = ctx.params.id;
  const body = await req.json().catch(() => ({}));

  const { list, idx } = findItem(email, id);
  if (idx === -1) return NextResponse.json({ error: "Nie znaleziono." }, { status: 404 });

  const current = list[idx];

  const next: Subscription = {
    ...current,
    name: body.name !== undefined ? String(body.name).trim() : current.name,
    startDate: body.startDate !== undefined ? String(body.startDate).trim() : current.startDate,
    endDate: body.endDate !== undefined ? String(body.endDate).trim() : current.endDate,
    price: body.price !== undefined ? Number(body.price) : current.price,
    currency: body.currency !== undefined ? (String(body.currency) as Currency) : current.currency,
    subscribed: body.subscribed !== undefined ? Boolean(body.subscribed) : current.subscribed,
  };

  if (!next.name || !next.startDate || !next.endDate || !Number.isFinite(next.price)) {
    return NextResponse.json({ error: "Nieprawidłowe dane." }, { status: 400 });
  }

  list[idx] = next;
  db[email] = list;

  return NextResponse.json({ item: next });
}

export async function DELETE(req: NextRequest, ctx: { params: { id: string } }) {
  const email = getEmail(req);
  if (!email) return NextResponse.json({ error: "Brak sesji." }, { status: 401 });

  const id = ctx.params.id;

  const { list, idx } = findItem(email, id);
  if (idx === -1) return NextResponse.json({ error: "Nie znaleziono." }, { status: 404 });

  list.splice(idx, 1);
  db[email] = list;

  return NextResponse.json({ ok: true });
}
