import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import { LEAD_PRIORITIES, LEAD_SOURCES } from "@/lib/crm";

const strList = (max: number) =>
  z.array(z.string().trim().min(1).max(max)).max(40).default([]);

export const RuleSchema = z.object({
  name: z.string().trim().min(1).max(80),
  enabled: z.boolean().default(true),
  order: z.number().int().min(0).max(9999).default(0),
  sources: z.array(z.enum(LEAD_SOURCES)).max(LEAD_SOURCES.length).default([]),
  services: strList(80),
  countries: strList(80),
  states: strList(80),
  cities: strList(80),
  priorities: z.array(z.enum(LEAD_PRIORITIES)).max(LEAD_PRIORITIES.length).default([]),
  keyword: z.string().trim().max(120).nullable().default(null),
  targetUserIds: z.array(z.string()).min(1).max(50),
});

/** All rules in evaluation order. */
export async function GET() {
  const { error } = await requirePermission("leads.manage");
  if (error) return error;
  const rules = await db.assignmentRule.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ ok: true, rules });
}

export async function POST(req: Request) {
  const { user, error } = await requirePermission("leads.manage");
  if (error) return error;

  const parsed = RuleSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const d = parsed.data;

  // Validate the target pool exists.
  const users = await db.user.findMany({ where: { id: { in: d.targetUserIds } }, select: { id: true } });
  if (users.length !== new Set(d.targetUserIds).size) {
    return NextResponse.json({ ok: false, error: "One or more target users don't exist." }, { status: 400 });
  }

  const rule = await db.assignmentRule.create({ data: d });
  audit({ userId: user.id, action: "assignment-rule.create", entity: "assignment-rule", entityId: rule.id, meta: { name: rule.name }, ip: clientIp(req) });
  return NextResponse.json({ ok: true, rule }, { status: 201 });
}
