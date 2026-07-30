import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { logLeadActivity } from "@/lib/crm-server";
import { scoreAndSave } from "@/lib/scoring-server";
import { canSeeAllLeads } from "@/lib/auth/rbac";

type Params = { params: Promise<{ id: string }> };

const Schema = z.object({
  type: z.enum(["note", "call", "email", "whatsapp", "meeting"]).default("note"),
  message: z.string().trim().min(1).max(2000),
});

/** Append a note or a logged interaction (call/email/etc.) to a lead. */
export async function POST(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("leads.manage");
  if (error) return error;
  const { id } = await params;

  const lead = await db.lead.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, assignedToId: true },
  });
  if (!lead || (!canSeeAllLeads(user) && lead.assignedToId !== user.id)) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid input." }, { status: 400 });
  }

  await logLeadActivity({
    leadId: id,
    userId: user.id,
    userName: user.name,
    type: parsed.data.type,
    message: parsed.data.message,
  });
  // Engagement can change the score (e.g. crossing the "3+ activities" signal).
  void scoreAndSave(id);
  return NextResponse.json({ ok: true });
}
