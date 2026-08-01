import "server-only";
import { db } from "@/lib/db";
import { mergeChannelsConfig, type ChannelsConfig } from "@/lib/channels-config";
import { getSmsGateway } from "@/lib/sms-config-server";
import { smsGatewayReady } from "@/lib/sms";
import { telegramBotReady } from "@/lib/telegram";
import { getSmtp, smtpReady } from "@/lib/smtp";

const KEY = "channels";
const TTL_MS = 15_000;
let cached: ChannelsConfig | null = null;
let loadedAt = 0;

export async function getChannelsConfig(force = false): Promise<ChannelsConfig> {
  if (!force && cached && Date.now() - loadedAt < TTL_MS) return cached;
  try {
    const row = await db.siteSetting.findUnique({ where: { key: KEY } });
    cached = mergeChannelsConfig(row?.value);
  } catch {
    cached = mergeChannelsConfig(null);
  }
  loadedAt = Date.now();
  return cached;
}

export async function saveChannelsConfig(raw: unknown): Promise<ChannelsConfig> {
  const clean = mergeChannelsConfig(raw);
  await db.siteSetting.upsert({ where: { key: KEY }, create: { key: KEY, value: clean }, update: { value: clean } });
  cached = clean;
  loadedAt = Date.now();
  return clean;
}

/** What each channel can actually do right now. Email needs a provider (the
    same SMTP/Resend used everywhere); SMS needs the shared gateway (from
    Verification); Telegram alerts need a bot token in .env. */
export async function channelsAvailability(cfg: ChannelsConfig): Promise<{
  emailProvider: boolean;
  emailSend: boolean;
  whatsappSend: boolean;
  smsGateway: boolean;
  smsSend: boolean;
  telegramBot: boolean;
  telegramAlerts: boolean;
  telegramDeepLink: boolean;
}> {
  const [gateway, emailProvider] = await Promise.all([
    getSmsGateway().then(smsGatewayReady),
    getSmtp().then(smtpReady),
  ]);
  const hasEmail = emailProvider || !!process.env.RESEND_API_KEY;
  const bot = telegramBotReady();
  return {
    emailProvider: hasEmail,
    emailSend: cfg.email.enabled && hasEmail,
    whatsappSend: cfg.whatsapp.enabled, // wa.me deep link — no provider needed
    smsGateway: gateway,
    smsSend: cfg.sms.enabled && gateway,
    telegramBot: bot,
    telegramAlerts: cfg.telegram.alerts && bot && !!cfg.telegram.chatId,
    telegramDeepLink: cfg.telegram.deepLink,
  };
}
