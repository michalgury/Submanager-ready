import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/app/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const secret = process.env.SUBMANAGER_SECRET || "dev-secret-change-me";

  const cookieStore = await cookies(); // <-- TO NAPRAWIA BŁĄD
  const token = cookieStore.get("submanager_session")?.value ?? null;

  const username = token ? await verifySessionToken(token, secret) : null;
  if (!username) return NextResponse.json({ ok: false }, { status: 401 });

  return NextResponse.json({ ok: true, username });
}
