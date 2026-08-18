import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import { authorSlug } from "@/lib/authors";

/* Author profiles.

   Reading and writing are gated differently on purpose. GET stays on
   blog.manage because the byline picker in the blog editor calls it — a writer
   who cannot manage profiles must still be able to credit one. Creating and
   editing them needs authors.manage: a profile states a real colleague's
   experience and credentials in public. */

/* Every field is `.optional()` and NOT `.default()`.
   That distinction is load-bearing, and getting it wrong cost an author their
   bio: `.partial()` does not suppress a `.default()`, so a PATCH that mentioned
   only `isActive` arrived at the handler carrying role: "", bio: "" and
   credentials: [] — which the update then dutifully wrote. Toggling a profile
   off and on again erased everything a human had typed into it.

   Defaults now belong to the CREATE handler, which is the only place that
   should be inventing a value for a field nobody supplied. */
export const AuthorInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().max(60).optional(),
  role: z.string().trim().max(120).optional(),
  photoUrl: z.string().trim().max(500).nullable().optional(),
  bio: z.string().trim().max(1200).optional(),
  /* Bounded to something a career can plausibly hold. This is an E-E-A-T
     claim, and an unbounded number invites a typo that reads as a lie. */
  experienceYears: z.number().int().min(0).max(70).nullable().optional(),
  credentials: z.array(z.string().trim().min(1).max(80)).max(10).optional(),
  linkedinUrl: z.string().trim().url().max(300).nullable().optional(),
  email: z.string().trim().email().max(200).nullable().optional(),
  isActive: z.boolean().optional(),
  userId: z.string().max(60).nullable().optional(),
});

/** Unique slug from a name, suffixing only when it has to. */
async function uniqueSlug(base: string, exceptId?: string): Promise<string> {
  const root = authorSlug(base) || "author";
  for (let n = 0; n < 50; n += 1) {
    const candidate = n === 0 ? root : `${root}-${n + 1}`;
    const clash = await db.author.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!clash || clash.id === exceptId) return candidate;
  }
  return `${root}-${Date.now()}`;
}

export async function GET() {
  // Deliberately blog.manage, not authors.manage — see the note above.
  const { error } = await requirePermission("blog.manage");
  if (error) return error;
  const authors = await db.author.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: { _count: { select: { posts: true } } },
  });
  return NextResponse.json({ ok: true, authors });
}

export async function POST(req: Request) {
  const { user, error } = await requirePermission("authors.manage");
  if (error) return error;

  const parsed = AuthorInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const author = await db.author.create({
    data: {
      slug: await uniqueSlug(d.slug || d.name),
      name: d.name,
      // Defaults live here, not in the schema — see the note above it.
      role: d.role ?? "",
      photoUrl: d.photoUrl ?? null,
      bio: d.bio ?? "",
      experienceYears: d.experienceYears ?? null,
      credentials: d.credentials ?? [],
      linkedinUrl: d.linkedinUrl ?? null,
      email: d.email ?? null,
      isActive: d.isActive ?? true,
      userId: d.userId || null,
    },
  });

  audit({
    userId: user.id,
    action: "author.create",
    entity: "author",
    entityId: author.id,
    meta: { name: author.name, slug: author.slug },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, author }, { status: 201 });
}

export { uniqueSlug };
