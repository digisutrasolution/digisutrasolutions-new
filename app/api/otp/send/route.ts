import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { issueChallenge } from "@/lib/otp";

/** Public: issue (or resend) a verification code to a lead's email/phone. */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const { allowed, retryAfterSec } = rateLimit(`otp-send:${ip}`, 6, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, reason: `Too many code requests. Try again in ${retryAfterSec}s.` },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const leadId = typeof body?.leadId === "string" ? body.leadId : null;
  const email = typeof body?.email === "string" ? body.email.trim().slice(0, 200) : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim().slice(0, 40) : "";
  const chosen = body?.chosen === "email" || body?.chosen === "sms" ? body.chosen : undefined;

  if (!email && !phone) {
    return NextResponse.json({ ok: false, reason: "No contact to verify." }, { status: 400 });
  }

  const result = await issueChallenge({
    leadId,
    email,
    phone,
    chosen,
    ipHash: createHash("sha256").update(ip).digest("hex").slice(0, 24),
  });

  if (!result.sent) return NextResponse.json({ ok: false, reason: result.reason });
  return NextResponse.json({ ok: true, challenge: result.challenge });
}
