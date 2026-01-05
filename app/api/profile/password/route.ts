import { NextResponse } from "next/server";
import { verifySessionToken } from "@/app/lib/session";
import { changePassword } from "@/app/lib/usersStore";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.SUBMANAGER_SECRET || "dev-secret-change-me";
  const cookie = req.headers.get("cookie") ?? "";
  const m = cookie.match(/submanager_session=([^;]+)/);
  const token = m?.[1] ? decodeURIComponent(m[1]) : null;

  const username = token ? await verifySessionToken(token, secret) : null;
  if (!username) return NextResponse.json({ ok: false, error: "Brak sesji." }, { status: 401 });

  try {
    const body = (await req.json()) as { oldPassword?: string; newPassword?: string };
    const oldPassword = String(body.oldPassword ?? "");
    const newPassword = String(body.newPassword ?? "");

    const res = await changePassword(username, oldPassword, newPassword);
    if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Błąd zmiany hasła." }, { status: 500 });
  }
}
