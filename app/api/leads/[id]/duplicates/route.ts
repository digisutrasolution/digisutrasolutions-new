import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { canSeeAllLeads, leadScopeWhere } from "@/lib/auth/rbac";

type Params = { params: Promise<{ id: string }> };

const digits = (s: string | null | undefined) => (s ?? "").replace(/[^\d]/g, "");
const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();

/** Rule-based duplicate detection — deterministic and instant (no AI). Matches
    on normalized phone/email (strong) or name/company (possible). Scoped. */
export async function GET(_req: Request, { params }: Params) {
  const { user, error } = await requirePermission("leads.manage");
  if (error) return error;
  const { id } = await params;

  const lead = await db.lead.findFirst({ where: { id, deletedAt: null } });
  if (!lead || (!canSeeAllLeads(user) && lead.assignedToId !== user.id)) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  const email = norm(lead.email);
  const last8 = digits(lead.whatsapp).slice(-8);
  const firstName = norm(lead.name).split(/\s+/)[0] ?? "";
  const company = norm(lead.company);

  const or: Prisma.LeadWhereInput[] = [];
  if (email) or.push({ email: { equals: lead.email!, mode: "insensitive" } });
  if (last8.length >= 8) or.push({ whatsapp: { contains: last8 } });
  if (company) or.push({ company: { equals: lead.company!, mode: "insensitive" } });
  if (firstName.length >= 3) or.push({ name: { contains: firstName, mode: "insensitive" } });
  if (or.length === 0) return NextResponse.json({ ok: true, duplicates: [] });

  const candidates = await db.lead.findMany({
    where: { id: { not: id }, deletedAt: null, ...leadScopeWhere(user), OR: or },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: { id: true, name: true, company: true, email: true, whatsapp: true, status: true, createdAt: true, assignedTo: { select: { name: true } } },
  });

  const rank = { high: 3, medium: 2, low: 1 } as const;
  const duplicates = candidates
    .map((c) => {
      let reason = "", confidence: "high" | "medium" | "low" | null = null;
      if (email && norm(c.email) === email) { reason = "Same email"; confidence = "high"; }
      else if (last8.length >= 8 && digits(c.whatsapp).slice(-8) === last8) { reason = "Same phone"; confidence = "high"; }
      else if (company && norm(c.company) === company) { reason = "Same company"; confidence = "medium"; }
      else if (norm(c.name) === norm(lead.name)) { reason = "Same name"; confidence = "medium"; }
      else if (firstName && norm(c.name).split(/\s+/)[0] === firstName) { reason = "Similar name"; confidence = "low"; }
      return confidence ? { id: c.id, name: c.name, company: c.company, status: c.status, assignedToName: c.assignedTo?.name ?? null, reason, confidence } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => rank[b.confidence] - rank[a.confidence])
    .slice(0, 10);

  return NextResponse.json({ ok: true, duplicates });
}
