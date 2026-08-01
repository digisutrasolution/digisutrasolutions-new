import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { canSeeAllLeads } from "@/lib/auth/rbac";
import { logLeadActivity } from "@/lib/crm-server";
import { tgHandle } from "@/lib/comms";

type Params = { params: Promise<{ id: string }> };

const Schema = z.object({
  body: z.string().trim().min(1).max(4000),
  handle: z.string().trim().max(64).optional(),
  templateId: z.string().nullable().optional(),
});

/** Record a Telegram message the agent is sending via the t.me deep link
    (Telegram can't confirm delivery, and DM links can't prefill text, so the
    composer copies the message and this logs intent). Persists the lead's
    handle when supplied so it's remembered next time. */
export async function POST(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("leads.manage");
  if (error) return error;
  const { id } = await params;

  const lead = await db.lead.findFirst({ where: { id, deletedAt: null } });
  if (!lead || (!canSeeAllLeads(user) && lead.assignedToId !== user.id)) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid input." }, { status: 400 });

  const handle = tgHandle(parsed.data.handle ?? lead.telegram ?? "");
  if (!handle) return NextResponse.json({ ok: false, error: "Add the lead's Telegram @username first." }, { status: 400 });

  // Remember the handle on the lead when it's new or changed.
  if (handle !== tgHandle(lead.telegram ?? "")) {
    await db.lead.update({ where: { id }, data: { telegram: handle } }).catch(() => {});
  }

  await db.commLog.create({
    data: {
      leadId: id,
      channel: "TELEGRAM",
      templateId: parsed.data.templateId ?? null,
      toAddress: `@${handle}`,
      body: parsed.data.body,
      status: "SENT",
      userId: user.id,
      userName: user.name,
    },
  });
  void logLeadActivity({ leadId: id, userId: user.id, userName: user.name, type: "telegram", message: `Telegram message to @${handle}` });
  return NextResponse.json({ ok: true, handle });
}
