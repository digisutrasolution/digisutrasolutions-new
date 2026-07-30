import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";

const PAGE_SIZE = 25;

/** Paginated, filterable session list for the admin session-history view. */
export async function GET(req: Request) {
  const { error } = await requirePermission("analytics.view");
  if (error) return error;

  const url = new URL(req.url);
  const num = (k: string) => parseInt(url.searchParams.get(k) ?? "", 10);
  const page = Math.max(1, num("page") || 1);
  const device = url.searchParams.get("device") ?? "";
  const country = url.searchParams.get("country") ?? "";
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
  const minPages = num("minPages");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const where: Prisma.SessionWhereInput = {};
  if (device) where.device = device;
  if (country) where.country = country;
  if (Number.isFinite(minPages) && minPages > 1) where.pageCount = { gte: minPages };
  if (from || to) {
    where.startedAt = {};
    if (from) where.startedAt.gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      where.startedAt.lte = end;
    }
  }
  if (q) {
    where.OR = [
      { landingPath: { contains: q, mode: "insensitive" } },
      { exitPath: { contains: q, mode: "insensitive" } },
      { referrer: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, sessions, countryRows] = await Promise.all([
    db.session.count({ where }),
    db.session.findMany({
      where,
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        startedAt: true,
        lastSeenAt: true,
        pageCount: true,
        landingPath: true,
        exitPath: true,
        referrer: true,
        device: true,
        browser: true,
        os: true,
        country: true,
      },
    }),
    db.session.findMany({
      where: { country: { not: null } },
      distinct: ["country"],
      select: { country: true },
      orderBy: { country: "asc" },
      take: 200,
    }),
  ]);

  return NextResponse.json({
    ok: true,
    total,
    page,
    pageSize: PAGE_SIZE,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    sessions,
    countries: countryRows.map((r) => r.country).filter(Boolean),
  });
}
