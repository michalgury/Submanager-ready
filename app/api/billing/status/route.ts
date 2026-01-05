import { NextResponse } from "next/server";
import { verifySessionToken } from "@/app/lib/session";
import { getBilling } from "@/app/lib/billingStore";

export const runtime = "nodejs";

async function getUsername(req: Request): Promise<string | null> {
  const secret = process.env.SUBMANAGER_SECRET || "dev-secret-change-me";
  const cookie = req.headers.get("cookie") ?? "";
  const m = cookie.match(/submanager_session=([^;]+)/);
  const token = m?.[1] ? decodeURIComponent(m[1]) : null;
  return token ? await verifySessionToken(token, secret) : null;
}

export async function GET(req: Request) {
  const username = await getUsername(req);
  if (!username) return NextResponse.json({ ok: false }, { status: 401 });

  const billing = await getBilling(username);
  return NextResponse.json({ ok: true, plan: billing.plan, active: billing.active, since: billing.since ?? null });
}
