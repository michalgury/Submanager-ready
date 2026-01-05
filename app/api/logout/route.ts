import { NextResponse } from "next/server";

export async function POST() {
  const out = NextResponse.json({ ok: true });
  out.cookies.set("submanager_session", "", { path: "/", maxAge: 0 });
  return out;
}
