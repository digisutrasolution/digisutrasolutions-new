import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { previewAssignment } from "@/lib/assignment";
import { LEAD_PRIORITIES, LEAD_SOURCES } from "@/lib/crm";

const Schema = z.object({
  source: z.enum(LEAD_SOURCES).default("CONTACT"),
  services: z.array(z.string().trim()).default([]),
  country: z.string().trim().max(80).optional(),
  state: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  priority: z.enum(LEAD_PRIORITIES).default("MEDIUM"),
  text: z.string().trim().max(500).optional(), // stands in for name/company/message
});

/** Dry-run the rules against a hypothetical lead — which rule claims it and
    who is next in line — without touching any round-robin cursor. */
export async function POST(req: Request) {
  const { error } = await requirePermission("leads.manage");
  if (error) return error;

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid input." }, { status: 400 });
  }
  const d = parsed.data;

  const result = await previewAssignment({
    id: "preview",
    source: d.source,
    services: d.services,
    country: d.country ?? null,
    state: d.state ?? null,
    city: d.city ?? null,
    priority: d.priority,
    name: d.text ?? "",
    company: null,
    message: d.text ?? null,
    assignedToId: null,
  });

  if (!result) {
    return NextResponse.json({ ok: true, matched: false });
  }
  const owner = result.userId
    ? await db.user.findUnique({ where: { id: result.userId }, select: { name: true } })
    : null;
  return NextResponse.json({
    ok: true,
    matched: true,
    ruleName: result.ruleName,
    ownerName: owner?.name ?? null,
  });
}
