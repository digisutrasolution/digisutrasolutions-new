import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import { COMM_CHANNELS } from "@/lib/comms";

export const TemplateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  channel: z.enum(COMM_CHANNELS),
  subject: z.string().trim().max(200).default(""),
  body: z.string().trim().min(1).max(8000),
  active: z.boolean().default(true),
});

/** List templates (any lead worker may read them to send). */
export async function GET(req: Request) {
  const { error } = await requirePermission("leads.manage");
  if (error) return error;
  const p = new URL(req.url).searchParams;
  const where: Prisma.CommTemplateWhereInput = {};
  const channel = p.get("channel");
  if (channel && (COMM_CHANNELS as readonly string[]).includes(channel)) where.channel = channel as Prisma.CommTemplateWhereInput["channel"];
  if (p.get("active") === "1") where.active = true;
  const templates = await db.commTemplate.findMany({ where, orderBy: { name: "asc" } });
  return NextResponse.json({ ok: true, templates });
}

/** Create a template (managing templates needs comms.manage). */
export async function POST(req: Request) {
  const { user, error } = await requirePermission("comms.manage");
  if (error) return error;
  const parsed = TemplateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const template = await db.commTemplate.create({ data: parsed.data });
  audit({ userId: user.id, action: "comm-template.create", entity: "comm-template", entityId: template.id, meta: { channel: template.channel }, ip: clientIp(req) });
  return NextResponse.json({ ok: true, template }, { status: 201 });
}
