import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { notifyUsers } from "@/lib/notify";

/* Sweep of pending follow-ups:
   - REMINDER: due within the next hour (or already due) and not yet reminded
     → ping the owner once.
   - ESCALATION: more than 2h past due and still pending → alert the owner and
     every super admin once.
   Each path stamps its own column so a notification never repeats.

   Trigger it from cron with `Authorization: Bearer $CRON_SECRET`, or run it
   manually as a signed-in super admin (the "Run reminders now" button). */

const REMINDER_LEAD_MIN = 60;
const ESCALATE_GRACE_MIN = 120;

async function authorize(req: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth === `Bearer ${secret}`) return true;
  // Fallback: a signed-in super admin may run it on demand.
  const user = await getCurrentUser();
  return !!user && can(user.role, "users.manage");
}

async function run() {
  const now = new Date();
  const remindBefore = new Date(now.getTime() + REMINDER_LEAD_MIN * 60_000);
  const escalateBefore = new Date(now.getTime() - ESCALATE_GRACE_MIN * 60_000);

  // 1) Reminders — due soon / due now, owner assigned, not yet reminded.
  const toRemind = await db.followUp.findMany({
    where: {
      status: "PENDING",
      reminderSentAt: null,
      ownerId: { not: null },
      dueAt: { lte: remindBefore },
      lead: { deletedAt: null },
    },
    include: { lead: { select: { id: true, name: true } } },
    take: 200,
  });

  for (const f of toRemind) {
    await notifyUsers([f.ownerId!], {
      type: "followup-due",
      title: `Follow-up due: ${f.lead.name}`,
      body: f.title,
      link: `/admin/leads/${f.leadId}`,
    });
  }
  if (toRemind.length) {
    await db.followUp.updateMany({
      where: { id: { in: toRemind.map((f) => f.id) } },
      data: { reminderSentAt: now },
    });
  }

  // 2) Escalations — well past due, still pending, not yet escalated.
  const toEscalate = await db.followUp.findMany({
    where: {
      status: "PENDING",
      escalatedAt: null,
      dueAt: { lt: escalateBefore },
      lead: { deletedAt: null },
    },
    include: { lead: { select: { id: true, name: true } } },
    take: 200,
  });

  let escalatedCount = 0;
  if (toEscalate.length) {
    const admins = await db.user.findMany({
      where: { role: "SUPER_ADMIN", isActive: true },
      select: { id: true },
    });
    const adminIds = admins.map((a) => a.id);
    for (const f of toEscalate) {
      const targets = [...new Set([...(f.ownerId ? [f.ownerId] : []), ...adminIds])];
      if (!targets.length) continue;
      await notifyUsers(targets, {
        type: "followup-overdue",
        title: `Overdue follow-up: ${f.lead.name}`,
        body: `${f.title} — past due, still open`,
        link: `/admin/leads/${f.leadId}`,
      });
      escalatedCount++;
    }
    await db.followUp.updateMany({
      where: { id: { in: toEscalate.map((f) => f.id) } },
      data: { escalatedAt: now },
    });
  }

  return { reminded: toRemind.length, escalated: escalatedCount };
}

export async function POST(req: Request) {
  if (!(await authorize(req))) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }
  const result = await run();
  return NextResponse.json({ ok: true, ...result });
}

// Convenience for cron services that only issue GETs.
export async function GET(req: Request) {
  if (!(await authorize(req))) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }
  const result = await run();
  return NextResponse.json({ ok: true, ...result });
}
