import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

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

// Prosty store w pamięci (resetuje się po restarcie dev-servera)
const db: Record<string, Subscription[]> = {};

function getEmail(req: NextRequest) {
  return req.cookies.get("submanager_email")?.value || null;
}

export async function GET(req: NextRequest) {
  const email = getEmail(req);
  if (!email) return NextResponse.json({ error: "Brak sesji." }, { status: 401 });

  return NextResponse.json({ items: db[email] ?? [] });
}

export async function POST(req: NextRequest) {
  const email = getEmail(req);
  if (!email) return NextResponse.json({ error: "Brak sesji." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const startDate = String(body?.startDate ?? "").trim();
  const endDate = String(body?.endDate ?? "").trim();
  const price = Number(body?.price);
  const currency = (String(body?.currency ?? "PLN") as Currency) || "PLN";

  if (!name || !startDate || !endDate || !Number.isFinite(price)) {
    return NextResponse.json({ error: "Nieprawidłowe dane." }, { status: 400 });
  }

  const item: Subscription = {
    id: crypto.randomUUID(),
    name,
    startDate,
    endDate,
    price,
    currency,
    subscribed: false,
  };

  db[email] = db[email] ?? [];
  db[email].push(item);

  return NextResponse.json({ item }, { status: 201 });
}
