import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import { logLeadActivity } from "@/lib/crm-server";
import { canSeeAllLeads } from "@/lib/auth/rbac";
import { FOLLOWUP_TYPES, followUpTypeLabel } from "@/lib/crm";

type Params = { params: Promise<{ id: string }> };

const Schema = z.object({
  type: z.enum(FOLLOWUP_TYPES).default("task"),
  title: z.string().trim().min(1).max(160),
  notes: z.string().trim().max(2000).optional(),
  dueAt: z.string().datetime(),
  ownerId: z.string().nullable().optional(),
});

const dueLabel = (d: Date) =>
  d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

/** Schedule a follow-up on a lead. Defaults the owner to the lead's current
    assignee (or the acting user) so a next-touch always has someone on it. */
export async function POST(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("leads.manage");
  if (error) return error;
  const { id } = await params;

  const lead = await db.lead.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, name: true, assignedToId: true },
  });
  if (!lead || (!canSeeAllLeads(user) && lead.assignedToId !== user.id)) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const d = parsed.data;

  // Owner: explicit → validate; otherwise fall back to the lead's assignee,
  // then to the person creating it.
  let ownerId = d.ownerId === undefined ? lead.assignedToId : d.ownerId;
  if (d.ownerId) {
    const u = await db.user.findUnique({ where: { id: d.ownerId }, select: { id: true } });
    if (!u) {
      return NextResponse.json({ ok: false, error: "Owner not found." }, { status: 400 });
    }
  }
  if (!ownerId) ownerId = user.id;

  const dueAt = new Date(d.dueAt);
  const followUp = await db.followUp.create({
    data: {
      leadId: id,
      ownerId,
      type: d.type,
      title: d.title,
      notes: d.notes ?? null,
      dueAt,
      createdById: user.id,
      createdByName: user.name,
    },
    include: { owner: { select: { id: true, name: true } } },
  });

  void logLeadActivity({
    leadId: id,
    userId: user.id,
    userName: user.name,
    type: "followup",
    message: `${followUpTypeLabel(d.type)} follow-up scheduled — ${d.title} (${dueLabel(dueAt)})`,
  });

  audit({
    userId: user.id,
    action: "followup.create",
    entity: "followup",
    entityId: followUp.id,
    meta: { leadId: id, dueAt: dueAt.toISOString() },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true, followUp });
}
