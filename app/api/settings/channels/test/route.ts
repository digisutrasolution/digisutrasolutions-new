import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { sendTelegram } from "@/lib/telegram";

/** Send a test message to the configured Telegram team chat so the owner can
    confirm the bot token + chat id before relying on alerts. */
export async function POST(req: Request) {
  const { error } = await requirePermission("settings.manage");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const chatId = typeof body?.chatId === "string" ? body.chatId.trim() : "";
  if (!chatId) return NextResponse.json({ ok: false, error: "Enter a chat id first." }, { status: 400 });

  const res = await sendTelegram(chatId, "✅ <b>DigiSutra</b> — Telegram alerts are working. You'll get new-lead notifications here.");
  return res.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ ok: false, error: res.error });
}
