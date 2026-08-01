import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { verifyChallenge } from "@/lib/otp";

/** Public: check a submitted code and stamp the lead verified on success. */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const { allowed, retryAfterSec } = rateLimit(`otp-verify:${ip}`, 12, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: `Too many attempts. Try again in ${retryAfterSec}s.` },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const code = typeof body?.code === "string" ? body.code : "";
  if (!id || !code) return NextResponse.json({ ok: false, error: "Enter the code." }, { status: 400 });

  const result = await verifyChallenge(id, code);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error, remaining: result.remaining });
  return NextResponse.json({ ok: true, channel: result.channel });
}
