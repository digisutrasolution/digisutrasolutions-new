import { z } from "zod";
import { db } from "@/lib/db";

/**
 * SMTP configuration, stored in SiteSetting["smtp"] and edited in the admin.
 *
 * The password is WRITE-ONLY, the same contract the payments settings use:
 * the GET endpoint returns `hasPassword` instead of the value, and a blank
 * password on PUT means "keep the stored one". That way the secret is never
 * sent to a browser, never lands in a React payload, and cannot be read back
 * by anyone who gets a session.
 */

export const SmtpSchema = z.object({
  enabled: z.boolean().default(false),
  host: z.string().trim().max(200).default(""),
  port: z.coerce.number().int().min(1).max(65535).default(587),
  /** true = implicit TLS (465). false = STARTTLS upgrade (587/25). */
  secure: z.boolean().default(false),
  user: z.string().trim().max(200).default(""),
  password: z.string().max(400).default(""),
  fromName: z.string().trim().max(120).default("DigiSutra Solutions"),
  fromEmail: z.string().trim().max(200).default(""),
});

export type SmtpSettings = z.infer<typeof SmtpSchema>;

export const DEFAULT_SMTP: SmtpSettings = {
  enabled: false,
  host: "",
  port: 587,
  secure: false,
  user: "",
  password: "",
  fromName: "DigiSutra Solutions",
  fromEmail: "",
};

export const SMTP_KEY = "smtp";

export async function getSmtp(): Promise<SmtpSettings> {
  try {
    const row = await db.siteSetting.findUnique({ where: { key: SMTP_KEY } });
    const parsed = SmtpSchema.safeParse(row?.value);
    if (parsed.success) return parsed.data;
  } catch {
    /* DB down — fall back to disabled so callers degrade quietly */
  }
  return DEFAULT_SMTP;
}

/** Safe shape for the admin UI: the password becomes a boolean. */
export function maskSmtp(s: SmtpSettings) {
  const { password, ...rest } = s;
  return { ...rest, hasPassword: password.length > 0 };
}

/** Configured enough to actually send? */
export function smtpReady(s: SmtpSettings): boolean {
  return (
    s.enabled &&
    s.host.length > 0 &&
    s.fromEmail.length > 0 &&
    // Some relays allow anonymous submission, so a user without a password is
    // only invalid when a user IS set.
    (s.user.length === 0 || s.password.length > 0)
  );
}

/** One-line reason the settings can't send yet, for the admin UI. */
export function smtpBlocker(s: SmtpSettings): string | null {
  if (!s.enabled) return "SMTP is turned off.";
  if (!s.host) return "Host is required.";
  if (!s.fromEmail) return "From address is required.";
  if (s.user && !s.password) return "Password is required for this username.";
  return null;
}
