import "server-only";

export type TelegramResult = { ok: true } | { ok: false; error: string };

/** Whether a bot token is present. The token is a secret and lives in .env
    (TELEGRAM_BOT_TOKEN); the target chat id is non-secret admin config. */
export function telegramBotReady(): boolean {
  return !!process.env.TELEGRAM_BOT_TOKEN;
}

/**
 * Send a message from the team's bot to a chat id. Used for internal
 * new-lead / assignment alerts to a team group — NOT for messaging leads
 * (Telegram bots can't cold-message a person; that's the deep-link path).
 */
export async function sendTelegram(chatId: string, text: string): Promise<TelegramResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, error: "No TELEGRAM_BOT_TOKEN set." };
  if (!chatId) return { ok: false, error: "No Telegram chat id configured." };
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body?.description ? `Telegram: ${body.description}` : `Telegram HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error sending Telegram." };
  }
}
