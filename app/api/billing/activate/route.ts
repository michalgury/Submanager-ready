import { NextResponse } from "next/server";
import { verifySessionToken } from "@/app/lib/session";
import { setBilling, type Plan } from "@/app/lib/billingStore";

export const runtime = "nodejs";

async function getUsername(req: Request): Promise<string | null> {
  const secret = process.env.SUBMANAGER_SECRET || "dev-secret-change-me";
  const cookie = req.headers.get("cookie") ?? "";
  const m = cookie.match(/submanager_session=([^;]+)/);
  const token = m?.[1] ? decodeURIComponent(m[1]) : null;
  return token ? await verifySessionToken(token, secret) : null;
}

export async function POST(req: Request) {
  const username = await getUsername(req);
  if (!username) return NextResponse.json({ ok: false, error: "Brak sesji." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const plan = String(body?.plan ?? "") as Plan;
  if (!plan || !["basic", "pro", "elite"].includes(plan)) {
    return NextResponse.json({ ok: false, error: "Nieprawidłowy plan." }, { status: 400 });
  }

  // Tryb DEV: aktywacja bez bramki płatności.
  // Produkcja: to powinno być wykonywane przez webhook po udanej płatności (Stripe/PayU/...)
  const billing = await setBilling(username, plan, true);

  return NextResponse.json({ ok: true, billing });
}
