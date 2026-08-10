import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { resolveOutreachToken } from "@/lib/outreach-server";
import { activePromotion } from "@/lib/promotions-server";

/* Claim a discount code from an offer link.

   This does NOT verify that anyone followed anything — no platform exposes
   that. The honest framing, which the page also uses, is that clicking
   "I've followed" is a statement of intent, and what it buys us is a code
   tied to one lead that can be counted and marked redeemed. */

type Params = { params: Promise<{ token: string }> };

function code(prefix: string): string {
  // Unambiguous alphabet: no O/0, no I/1 — these get read aloud over a call.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `${prefix}-${out}`;
}

export async function POST(req: Request, { params }: Params) {
  const ip = clientIp(req);
  if (!rateLimit(`claim:${ip}`, 8, 10 * 60 * 1000).allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Try again shortly." },
      { status: 429 },
    );
  }

  const { token } = await params;
  const link = await resolveOutreachToken(token, "PROMO");
  if (!link) {
    return NextResponse.json({ ok: false, error: "This link is no longer valid." }, { status: 404 });
  }

  const promo = await activePromotion(link.promotionId);
  if (!promo) {
    return NextResponse.json(
      { ok: false, error: "This offer has ended." },
      { status: 409 },
    );
  }

  /* Already claimed? Return the SAME code rather than an error. Someone
     reloading the page or opening the link on their phone wants their code,
     not a scolding — and the unique constraint means there is only ever one. */
  const existing = await db.promotionClaim.findUnique({
    where: { promotionId_leadId: { promotionId: promo.id, leadId: link.leadId } },
    select: { code: true },
  });
  if (existing) {
    return NextResponse.json({ ok: true, code: existing.code, repeat: true });
  }

  if (promo.maxClaims !== null) {
    const used = await db.promotionClaim.count({ where: { promotionId: promo.id } });
    if (used >= promo.maxClaims) {
      return NextResponse.json(
        { ok: false, error: "All the codes for this offer have gone." },
        { status: 409 },
      );
    }
  }

  // Retry on the astronomically unlikely code collision rather than 500.
  let created: { code: string } | null = null;
  for (let attempt = 0; attempt < 5 && !created; attempt += 1) {
    created = await db.promotionClaim
      .create({
        data: { promotionId: promo.id, leadId: link.leadId, code: code(promo.codePrefix) },
        select: { code: true },
      })
      .catch(() => null);
  }
  if (!created) {
    return NextResponse.json(
      { ok: false, error: "Could not issue a code. Please try again." },
      { status: 500 },
    );
  }

  await db.outreachLink
    .update({ where: { id: link.id }, data: { completedAt: new Date() } })
    .catch(() => {});

  return NextResponse.json({ ok: true, code: created.code }, { status: 201 });
}
