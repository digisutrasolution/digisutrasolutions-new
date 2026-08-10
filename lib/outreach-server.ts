import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import type { OutreachKind } from "@prisma/client";

/* Tokenised outreach links.

   The token is the whole authentication: 128 bits of randomness, scoped to one
   lead and one purpose. A client should never have to sign in to leave a
   review or claim an offer, and a guessable id would let anyone submit a
   testimonial in someone else's name.

   Rows rather than signed strings because the value is in knowing who was
   asked, who opened it and who followed through — a stateless token can tell
   you none of that. */

/** ~22 url-safe chars. Long enough that guessing is not a strategy. */
function newToken(): string {
  return randomBytes(16).toString("base64url");
}

export type OutreachTarget = {
  token: string;
  url: string;
};

const PATH: Record<OutreachKind, string> = {
  REVIEW: "/r",
  PROMO: "/offer",
};

/**
 * Get the live link for a lead + purpose, making one if there is not already
 * an unexpired one. Reusing it means re-sending a reminder points at the same
 * page, so "opened" and "completed" stay meaningful instead of resetting.
 */
export async function getOrCreateOutreachLink(
  leadId: string,
  kind: OutreachKind,
  createdById?: string,
): Promise<OutreachTarget> {
  const now = new Date();
  const existing = await db.outreachLink.findFirst({
    where: {
      leadId,
      kind,
      completedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
  });
  const link =
    existing ??
    (await db.outreachLink.create({
      data: {
        token: newToken(),
        kind,
        leadId,
        createdById: createdById ?? null,
        // Long enough not to expire mid-follow-up, short enough that a
        // forwarded link does not stay live forever.
        expiresAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
      },
    }));

  return { token: link.token, url: `${PATH[kind]}/${link.token}` };
}

/** Resolve a token to its link + lead, or null when it is unknown, expired or
    already used. Callers must treat null as "show a neutral page", never as
    an error worth detailing — a probe should learn nothing. */
export async function resolveOutreachToken(token: string, kind: OutreachKind) {
  if (!token || token.length > 64) return null;
  const link = await db.outreachLink
    .findUnique({
      where: { token },
      include: { lead: { select: { id: true, name: true, company: true, deletedAt: true } } },
    })
    .catch(() => null);

  if (!link || link.kind !== kind) return null;
  if (link.lead.deletedAt) return null;
  if (link.expiresAt && link.expiresAt <= new Date()) return null;
  return link;
}

/** Stamp the first open. Best-effort: a failed write must not stop the page. */
export async function markOpened(id: string): Promise<void> {
  await db.outreachLink
    .updateMany({ where: { id, openedAt: null }, data: { openedAt: new Date() } })
    .catch(() => {});
}
