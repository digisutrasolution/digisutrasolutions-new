import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import { AuthorInputSchema, uniqueSlug } from "../route";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("authors.manage");
  if (error) return error;
  const { id } = await params;

  const existing = await db.author.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const parsed = AuthorInputSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const d = parsed.data;

  /* The slug only moves when someone edits it directly. Renaming a person must
     not silently break the /author/<slug> links already published and indexed
     against their articles. */
  const slug =
    d.slug !== undefined && d.slug !== existing.slug
      ? await uniqueSlug(d.slug, id)
      : undefined;

  const author = await db.author.update({
    where: { id },
    data: {
      ...(slug ? { slug } : {}),
      ...(d.name !== undefined ? { name: d.name } : {}),
      ...(d.role !== undefined ? { role: d.role } : {}),
      ...(d.photoUrl !== undefined ? { photoUrl: d.photoUrl || null } : {}),
      ...(d.bio !== undefined ? { bio: d.bio } : {}),
      ...(d.experienceYears !== undefined ? { experienceYears: d.experienceYears } : {}),
      ...(d.credentials !== undefined ? { credentials: d.credentials } : {}),
      ...(d.linkedinUrl !== undefined ? { linkedinUrl: d.linkedinUrl || null } : {}),
      ...(d.email !== undefined ? { email: d.email || null } : {}),
      ...(d.isActive !== undefined ? { isActive: d.isActive } : {}),
      ...(d.userId !== undefined ? { userId: d.userId || null } : {}),
    },
  });

  audit({
    userId: user.id,
    action: "author.update",
    entity: "author",
    entityId: id,
    meta: { fields: Object.keys(d) },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, author });
}

export async function DELETE(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("authors.manage");
  if (error) return error;
  const { id } = await params;

  const existing = await db.author.findUnique({
    where: { id },
    include: { _count: { select: { posts: true } } },
  });
  if (!existing) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  /* Deleting would set authorId null on their articles, quietly re-crediting
     published work to the organisation. Deactivating hides the profile and has
     the same public effect, but keeps the record of who wrote what. */
  if (existing._count.posts > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: `${existing.name} is credited on ${existing._count.posts} article(s). Turn the profile off instead of deleting it, so the record of who wrote them survives.`,
      },
      { status: 409 },
    );
  }

  await db.author.delete({ where: { id } });
  audit({
    userId: user.id,
    action: "author.delete",
    entity: "author",
    entityId: id,
    meta: { name: existing.name },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
