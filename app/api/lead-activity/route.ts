import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { leadScopeWhere } from "@/lib/auth/rbac";
import { ACTIVITY_TYPES } from "@/lib/crm";

const PAGE_SIZES = [25, 50, 100];

/** Global lead-activity feed (scoped): who did what, when, across all leads. */
export async function GET(req: Request) {
  const { user, error } = await requirePermission("leads.manage");
  if (error) return error;

  const p = new URL(req.url).searchParams;
  const page = Math.max(1, parseInt(p.get("page") ?? "1", 10) || 1);
  const reqSize = parseInt(p.get("pageSize") ?? "", 10);
  const pageSize = PAGE_SIZES.includes(reqSize) ? reqSize : 25;

  const where: Prisma.LeadActivityWhereInput = {
    lead: { is: { deletedAt: null, ...leadScopeWhere(user) } },
  };

  const type = p.get("type");
  if (type && type !== "ALL" && (ACTIVITY_TYPES as readonly string[]).includes(type)) where.type = type;

  const userId = p.get("userId");
  if (userId === "system") where.userId = null;
  else if (userId && userId !== "ALL") where.userId = userId;

  const from = p.get("from");
  const to = p.get("to");
  if (from || to) {
    const end = to ? new Date(to) : null;
    if (end) end.setHours(23, 59, 59, 999);
    where.createdAt = { ...(from ? { gte: new Date(from) } : {}), ...(end ? { lte: end } : {}) };
  }

  const q = p.get("q")?.trim();
  if (q) {
    where.OR = [
      { message: { contains: q, mode: "insensitive" } },
      { userName: { contains: q, mode: "insensitive" } },
      { lead: { is: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const [total, activities] = await Promise.all([
    db.leadActivity.count({ where }),
    db.leadActivity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, type: true, message: true, userName: true, createdAt: true,
        lead: { select: { id: true, name: true } },
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    activities,
    total,
    page,
    pageSize,
    pages: Math.max(1, Math.ceil(total / pageSize)),
  });
}
