import "server-only";
import type { OtpConfig } from "@/lib/otp-config";

export type SmsResult = { ok: true; via: "http" } | { ok: false; error: string };

/** Fill an SMS-platform URL template. Secrets (user/password) come from env,
    everything else from the admin config. Values are URL-encoded. */
function buildUrl(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(to|text|otp|sender|dlt|user|password)\}/g, (_, k: string) =>
    encodeURIComponent(vars[k] ?? ""),
  );
}

/**
 * Send an SMS through the agency's own platform. Phase 1 supports the HTTP
 * transport (one request to their send URL). SMPP is captured in config but
 * intentionally returns a clear error until the Phase-2 persistent sender
 * worker lands, so behaviour is never silently wrong.
 */
export async function sendSms(
  input: { to: string; text: string; otp?: string },
  cfg: OtpConfig,
): Promise<SmsResult> {
  if (!cfg.sms.enabled) return { ok: false, error: "SMS channel is disabled." };

  if (cfg.sms.transport === "smpp") {
    return { ok: false, error: "SMPP transport is not enabled yet (Phase 2). Switch to HTTP." };
  }

  const { url, method, senderId, dltTemplateId } = cfg.sms.http;
  if (!url) return { ok: false, error: "No SMS HTTP URL configured." };

  const vars = {
    to: input.to.replace(/[^\d+]/g, ""),
    text: input.text,
    otp: input.otp ?? "",
    sender: senderId,
    dlt: dltTemplateId,
    user: process.env.SMS_HTTP_USER ?? "",
    password: process.env.SMS_HTTP_PASSWORD ?? "",
  };

  try {
    const finalUrl = buildUrl(url, vars);
    const res = await fetch(finalUrl, {
      method,
      signal: AbortSignal.timeout(20_000),
      ...(method === "POST" ? { headers: { "Content-Type": "application/x-www-form-urlencoded" } } : {}),
    });
    const bodyText = (await res.text().catch(() => "")).slice(0, 300);
    if (!res.ok) return { ok: false, error: `SMS gateway HTTP ${res.status}${bodyText ? ` — ${bodyText}` : ""}` };
    // Many Indian gateways return 200 with an error keyword in the body.
    if (/invalid|error|failed|insufficient|not\s*sent/i.test(bodyText)) {
      return { ok: false, error: `SMS gateway rejected: ${bodyText}` };
    }
    return { ok: true, via: "http" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error sending SMS." };
  }
}
