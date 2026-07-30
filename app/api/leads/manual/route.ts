import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import { logLeadActivity } from "@/lib/crm-server";
import { onLeadCreated } from "@/lib/lead-intake";
import { LEAD_PRIORITIES, LEAD_SOURCES } from "@/lib/crm";

const opt = (max: number) => z.string().trim().max(max).optional();

const Schema = z.object({
  name: z.string().trim().min(2).max(120),
  whatsapp: z.string().trim().min(4).max(30),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  company: opt(120),
  website: opt(300),
  country: opt(80),
  city: opt(80),
  budget: opt(60),
  message: opt(4000),
  source: z.enum(LEAD_SOURCES).default("MANUAL"),
  priority: z.enum(LEAD_PRIORITIES).default("MEDIUM"),
  assignedToId: z.string().optional(),
});

/** Admin: manually create a lead. */
export async function POST(req: Request) {
  const { user, error } = await requirePermission("leads.manage");
  if (error) return error;

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const d = parsed.data;

  if (d.assignedToId) {
    const u = await db.user.findUnique({ where: { id: d.assignedToId }, select: { id: true } });
    if (!u) {
      return NextResponse.json({ ok: false, error: "Assignee not found." }, { status: 400 });
    }
  }

  const lead = await db.lead.create({
    data: {
      name: d.name,
      whatsapp: d.whatsapp.replace(/[\s-]/g, ""),
      email: d.email || null,
      company: d.company || null,
      website: d.website || null,
      country: d.country || null,
      city: d.city || null,
      budget: d.budget || null,
      message: d.message || null,
      source: d.source,
      priority: d.priority,
      assignedToId: d.assignedToId || null,
    },
  });

  void logLeadActivity({
    leadId: lead.id,
    userId: user.id,
    userName: user.name,
    type: "created",
    message: `Lead created manually by ${user.name}`,
  });

  // Auto-route (no-op if the admin already picked an owner) and score it.
  onLeadCreated(lead);

  audit({
    userId: user.id,
    action: "lead.create",
    entity: "lead",
    entityId: lead.id,
    meta: { source: d.source },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
}
