import "server-only";
import { db } from "@/lib/db";
import { mergeChannelsConfig, type ChannelsConfig } from "@/lib/channels-config";
import { getOtpConfig } from "@/lib/otp-config-server";
import { smsGatewayReady } from "@/lib/sms";
import { telegramBotReady } from "@/lib/telegram";

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

/** What each channel can actually do right now: SMS needs the shared gateway
    (from Verification) configured; Telegram alerts need a bot token in .env. */
export async function channelsAvailability(cfg: ChannelsConfig): Promise<{
  smsGateway: boolean;
  smsSend: boolean;
  telegramBot: boolean;
  telegramAlerts: boolean;
  telegramDeepLink: boolean;
}> {
  const gateway = smsGatewayReady(await getOtpConfig());
  const bot = telegramBotReady();
  return {
    smsGateway: gateway,
    smsSend: cfg.sms.enabled && gateway,
    telegramBot: bot,
    telegramAlerts: cfg.telegram.alerts && bot && !!cfg.telegram.chatId,
    telegramDeepLink: cfg.telegram.deepLink,
  };
}
