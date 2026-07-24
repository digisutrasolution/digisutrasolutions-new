import "server-only";
import nodemailer from "nodemailer";
import { getSmtp, smtpReady, type SmtpSettings } from "@/lib/smtp";

/**
 * Builds a nodemailer transport from stored settings.
 *
 * Kept apart from lib/smtp.ts because that module is imported by the admin
 * UI's server components for its types; this one pulls in nodemailer and must
 * never reach a client bundle.
 */
export function transportFor(s: SmtpSettings) {
  return nodemailer.createTransport({
    host: s.host,
    port: s.port,
    secure: s.secure,
    ...(s.user ? { auth: { user: s.user, pass: s.password } } : {}),
    // A hung relay must not hold a request open indefinitely.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
}

export function fromHeader(s: SmtpSettings): string {
  return s.fromName ? `${s.fromName} <${s.fromEmail}>` : s.fromEmail;
}

/**
 * Opens a connection and authenticates without sending anything — this is
 * what the admin "Test connection" button calls. Returns a human-readable
 * reason rather than throwing, so the UI can show it verbatim.
 */
export async function verifySmtp(
  s: SmtpSettings,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await transportFor(s).verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: explain(err) };
  }
}

export async function sendViaSmtp(input: {
  to: string[];
  subject: string;
  text: string;
  html?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const s = await getSmtp();
  if (!smtpReady(s)) return { ok: false, error: "SMTP is not configured." };
  try {
    await transportFor(s).sendMail({
      from: fromHeader(s),
      to: input.to.join(", "),
      subject: input.subject,
      text: input.text,
      ...(input.html ? { html: input.html } : {}),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: explain(err) };
  }
}

/** Turns nodemailer's error codes into something an admin can act on. */
function explain(err: unknown): string {
  const e = err as { code?: string; responseCode?: number; message?: string };
  switch (e?.code) {
    case "EAUTH":
      return "Authentication failed — check the username and password.";
    case "ECONNECTION":
    case "ESOCKET":
      return "Could not connect — check the host, port and whether TLS should be on.";
    case "ETIMEDOUT":
    case "ECONNREFUSED":
      return "Connection timed out or was refused — the host or port may be wrong, or the server firewall may block outbound SMTP.";
    case "EDNS":
      return "Host not found — check the server address.";
    default:
      return e?.message ?? "Unknown SMTP error.";
  }
}
