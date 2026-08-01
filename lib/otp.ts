import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { logLeadActivity } from "@/lib/crm-server";
import { getOtpConfig, otpAvailability } from "@/lib/otp-config-server";
import { resolveChannel, type OtpConfig } from "@/lib/otp-config";

const SECRET =
  process.env.OTP_SECRET || process.env.AUTH_SECRET || process.env.JWT_SECRET || "digisutra-otp-pepper";
/** Score added to a lead when it verifies its contact. */
const VERIFIED_BONUS = 15;

function genCode(len: number): string {
  let s = "";
  for (let i = 0; i < len; i++) s += randomInt(0, 10).toString();
  return s;
}

function hashCode(channel: string, target: string, code: string): string {
  return createHmac("sha256", SECRET).update(`${channel}:${target.toLowerCase()}:${code}`).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  const head = user.slice(0, 2);
  return `${head}${"*".repeat(Math.max(1, user.length - 2))}@${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.length < 4) return phone;
  return `${phone.startsWith("+") ? "+" : ""}${"*".repeat(Math.max(2, digits.length - 4))}${digits.slice(-4)}`;
}

export type IssueInput = {
  email?: string | null;
  phone?: string | null;
  leadId?: string | null;
  ipHash?: string | null;
  /** Only honoured when channelPolicy = "choose". */
  chosen?: "email" | "sms";
};

export type IssueChallenge = {
  id: string;
  channel: "email" | "sms";
  target: string;
  length: number;
  resendSeconds: number;
  ttlMinutes: number;
};

export type IssueResult = { sent: true; challenge: IssueChallenge } | { sent: false; reason: string };

/** Create + deliver a one-time code. Returns a masked handle the client can
    show; never returns the code itself. */
export async function issueChallenge(input: IssueInput, cfgIn?: OtpConfig): Promise<IssueResult> {
  const cfg = cfgIn ?? (await getOtpConfig());
  if (!cfg.enabled) return { sent: false, reason: "Verification is turned off." };

  const avail = await otpAvailability(cfg);
  const email = (input.email ?? "").trim();
  const phone = (input.phone ?? "").trim();
  // Only offer a channel that is both present AND currently deliverable.
  const channel = resolveChannel(
    cfg,
    { email: !!email && avail.email, phone: !!phone && avail.sms },
    input.chosen,
  );
  if (!channel) {
    return { sent: false, reason: avail.smsReason || avail.emailReason || "No verification channel available." };
  }
  const target = channel === "email" ? email : phone;

  const code = genCode(cfg.codeLength);
  const row = await db.otpChallenge.create({
    data: {
      channel,
      target,
      codeHash: hashCode(channel, target, code),
      leadId: input.leadId ?? null,
      maxAttempts: cfg.maxAttempts,
      expiresAt: new Date(Date.now() + cfg.ttlMinutes * 60_000),
      ipHash: input.ipHash ?? null,
    },
  });

  const sent = await deliver(channel, target, code, cfg);
  if (!sent.ok) {
    await db.otpChallenge.delete({ where: { id: row.id } }).catch(() => {});
    return { sent: false, reason: sent.error };
  }

  return {
    sent: true,
    challenge: {
      id: row.id,
      channel,
      target: channel === "email" ? maskEmail(target) : maskPhone(target),
      length: cfg.codeLength,
      resendSeconds: cfg.resendSeconds,
      ttlMinutes: cfg.ttlMinutes,
    },
  };
}

async function deliver(
  channel: "email" | "sms",
  target: string,
  code: string,
  cfg: OtpConfig,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (channel === "sms") {
    const text = cfg.smsTemplate.replace(/\{otp\}/g, code).replace(/\{mins\}/g, String(cfg.ttlMinutes));
    const res = await sendSms({ to: target, text, otp: code }, cfg);
    return res.ok ? { ok: true } : { ok: false, error: res.error };
  }
  const mail = otpEmail(code, cfg.ttlMinutes, cfg.email.fromName);
  const res = await sendEmail({ to: [target], subject: mail.subject, text: mail.text, html: mail.html });
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

export type VerifyResult =
  | { ok: true; channel: "email" | "sms" }
  | { ok: false; error: string; remaining?: number };

/** Check a submitted code. On success stamps the linked lead as verified. */
export async function verifyChallenge(id: string, code: string): Promise<VerifyResult> {
  const row = await db.otpChallenge.findUnique({ where: { id } });
  if (!row) return { ok: false, error: "This code has expired — please request a new one." };
  if (row.consumedAt) return { ok: false, error: "This code was already used." };
  if (row.expiresAt.getTime() < Date.now()) return { ok: false, error: "This code has expired — please request a new one." };
  if (row.attempts >= row.maxAttempts) return { ok: false, error: "Too many attempts — please request a new code." };

  const clean = (code ?? "").replace(/\D/g, "");
  const matches = safeEqualHex(row.codeHash, hashCode(row.channel, row.target, clean));
  if (!matches) {
    const updated = await db.otpChallenge.update({
      where: { id },
      data: { attempts: { increment: 1 } },
      select: { attempts: true, maxAttempts: true },
    });
    const remaining = Math.max(0, updated.maxAttempts - updated.attempts);
    return {
      ok: false,
      error: remaining > 0 ? `Incorrect code — ${remaining} attempt${remaining === 1 ? "" : "s"} left.` : "Too many attempts — please request a new code.",
      remaining,
    };
  }

  await db.otpChallenge.update({ where: { id }, data: { consumedAt: new Date() } });
  const channel = row.channel === "sms" ? "sms" : "email";
  if (row.leadId) await stampLead(row.leadId, channel);
  return { ok: true, channel };
}

async function stampLead(leadId: string, channel: "email" | "sms"): Promise<void> {
  const lead = await db.lead.findUnique({ where: { id: leadId }, select: { score: true, tags: true } });
  if (!lead) return;
  const tags = lead.tags.includes("Verified") ? lead.tags : [...lead.tags, "Verified"];
  const score = Math.min(100, (lead.score ?? 55) + VERIFIED_BONUS);
  await db.lead
    .update({
      where: { id: leadId },
      data: {
        verified: true,
        verifiedAt: new Date(),
        verifiedVia: channel,
        ...(channel === "email" ? { emailVerified: true } : { phoneVerified: true }),
        tags,
        score,
      },
    })
    .catch(() => {});
  void logLeadActivity({
    leadId,
    type: "verified",
    message: `Contact verified by ${channel === "email" ? "email" : "SMS"}`,
  });
}

/** Branded transactional email carrying the code. */
function otpEmail(code: string, mins: number, fromName: string): { subject: string; text: string; html: string } {
  const subject = `${code} is your ${fromName} verification code`;
  const text = `Your verification code is ${code}. It is valid for ${mins} minutes. If you didn't request this, you can ignore this email.`;
  const html = `<!doctype html><html><body style="margin:0;background:#faf7f3;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1c1917">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:440px;background:#fff;border:1px solid #eee7e1;border-radius:16px;overflow:hidden">
        <tr><td style="padding:28px 30px 8px">
          <div style="font-weight:800;font-size:16px;letter-spacing:-.02em">${escapeHtml(fromName)}</div>
        </td></tr>
        <tr><td style="padding:8px 30px 0">
          <h1 style="margin:0;font-size:20px;font-weight:800">Verify your email</h1>
          <p style="margin:8px 0 0;font-size:14px;color:#78716c;line-height:1.6">Enter this code to confirm it's really you. It expires in ${mins} minutes.</p>
        </td></tr>
        <tr><td style="padding:22px 30px">
          <div style="background:#fff1e9;border:1px solid #ffd9c2;border-radius:12px;padding:18px;text-align:center;font-size:34px;font-weight:800;letter-spacing:10px;color:#9a3412">${escapeHtml(code)}</div>
        </td></tr>
        <tr><td style="padding:0 30px 28px">
          <p style="margin:0;font-size:12px;color:#a8a29e;line-height:1.6">Didn't request this? You can safely ignore this email — no changes will be made.</p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:11px;color:#c2bcb6">© ${escapeHtml(fromName)}</p>
    </td></tr>
  </table></body></html>`;
  return { subject, text, html };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
}
