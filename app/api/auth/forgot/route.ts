import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { createResetToken, purgeExpiredResetTokens, RESET_TTL_MIN } from "@/lib/auth/reset";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { absUrl } from "@/lib/site";
import { getSmtp, smtpReady } from "@/lib/smtp";

export const runtime = "nodejs";

const ForgotSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
});

/* One reply for every outcome. Whether the address has an account, is
   deactivated, or does not exist, the caller is told the same thing —
   otherwise this endpoint becomes a way to discover who has CMS access. */
const GENERIC =
  "If that email has an account, a reset link is on its way. It expires in " +
  `${RESET_TTL_MIN} minutes.`;

export async function POST(req: Request) {
  const ip = clientIp(req);

  // Two limits: per IP stops a scan, per email stops mailbox flooding.
  const byIp = rateLimit(`forgot-ip:${ip}`, 10, 15 * 60_000);
  if (!byIp.allowed) {
    return NextResponse.json(
      { ok: false, error: `Too many attempts — try again in ${byIp.retryAfterSec}s.` },
      { status: 429 },
    );
  }

  const parsed = ForgotSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const { email } = parsed.data;

  const byEmail = rateLimit(`forgot-email:${email}`, 5, 15 * 60_000);
  if (!byEmail.allowed) {
    return NextResponse.json(
      { ok: false, error: `Too many attempts for that address — try again in ${byEmail.retryAfterSec}s.` },
      { status: 429 },
    );
  }

  /* Refusing when no provider is configured leaks nothing about accounts —
     the answer is identical for every address — and it beats telling someone
     to check an inbox that will never receive anything. */
  const hasProvider = smtpReady(await getSmtp()) || Boolean(process.env.RESEND_API_KEY);
  if (!hasProvider) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Password reset is unavailable because outgoing email is not configured. Ask an administrator to set up SMTP.",
      },
      { status: 503 },
    );
  }

  void purgeExpiredResetTokens();

  const user = await db.user.findUnique({ where: { email } });

  // Deactivated accounts must not be reachable this way either.
  if (user && user.isActive) {
    const token = await createResetToken(user.id, ip);
    const link = absUrl(`/admin/reset?token=${encodeURIComponent(token)}`);

    const sent = await sendEmail({
      to: [user.email],
      subject: "Reset your DigiSutra CMS password",
      text: [
        `Hello ${user.name},`,
        "",
        "Use the link below to set a new password. It works once and expires in " +
          `${RESET_TTL_MIN} minutes.`,
        "",
        link,
        "",
        "If you did not request this, ignore this email — your password stays as it is.",
      ].join("\n"),
    });

    // Surfaced in the server log only; the caller still gets GENERIC.
    if (!sent.ok) console.error("password reset email failed:", sent.error);

    audit({
      userId: user.id,
      action: "auth.reset.requested",
      entity: "user",
      entityId: user.id,
      meta: { delivered: sent.ok, via: sent.via },
      ip,
    });
  }

  return NextResponse.json({ ok: true, message: GENERIC });
}
