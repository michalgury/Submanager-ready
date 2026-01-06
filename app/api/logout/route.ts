import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  const out = NextResponse.json({ ok: true });

  // usuń cookie sesji (ważne: path "/")
  out.cookies.set("submanager_session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  return out;
}
