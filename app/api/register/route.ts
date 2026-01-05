import { NextResponse } from "next/server";
import { createUser } from "@/app/lib/usersStore";
import { createSessionToken } from "@/app/lib/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.SUBMANAGER_SECRET || "dev-secret-change-me";

  try {
    const body = (await req.json()) as { username?: string; password?: string };
    const username = String(body.username ?? "");
    const password = String(body.password ?? "");

    const res = await createUser(username, password);
    if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 400 });

    // po rejestracji logujemy od razu
    const token = await createSessionToken(username, secret);
    const out = NextResponse.json({ ok: true });
    out.cookies.set("submanager_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return out;
  } catch {
    return NextResponse.json({ ok: false, error: "Błąd rejestracji." }, { status: 500 });
  }
}
