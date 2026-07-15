import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

const PATH_REGEX = /^\/[a-zA-Z0-9\-._~/]*$/;

const CreateRedirectSchema = z.object({
  fromPath: z
    .string()
    .trim()
    .min(2)
    .max(300)
    .regex(PATH_REGEX, "Paths must start with / and contain no query strings."),
  toPath: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .refine((v) => v.startsWith("/") || v.startsWith("https://") || v.startsWith("http://"), {
      message: "Target must be a path (/…) or a full URL.",
    }),
  permanent: z.boolean().optional(),
});

export async function GET() {
  const { error } = await requirePermission("redirects.manage");
  if (error) return error;
  const redirects = await db.redirect.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ ok: true, redirects });
}

export async function POST(req: Request) {
  const { user, error } = await requirePermission("redirects.manage");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = CreateRedirectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  if (parsed.data.fromPath === parsed.data.toPath) {
    return NextResponse.json(
      { ok: false, error: "A redirect cannot point to itself." },
      { status: 400 },
    );
  }
  const exists = await db.redirect.findUnique({
    where: { fromPath: parsed.data.fromPath },
    select: { id: true },
  });
  if (exists) {
    return NextResponse.json(
      { ok: false, error: "A redirect from this path already exists." },
      { status: 409 },
    );
  }

  const redirect = await db.redirect.create({
    data: {
      fromPath: parsed.data.fromPath,
      toPath: parsed.data.toPath,
      permanent: parsed.data.permanent ?? false,
    },
  });

  audit({
    userId: user.id,
    action: "redirect.create",
    entity: "redirect",
    entityId: redirect.id,
    meta: { from: redirect.fromPath, to: redirect.toPath },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, redirect }, { status: 201 });
}
