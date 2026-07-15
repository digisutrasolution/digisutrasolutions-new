import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { notifyRoles } from "@/lib/notify";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

const BugSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(3).max(5000),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  screenshotUrl: z.string().trim().url().max(500).optional(),
});

export async function POST(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("testing.review");
  if (error) return error;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = BugSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const page = await db.page.findUnique({
    where: { id },
    select: { id: true, title: true },
  });
  if (!page) {
    return NextResponse.json(
      { ok: false, error: "Page not found." },
      { status: 404 },
    );
  }

  const bug = await db.bugReport.create({
    data: {
      pageId: id,
      title: parsed.data.title,
      description: parsed.data.description,
      severity: parsed.data.severity,
      screenshotUrl: parsed.data.screenshotUrl,
      reportedById: user.id,
      reportedByName: user.name,
    },
  });

  void notifyRoles(
    ["DEVELOPER", "SUPER_ADMIN"],
    {
      type: "bug",
      title: `Bug (${bug.severity.toLowerCase()}): ${bug.title}`,
      body: `On "${page.title}" — ${bug.description.slice(0, 140)}`,
      link: `/admin/pages/${id}`,
    },
    { excludeUserId: user.id },
  );

  audit({
    userId: user.id,
    action: "bug.create",
    entity: "bug",
    entityId: bug.id,
    meta: { pageId: id, severity: bug.severity },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true, bug }, { status: 201 });
}
