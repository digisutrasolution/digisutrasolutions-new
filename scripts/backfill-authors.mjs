/**
 * Create Author shells from the free-text authorName values posts were
 * published under, and re-link those posts.
 *
 * Deliberately conservative about two things.
 *
 * It only creates a profile when authorName matches a real team member in the
 * User table. Values like "DigiSutra Team" or "Marketing Manager" are not
 * people; inventing a person for them is exactly the practice that damages
 * E-E-A-T rather than helping it. Those posts keep authorId null and render
 * under the organisation byline, which is the truth.
 *
 * And it fills in NOTHING it cannot know. Bio, photo, role, years of
 * experience and LinkedIn are left empty for a human to complete — a
 * fabricated bio on an author page is worse than no author page.
 *
 * Safe to re-run: it skips names that already have a profile.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const slugify = (name) =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);

async function uniqueSlug(base) {
  const root = slugify(base) || "author";
  for (let n = 0; n < 50; n += 1) {
    const candidate = n === 0 ? root : `${root}-${n + 1}`;
    const clash = await db.author.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!clash) return candidate;
  }
  return `${root}-${Date.now()}`;
}

const grouped = await db.blogPost.groupBy({
  by: ["authorName"],
  where: { authorId: null, authorName: { not: null } },
  _count: { _all: true },
});

if (grouped.length === 0) {
  console.log("Nothing to do — every post already has an author or no legacy label.");
  await db.$disconnect();
  process.exit(0);
}

console.log(`${grouped.length} legacy byline label(s) to consider.\n`);

const created = [];
const leftAsOrg = [];

for (const g of grouped) {
  const label = (g.authorName ?? "").trim();
  if (!label) continue;

  const user = await db.user.findFirst({
    where: { name: { equals: label, mode: "insensitive" } },
    select: { id: true, name: true, photoUrl: true },
  });

  if (!user) {
    leftAsOrg.push({ label, posts: g._count._all });
    console.log(`  ORG   "${label}" (${g._count._all} post(s)) — not a team member, left on the organisation byline`);
    continue;
  }

  let author = await db.author.findFirst({ where: { userId: user.id } });
  if (!author) {
    author = await db.author.create({
      data: {
        slug: await uniqueSlug(user.name),
        name: user.name,
        userId: user.id,
        // Reuse a staff photo if one is already set; everything else is for a
        // human to write.
        photoUrl: user.photoUrl ?? null,
        isActive: true,
      },
    });
    created.push(author);
  }

  const { count } = await db.blogPost.updateMany({
    where: { authorId: null, authorName: label },
    data: { authorId: author.id },
  });
  console.log(`  LINK  "${label}" → /author/${author.slug}  (${count} post(s))`);
}

console.log(`\nCreated ${created.length} profile(s); ${leftAsOrg.length} label(s) stayed on the organisation byline.`);

if (created.length) {
  console.log("\nThese profiles are shells. Fill them in at /admin/authors — a byline");
  console.log("only earns trust once it has a real photo, role, bio and LinkedIn:");
  for (const a of created) {
    console.log(`  - ${a.name}  (/author/${a.slug})  needs: role, bio, experience, LinkedIn${a.photoUrl ? "" : ", photo"}`);
  }
}

if (leftAsOrg.length) {
  console.log("\nStill published as the DigiSutra team. If a real person owns any of");
  console.log("these, create their profile and reassign the post in the blog editor:");
  for (const l of leftAsOrg) console.log(`  - "${l.label}" — ${l.posts} post(s)`);
}

await db.$disconnect();
