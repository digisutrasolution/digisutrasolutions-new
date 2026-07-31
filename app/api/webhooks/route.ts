import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import { newWebhookSecret } from "@/lib/webhooks";
import { WEBHOOK_EVENTS } from "@/lib/integrations";

export const WebhookSchema = z.object({
  name: z.string().trim().min(1).max(80),
  url: z.string().trim().url().max(500),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
  active: z.boolean().default(true),
});

export async function GET() {
  const { error } = await requirePermission("api.manage");
  if (error) return error;
  const webhooks = await db.webhook.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ ok: true, webhooks });
}

export async function POST(req: Request) {
  const { user, error } = await requirePermission("api.manage");
  if (error) return error;
  const parsed = WebhookSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const webhook = await db.webhook.create({ data: { ...parsed.data, secret: newWebhookSecret() } });
  audit({ userId: user.id, action: "webhook.create", entity: "webhook", entityId: webhook.id, meta: { url: webhook.url }, ip: clientIp(req) });
  return NextResponse.json({ ok: true, webhook }, { status: 201 });
}
