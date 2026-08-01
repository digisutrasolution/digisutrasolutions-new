import "server-only";
import { db } from "@/lib/db";
import { mergeOtpConfig, type OtpConfig } from "@/lib/otp-config";
import { getSmtp, smtpReady } from "@/lib/smtp";
import { getSmsGateway } from "@/lib/sms-config-server";
import { smsGatewayReady } from "@/lib/sms";

const KEY = "otp";
const TTL_MS = 15_000;
let cached: OtpConfig | null = null;
let loadedAt = 0;

export async function getOtpConfig(force = false): Promise<OtpConfig> {
  if (!force && cached && Date.now() - loadedAt < TTL_MS) return cached;
  try {
    const row = await db.siteSetting.findUnique({ where: { key: KEY } });
    cached = mergeOtpConfig(row?.value);
  } catch {
    cached = mergeOtpConfig(null);
  }
  loadedAt = Date.now();
  return cached;
}

export async function saveOtpConfig(raw: unknown): Promise<OtpConfig> {
  const clean = mergeOtpConfig(raw);
  await db.siteSetting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: clean },
    update: { value: clean },
  });
  cached = clean;
  loadedAt = Date.now();
  return clean;
}

/** Whether each channel can actually deliver right now — config enabled AND
    the underlying transport/credentials present. Never returns a secret. */
export async function otpAvailability(
  cfg: OtpConfig,
): Promise<{ email: boolean; sms: boolean; emailReason?: string; smsReason?: string }> {
  const emailProvider = smtpReady(await getSmtp()) || !!process.env.RESEND_API_KEY;
  const email = cfg.email.enabled && emailProvider;

  let sms = false;
  let smsReason: string | undefined;
  if (!cfg.sms.enabled) {
    smsReason = "SMS channel is turned off.";
  } else if (!smsGatewayReady(await getSmsGateway())) {
    smsReason = "No SMS gateway configured (Settings → SMS).";
  } else {
    sms = true;
  }

  return {
    email,
    sms,
    emailReason: email ? undefined : cfg.email.enabled ? "No email provider — configure SMTP in Settings." : "Email channel is turned off.",
    smsReason,
  };
}
