/* Client-safe config for outbound contact channels beyond email/WhatsApp.
   SMS reuses the gateway configured under Verification (otp-config.sms.http);
   this only toggles whether messaging + Telegram are on. No secrets here —
   the SMS creds and the Telegram bot token stay in .env. */

export type ChannelsConfig = {
  /** Show the Email tab in the lead composer. Does NOT affect transactional
      email (OTP, notifications, auto-replies) — those always send. */
  email: { enabled: boolean };
  /** Show the WhatsApp tab in the lead composer (wa.me deep link, no gateway). */
  whatsapp: { enabled: boolean };
  sms: {
    /** Allow sending SMS to leads from the composer (uses the shared gateway). */
    enabled: boolean;
  };
  telegram: {
    /** Show the lead-facing Telegram deep-link composer. */
    deepLink: boolean;
    /** Send internal new-lead alerts to the team chat via the bot. */
    alerts: boolean;
    /** Target chat id for team alerts (non-secret). */
    chatId: string;
  };
};

export const DEFAULT_CHANNELS_CONFIG: ChannelsConfig = {
  // Email + WhatsApp default ON so behaviour is unchanged until an admin
  // deliberately hides one.
  email: { enabled: true },
  whatsapp: { enabled: true },
  sms: { enabled: false },
  telegram: { deepLink: false, alerts: false, chatId: "" },
};

const bool = (v: unknown, f: boolean) => (typeof v === "boolean" ? v : f);
const str = (v: unknown, f = "") => (typeof v === "string" ? v : f);

export function mergeChannelsConfig(raw: unknown): ChannelsConfig {
  const d = DEFAULT_CHANNELS_CONFIG;
  const r = (raw ?? {}) as Record<string, unknown>;
  const e = (r.email ?? {}) as Record<string, unknown>;
  const w = (r.whatsapp ?? {}) as Record<string, unknown>;
  const s = (r.sms ?? {}) as Record<string, unknown>;
  const t = (r.telegram ?? {}) as Record<string, unknown>;
  return {
    email: { enabled: bool(e.enabled, d.email.enabled) },
    whatsapp: { enabled: bool(w.enabled, d.whatsapp.enabled) },
    sms: { enabled: bool(s.enabled, d.sms.enabled) },
    telegram: {
      deepLink: bool(t.deepLink, d.telegram.deepLink),
      alerts: bool(t.alerts, d.telegram.alerts),
      chatId: str(t.chatId, d.telegram.chatId).slice(0, 60),
    },
  };
}
