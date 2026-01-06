import { NextResponse } from "next/server";
import { verifyUser } from "@/app/lib/usersStore";
import { createSessionToken } from "@/app/lib/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.SUBMANAGER_SECRET || "dev-secret-change-me";

  try {
    const body = (await req.json()) as { username?: string; login?: string; password?: string };

    // przyjmujemy "username" albo "login"
    const username = String(body.username ?? body.login ?? "").trim();
    const password = String(body.password ?? "");

    if (!/^[a-zA-Z0-9_-]{3,32}$/.test(username)) {
      return NextResponse.json(
        { ok: false, error: "Login musi mieć 3-32 znaki: litery/cyfry/_/-" },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json({ ok: false, error: "Hasło jest wymagane." }, { status: 400 });
    }

    const ok = await verifyUser(username, password);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "Nieprawidłowy login lub hasło." }, { status: 401 });
    }

    const token = await createSessionToken(username, secret);

    const out = NextResponse.json({ ok: true });

    // SESSION COOKIE: brak maxAge/expires => znika po zamknięciu przeglądarki
    out.cookies.set("submanager_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return out;
  } catch {
    return NextResponse.json({ ok: false, error: "Błąd logowania." }, { status: 500 });
  }
}
