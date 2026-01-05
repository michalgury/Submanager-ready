import { NextResponse } from "next/server";
import { verifySessionToken } from "@/app/lib/session";

export async function GET(req: Request) {
  const secret = process.env.SUBMANAGER_SECRET || "dev-secret-change-me";
  const cookie = req.headers.get("cookie") ?? "";
  const m = cookie.match(/submanager_session=([^;]+)/);
  const token = m?.[1] ? decodeURIComponent(m[1]) : null;

  const username = token ? await verifySessionToken(token, secret) : null;
  if (!username) return NextResponse.json({ ok: false }, { status: 401 });

  return NextResponse.json({ ok: true, username });
}
