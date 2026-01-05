import { NextResponse } from "next/server";
import { verifySessionToken } from "@/app/lib/session";
import type { Plan } from "@/app/lib/billingStore";

export const runtime = "nodejs";

async function getUsername(req: Request): Promise<string | null> {
  const secret = process.env.SUBMANAGER_SECRET || "dev-secret-change-me";
  const cookie = req.headers.get("cookie") ?? "";
  const m = cookie.match(/submanager_session=([^;]+)/);
  const token = m?.[1] ? decodeURIComponent(m[1]) : null;
  return token ? await verifySessionToken(token, secret) : null;
}

function getBaseUrl(req: Request) {
  const env = process.env.NEXT_PUBLIC_BASE_URL;
  if (env) return env.replace(/\/+$/, "");
  const u = new URL(req.url);
  // w dev: http://localhost:3000
  return `${u.protocol}//${u.host}`;
}

export async function POST(req: Request) {
  const username = await getUsername(req);
  if (!username) return NextResponse.json({ ok: false, error: "Brak sesji." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const plan = String(body?.plan ?? "") as Plan;
  if (!plan || !["basic", "pro", "elite"].includes(plan)) {
    return NextResponse.json({ ok: false, error: "Nieprawidłowy plan." }, { status: 400 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceId =
    plan === "basic"
      ? process.env.STRIPE_PRICE_BASIC
      : plan === "pro"
        ? process.env.STRIPE_PRICE_PRO
        : process.env.STRIPE_PRICE_ELITE;

  if (!stripeKey || !priceId) {
    return NextResponse.json({ ok: false, error: "Stripe nie jest skonfigurowany. Ustaw STRIPE_SECRET_KEY i STRIPE_PRICE_* w .env.local." }, { status: 400 });
  }

  const base = getBaseUrl(req);
  const success = `${base}/subskrypcja?success=1&plan=${encodeURIComponent(plan)}`;
  const cancel = `${base}/subskrypcja?canceled=1`;

  // Tworzymy Checkout Session (subskrypcja cykliczna). Ceny ustawiasz w Stripe Dashboard.
  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("success_url", success);
  params.set("cancel_url", cancel);
  params.set("line_items[0][price]", priceId);
  params.set("line_items[0][quantity]", "1");
  params.set("client_reference_id", username);

  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const json = await r.json().catch(() => null);
  if (!r.ok) {
    return NextResponse.json({ ok: false, error: "Błąd Stripe", details: json }, { status: 502 });
  }

  return NextResponse.json({ ok: true, url: (json as any)?.url ?? null });
}
