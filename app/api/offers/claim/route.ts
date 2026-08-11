import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { activePromotion } from "@/lib/promotions-server";
import { AttributionSchema, resolveAttribution } from "@/lib/attribution-server";
import { deriveChannel, sourceFromChannel } from "@/lib/lead-channel";

/* Claim an offer from the public /offers page.

   The tokenised /offer/<token> route already does this for someone we emailed:
   the link names the lead, so a code can be issued against it with one click.
   A public visitor is nobody yet, so the trade is explicit — leave a name and
   a number, get a code. That is the whole point of running a public offer, and
   it is why this endpoint creates a Lead rather than issuing an anonymous code
   nobody could ever attribute or follow up.

   Like the token route, this does NOT verify that anyone followed anything —
   no platform exposes that — and the page says so rather than implying a check
   that is not happening. */

const Body = z.object({
  promotionId: z.string().min(1).max(40),
  name: z.string().trim().min(2).max(80),
  whatsapp: z.string().trim().min(6).max(24),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  /* Honeypot, same field name as /api/contact. Deliberately permissive: a
     `.max(0)` here would make the SCHEMA reject a filled honeypot, which both
     kills the quiet handling below and hands a bot a 400 that tells it exactly
     which field tripped. Accept it, then decide. */
  hp: z.string().max(200).optional(),
  attribution: AttributionSchema.optional(),
});

function code(prefix: string): string {
  // Unambiguous alphabet: no O/0, no I/1 — these get read aloud over a call.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (const b of randomBytes(6)) out += alphabet[b % alphabet.length];
  return `${prefix}-${out}`;
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`offer-claim:${ip}`, 6, 10 * 60 * 1000).allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Try again shortly." },
      { status: 429 },
    );
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Please check your name and phone number." },
      { status: 400 },
    );
  }
  const d = parsed.data;

  /* Honeypot: answer 200 with a plausible-looking failure rather than 400.
     A bot that learns which field trips the filter just stops filling it in. */
  if (d.hp) {
    return NextResponse.json({ ok: false, error: "Could not issue a code." }, { status: 200 });
  }

  const promo = await activePromotion(d.promotionId);
  if (!promo) {
    return NextResponse.json({ ok: false, error: "This offer has ended." }, { status: 409 });
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

  const whatsapp = d.whatsapp.replace(/[\s-]/g, "");
  const attribution = await resolveAttribution(d.attribution);

  /* Find-or-create by phone. Someone who already enquired should not become a
     second Lead just because they came back for an offer — and matching on the
     number is what the rest of the CRM already uses for duplicate detection. */
  let lead = await db.lead
    .findFirst({
      where: { whatsapp, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    })
    .catch(() => null);

  if (!lead) {
    lead = await db.lead
      .create({
        data: {
          ...attribution,
          name: d.name,
          whatsapp,
          email: d.email || null,
          // Paid traffic still wins over the intake label — see /api/leads.
          source: sourceFromChannel(deriveChannel(attribution)) ?? "WEBSITE",
          notes: `Claimed offer: ${promo.name}`,
          ipHash: createHash("sha256").update(ip).digest("hex").slice(0, 24),
        },
        select: { id: true },
      })
      .catch(() => null);
  }

  if (!lead) {
    return NextResponse.json(
      { ok: false, error: "Could not issue a code. Please try again." },
      { status: 500 },
    );
  }

  /* Already claimed this offer? Return the SAME code rather than an error.
     Someone reloading, or claiming again from their phone, wants their code
     back — and the unique constraint means there is only ever one. */
  const existing = await db.promotionClaim
    .findUnique({
      where: { promotionId_leadId: { promotionId: promo.id, leadId: lead.id } },
      select: { code: true },
    })
    .catch(() => null);
  if (existing) {
    return NextResponse.json({ ok: true, code: existing.code, repeat: true });
  }

  // Retry on the astronomically unlikely code collision rather than 500.
  let created: { code: string } | null = null;
  for (let attempt = 0; attempt < 5 && !created; attempt += 1) {
    created = await db.promotionClaim
      .create({
        data: { promotionId: promo.id, leadId: lead.id, code: code(promo.codePrefix) },
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

  return NextResponse.json({ ok: true, code: created.code }, { status: 201 });
}
