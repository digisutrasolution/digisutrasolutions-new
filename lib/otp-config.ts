/* Client-safe OTP / lead-verification config — shared by the admin settings
   UI and the server. No server imports. Secrets (SMTP password, SMS HTTP
   user/password) live in .env and are NEVER stored here; this holds only
   behaviour + non-secret endpoint details. */

export type OtpChannelPolicy = "auto" | "email" | "sms" | "choose";
export type SmsTransport = "http" | "smpp";

export type OtpConfig = {
  /** Master switch. Off = forms behave exactly as before (no verification). */
  enabled: boolean;
  /** auto = SMS when a phone is present, else email. */
  channelPolicy: OtpChannelPolicy;
  codeLength: number;
  ttlMinutes: number;
  maxAttempts: number;
  resendSeconds: number;
  /** {otp} and {mins} are substituted at send time. */
  smsTemplate: string;
  email: {
    enabled: boolean;
    fromName: string;
  };
  sms: {
    enabled: boolean;
    transport: SmsTransport;
    /** HTTP send. URL may contain {to} {text} {otp} {sender} {dlt} {user}
        {password}. user/password come from env, never stored here. */
    http: {
      url: string;
      method: "GET" | "POST";
      senderId: string;
      dltTemplateId: string;
    };
    /** SMPP — Phase 2. Fields captured now so admins can pre-configure. */
    smpp: {
      host: string;
      port: number;
      systemId: string;
      bindType: "transceiver" | "transmitter";
      senderId: string;
      dltTemplateId: string;
    };
  };
};

export const OTP_CHANNEL_POLICIES: { id: OtpChannelPolicy; label: string; hint: string }[] = [
  { id: "auto", label: "Auto", hint: "SMS when a phone is given, otherwise email" },
  { id: "email", label: "Email only", hint: "Always verify by email" },
  { id: "sms", label: "SMS only", hint: "Always verify by phone" },
  { id: "choose", label: "Let the lead choose", hint: "Show an SMS / Email toggle" },
];

export const DEFAULT_OTP_CONFIG: OtpConfig = {
  enabled: false,
  channelPolicy: "auto",
  codeLength: 6,
  ttlMinutes: 10,
  maxAttempts: 5,
  resendSeconds: 45,
  smsTemplate: "Your DigiSutra verification code is {otp}. It is valid for {mins} minutes.",
  email: { enabled: true, fromName: "DigiSutra Solutions" },
  sms: {
    enabled: false,
    transport: "http",
    http: { url: "", method: "GET", senderId: "", dltTemplateId: "" },
    smpp: { host: "", port: 2775, systemId: "", bindType: "transceiver", senderId: "", dltTemplateId: "" },
  },
};

const clampInt = (v: unknown, lo: number, hi: number, fallback: number) => {
  const n = typeof v === "number" ? Math.round(v) : parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
};
const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);

/** Merge stored/untrusted JSON onto defaults so every field is always present
    and within range. */
export function mergeOtpConfig(raw: unknown): OtpConfig {
  const d = DEFAULT_OTP_CONFIG;
  const r = (raw ?? {}) as Record<string, unknown>;
  const e = (r.email ?? {}) as Record<string, unknown>;
  const s = (r.sms ?? {}) as Record<string, unknown>;
  const http = (s.http ?? {}) as Record<string, unknown>;
  const smpp = (s.smpp ?? {}) as Record<string, unknown>;
  const policy = str(r.channelPolicy, d.channelPolicy);

  return {
    enabled: bool(r.enabled, d.enabled),
    channelPolicy: (["auto", "email", "sms", "choose"].includes(policy) ? policy : d.channelPolicy) as OtpChannelPolicy,
    codeLength: clampInt(r.codeLength, 4, 8, d.codeLength),
    ttlMinutes: clampInt(r.ttlMinutes, 1, 60, d.ttlMinutes),
    maxAttempts: clampInt(r.maxAttempts, 1, 10, d.maxAttempts),
    resendSeconds: clampInt(r.resendSeconds, 15, 300, d.resendSeconds),
    smsTemplate: str(r.smsTemplate, d.smsTemplate).slice(0, 300) || d.smsTemplate,
    email: {
      enabled: bool(e.enabled, d.email.enabled),
      fromName: str(e.fromName, d.email.fromName).slice(0, 80),
    },
    sms: {
      enabled: bool(s.enabled, d.sms.enabled),
      transport: (str(s.transport, d.sms.transport) === "smpp" ? "smpp" : "http") as SmsTransport,
      http: {
        url: str(http.url, "").slice(0, 1000),
        method: str(http.method, "GET").toUpperCase() === "POST" ? "POST" : "GET",
        senderId: str(http.senderId, "").slice(0, 40),
        dltTemplateId: str(http.dltTemplateId, "").slice(0, 60),
      },
      smpp: {
        host: str(smpp.host, "").slice(0, 200),
        port: clampInt(smpp.port, 1, 65535, d.sms.smpp.port),
        systemId: str(smpp.systemId, "").slice(0, 80),
        bindType: str(smpp.bindType, "transceiver") === "transmitter" ? "transmitter" : "transceiver",
        senderId: str(smpp.senderId, "").slice(0, 40),
        dltTemplateId: str(smpp.dltTemplateId, "").slice(0, 60),
      },
    },
  };
}

/** The channel that would be used for a given contact pair, per the policy.
    Returns null when verification can't run for this lead. */
export function resolveChannel(
  cfg: OtpConfig,
  has: { email: boolean; phone: boolean },
  chosen?: "email" | "sms",
): "email" | "sms" | null {
  const emailOk = cfg.email.enabled && has.email;
  const smsOk = cfg.sms.enabled && has.phone;
  if (cfg.channelPolicy === "choose" && chosen) {
    if (chosen === "email" && emailOk) return "email";
    if (chosen === "sms" && smsOk) return "sms";
  }
  if (cfg.channelPolicy === "email") return emailOk ? "email" : null;
  if (cfg.channelPolicy === "sms") return smsOk ? "sms" : null;
  // auto / choose-without-choice: prefer SMS when a phone exists, else email.
  if (smsOk) return "sms";
  if (emailOk) return "email";
  return null;
}
