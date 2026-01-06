import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, getSessionCookieName } from "@/app/lib/session";
import { changePassword } from "@/app/lib/users";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;
    const session = verifySession(token);

    if (!session) return NextResponse.json({ error: "Brak sesji." }, { status: 401 });

    const body = (await req.json()) as { oldPassword?: string; newPassword?: string };
    const oldPassword = String(body.oldPassword ?? "");
    const newPassword = String(body.newPassword ?? "");

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Nowe hasło musi mieć min. 6 znaków." }, { status: 400 });
    }

    await changePassword(session.email, oldPassword, newPassword);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (String(e?.message) === "BAD_OLD_PASSWORD") {
      return NextResponse.json({ error: "Stare hasło jest niepoprawne." }, { status: 400 });
    }
    return NextResponse.json({ error: "Błąd serwera przy zmianie hasła." }, { status: 500 });
  }
}
