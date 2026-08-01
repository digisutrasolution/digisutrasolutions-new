import "server-only";
import { db } from "@/lib/db";
import { mergeSmsGateway, type SmsGatewayConfig } from "@/lib/sms-config";

const KEY = "sms-gateway";
const TTL_MS = 15_000;
let cached: SmsGatewayConfig | null = null;
let loadedAt = 0;

export async function getSmsGateway(force = false): Promise<SmsGatewayConfig> {
  if (!force && cached && Date.now() - loadedAt < TTL_MS) return cached;
  try {
    const row = await db.siteSetting.findUnique({ where: { key: KEY } });
    if (row?.value) {
      cached = mergeSmsGateway(row.value);
    } else {
      // Migration: the gateway used to live inside the OTP config. If it was
      // configured there, seed from it so nothing is lost on the move.
      const old = await db.siteSetting.findUnique({ where: { key: "otp" } });
      const oldSms = (old?.value as { sms?: unknown } | null)?.sms ?? null;
      cached = mergeSmsGateway(oldSms);
    }
  } catch {
    cached = mergeSmsGateway(null);
  }
  loadedAt = Date.now();
  return cached;
}

export async function saveSmsGateway(raw: unknown): Promise<SmsGatewayConfig> {
  const clean = mergeSmsGateway(raw);
  await db.siteSetting.upsert({ where: { key: KEY }, create: { key: KEY, value: clean }, update: { value: clean } });
  cached = clean;
  loadedAt = Date.now();
  return clean;
}
