import { NextResponse } from "next/server";

async function sendViaWebhook(webhookUrl: string, message: string) {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content: message }),
  });
  if (!res.ok) throw new Error(`Webhook HTTP ${res.status}`);
}

async function sendViaBot(token: string, channelId: string, message: string) {
  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bot ${token}`,
    },
    body: JSON.stringify({ content: message }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Bot API HTTP ${res.status}${txt ? `: ${txt}` : ""}`);
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { message?: string } | null;
  const message = String(body?.message ?? "").trim();
  if (!message) return NextResponse.json({ ok: false, error: "Brak treści wiadomości." }, { status: 400 });

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_CHANNEL_ID;

  try {
    if (webhookUrl) {
      await sendViaWebhook(webhookUrl, message);
      return NextResponse.json({ ok: true, mode: "webhook" });
    }

    if (botToken && channelId) {
      await sendViaBot(botToken, channelId, message);
      return NextResponse.json({ ok: true, mode: "bot" });
    }

    return NextResponse.json(
      {
        ok: false,
        error:
          "Brak konfiguracji Discord. Ustaw DISCORD_WEBHOOK_URL albo DISCORD_BOT_TOKEN + DISCORD_CHANNEL_ID w .env.local.",
      },
      { status: 400 }
    );
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || "Błąd wysyłki.") }, { status: 500 });
  }
}
