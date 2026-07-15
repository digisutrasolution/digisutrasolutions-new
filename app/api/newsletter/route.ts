import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const SubscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  source: z.string().trim().max(60).optional(),
  hp: z.string().optional(),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const { allowed, retryAfterSec } = rateLimit(`newsletter:${ip}`, 5, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: `Too many attempts. Try again in ${retryAfterSec}s.` },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = SubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid email address." },
      { status: 400 },
    );
  }
  // Honeypot: pretend success so bots learn nothing.
  if (parsed.data.hp) return NextResponse.json({ ok: true });

  await db.newsletterSubscriber.upsert({
    where: { email: parsed.data.email },
    create: { email: parsed.data.email, source: parsed.data.source ?? "blog" },
    update: {},
  });

  return NextResponse.json({ ok: true });
}
