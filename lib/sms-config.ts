/* Client-safe SMS gateway config — the shared connection to the agency's own
   SMS platform, used by BOTH OTP and lead messaging. Lives in Settings (next
   to SMTP) because it's infrastructure, not a feature setting. Credentials
   (SMS_HTTP_USER / SMS_HTTP_PASSWORD, SMS_SMPP_PASSWORD) stay in .env and are
   never stored here. */

export type SmsTransport = "http" | "smpp";

export type SmsGatewayConfig = {
  transport: SmsTransport;
  /** HTTP send. URL may contain {to} {text} {otp} {sender} {dlt} {user}
      {password}; user/password come from env. */
  http: {
    url: string;
    method: "GET" | "POST";
    senderId: string;
    dltTemplateId: string;
  };
  /** SMPP — Phase 2. Captured so admins can pre-configure. */
  smpp: {
    host: string;
    port: number;
    systemId: string;
    bindType: "transceiver" | "transmitter";
    senderId: string;
    dltTemplateId: string;
  };
};

export const DEFAULT_SMS_GATEWAY: SmsGatewayConfig = {
  transport: "http",
  http: { url: "", method: "GET", senderId: "", dltTemplateId: "" },
  smpp: { host: "", port: 2775, systemId: "", bindType: "transceiver", senderId: "", dltTemplateId: "" },
};

const clampInt = (v: unknown, lo: number, hi: number, fallback: number) => {
  const n = typeof v === "number" ? Math.round(v) : parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
};
const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);

export function mergeSmsGateway(raw: unknown): SmsGatewayConfig {
  const d = DEFAULT_SMS_GATEWAY;
  const r = (raw ?? {}) as Record<string, unknown>;
  const http = (r.http ?? {}) as Record<string, unknown>;
  const smpp = (r.smpp ?? {}) as Record<string, unknown>;
  return {
    transport: str(r.transport, d.transport) === "smpp" ? "smpp" : "http",
    http: {
      url: str(http.url, "").slice(0, 1000),
      method: str(http.method, "GET").toUpperCase() === "POST" ? "POST" : "GET",
      senderId: str(http.senderId, "").slice(0, 40),
      dltTemplateId: str(http.dltTemplateId, "").slice(0, 60),
    },
    smpp: {
      host: str(smpp.host, "").slice(0, 200),
      port: clampInt(smpp.port, 1, 65535, d.smpp.port),
      systemId: str(smpp.systemId, "").slice(0, 80),
      bindType: str(smpp.bindType, "transceiver") === "transmitter" ? "transmitter" : "transceiver",
      senderId: str(smpp.senderId, "").slice(0, 40),
      dltTemplateId: str(smpp.dltTemplateId, "").slice(0, 60),
    },
  };
}
