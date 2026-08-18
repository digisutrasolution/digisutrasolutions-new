import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { logLeadActivity } from "@/lib/crm-server";
import { notifyUsers, notifyRoles } from "@/lib/notify";
import { clientIp } from "@/lib/rate-limit";
import { formatMoney, quoteRef } from "@/lib/quotations";

type Params = { params: Promise<{ token: string }> };

const Schema = z.object({
  decision: z.enum(["accept", "reject"]),
  /* Required for an acceptance. It costs three seconds and turns "someone
     clicked a button" into a record of who accepted — which is the whole
     difference when a quotation is the commercial agreement. */
  name: z.string().trim().max(120).default(""),
  note: z.string().trim().max(1000).default(""),
});

/**
 * The client's own accept/reject, from /q/<token>.
 *
 * Public by design — the token is the authentication, exactly as it is for the
 * page itself. Everything that makes that safe is below, and the order matters.
 */
export async function POST(req: Request, { params }: Params) {
  const { token } = await params;
  // Bound before it reaches the DB; tokens are ~22 chars.
  if (!token || token.length > 64) return notFound();

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const quote = await db.quotation
    .findUnique({ where: { publicToken: token } })
    .catch(() => null);
  if (!quote) return notFound();

  /* Was this quotation actually emailed? Same test the page uses — a CommLog
     row is written only after a provider accepted the message — so a token
     that leaked from a send that never completed decides nothing. */
  const sends = await db.commLog.count({ where: { quotationId: quote.id } });
  if (sends === 0) return notFound();

  if (quote.status !== "SENT") {
    /* ACCEPTED is terminal in TRANSITIONS and stays that way: nobody holding
       the link gets to reverse a decision, including the person who made it.
       A mistake is fixed by talking to us, which is the correct escalation. */
    const already =
      quote.status === "ACCEPTED"
        ? "This quotation has already been accepted."
        : quote.status === "REJECTED"
          ? "This quotation has already been declined."
          : "This quotation is no longer open for a decision.";
    return NextResponse.json({ ok: false, error: already }, { status: 409 });
  }

  /* Expired quotations cannot be accepted. Letting a client click Approve on a
     price that lapsed leaves them believing it is locked in and us choosing
     between honouring a stale figure and an awkward conversation. */
  if (quote.validUntil && quote.validUntil < new Date()) {
    return NextResponse.json(
      {
        ok: false,
        error: "This quotation has expired. Ask us for an updated one and we will send it straight over.",
      },
      { status: 409 },
    );
  }

  if (d.decision === "accept" && !d.name) {
    return NextResponse.json(
      { ok: false, error: "Please type your name to confirm." },
      { status: 400 },
    );
  }

  const accepted = d.decision === "accept";
  const ip = clientIp(req);
  await db.quotation.update({
    where: { id: quote.id },
    data: {
      status: accepted ? "ACCEPTED" : "REJECTED",
      clientDecisionBy: d.name || quote.clientName,
      clientDecisionAt: new Date(),
      clientDecisionNote: d.note || null,
      clientDecisionIp: ip,
    },
  });

  /* A decision sitting in the database is no better than an unread email.
     notifyUsers writes the bell notification AND emails, so whoever raised the
     quotation hears about it without watching the admin. */
  const ref = quoteRef(quote.number, quote.version);
  const money = formatMoney(quote.total, quote.currency);
  const title = accepted
    ? `Quotation ${ref} accepted — ${money}`
    : `Quotation ${ref} declined`;
  const body = [
    `${d.name || quote.clientName} (${quote.clientName})`,
    d.note ? `“${d.note}”` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const link = `/admin/quotations/${quote.id}`;

  if (quote.createdById) {
    void notifyUsers([quote.createdById], { type: "quotation.decision", title, body, link });
  }
  void notifyRoles(["SUPER_ADMIN"], { type: "quotation.decision", title, body, link }, {
    // The raiser already got their own copy above.
    excludeUserId: quote.createdById ?? undefined,
  });

  if (quote.leadId) {
    void logLeadActivity({
      leadId: quote.leadId,
      userName: d.name || quote.clientName,
      type: "quotation",
      message: accepted
        ? `Client accepted quotation ${ref} (${money})`
        : `Client declined quotation ${ref}${d.note ? `: ${d.note}` : ""}`,
    });
  }

  audit({
    action: accepted ? "quotation.client.accept" : "quotation.client.reject",
    entity: "quotation",
    entityId: quote.id,
    meta: { ref, by: d.name || quote.clientName, note: d.note || undefined },
    ip,
  });

  return NextResponse.json({ ok: true, status: accepted ? "ACCEPTED" : "REJECTED" });
}

/* Neutral for an unknown, unsent or overlong token — a probe should not be
   able to tell the difference between them. */
const notFound = () =>
  NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
