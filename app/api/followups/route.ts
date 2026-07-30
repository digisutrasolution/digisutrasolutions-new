import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { FOLLOWUP_STATUSES } from "@/lib/crm";

/** List follow-ups for the board/calendar/list views.
    Query: scope=mine|all, status=PENDING|DONE|CANCELLED|ALL,
    due=overdue|today|upcoming, assignee=<userId>|unassigned,
    from=ISO, to=ISO (calendar window), q=text. */
export async function GET(req: Request) {
  const { user, error } = await requirePermission("leads.manage");
  if (error) return error;

  const p = new URL(req.url).searchParams;
  const where: Prisma.FollowUpWhereInput = { lead: { deletedAt: null } };

  const status = p.get("status");
  if (status && status !== "ALL" && (FOLLOWUP_STATUSES as readonly string[]).includes(status)) {
    where.status = status as (typeof FOLLOWUP_STATUSES)[number];
  }

  const scope = p.get("scope");
  const assignee = p.get("assignee");
  if (scope === "mine") where.ownerId = user.id;
  else if (assignee === "unassigned") where.ownerId = null;
  else if (assignee && assignee !== "ALL") where.ownerId = assignee;

  const now = new Date();
  const due = p.get("due");
  if (due === "overdue") where.dueAt = { lt: now };
  else if (due === "today") {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    where.dueAt = { lte: end };
  } else if (due === "upcoming") where.dueAt = { gte: now };

  const from = p.get("from");
  const to = p.get("to");
  if (from || to) {
    where.dueAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const q = p.get("q")?.trim();
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { lead: { is: { name: { contains: q, mode: "insensitive" }, deletedAt: null } } },
    ];
  }

  const followUps = await db.followUp.findMany({
    where,
    orderBy: { dueAt: "asc" },
    take: 500,
    include: {
      owner: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true, company: true, whatsapp: true, status: true, priority: true } },
    },
  });

  return NextResponse.json({ ok: true, followUps });
}
