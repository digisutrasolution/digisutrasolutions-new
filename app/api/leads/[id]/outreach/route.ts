import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { canSeeAllLeads } from "@/lib/auth/rbac";
import { getOrCreateOutreachLink } from "@/lib/outreach-server";
import { logLeadActivity } from "@/lib/crm-server";
import { absUrl } from "@/lib/site";

/** Mint (or return) the outreach link for a lead so it can be sent. */
const BodySchema = z.object({ kind: z.enum(["REVIEW", "PROMO"]) });

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("leads.manage");
  if (error) return error;
  const { id } = await params;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const lead = await db.lead.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, assignedToId: true, name: true },
  });
  if (!lead) {
    return NextResponse.json({ ok: false, error: "Lead not found." }, { status: 404 });
  }
  // Same scoping as the rest of the CRM: a scoped user only acts on their own.
  if (!canSeeAllLeads(user) && lead.assignedToId !== user.id) {
    return NextResponse.json({ ok: false, error: "Not your lead." }, { status: 403 });
  }

  const target = await getOrCreateOutreachLink(lead.id, parsed.data.kind, user.id);

  void logLeadActivity({
    leadId: lead.id,
    type: "note",
    message:
      parsed.data.kind === "REVIEW"
        ? "Review request link generated"
        : "Offer link generated",
    userName: user.name,
  });

  // Absolute, because the whole point is to paste it into a message.
  return NextResponse.json({ ok: true, url: absUrl(target.url), token: target.token });
}
