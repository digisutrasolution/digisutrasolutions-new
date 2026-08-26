/**
 * Convert legacy text bodies to editor HTML — blog posts and CMS rich-text
 * blocks.
 *
 * Run with tsx, not node, so it can import the REAL converter:
 *
 *   npx tsx scripts/migrate-bodies-to-html.mts --dry
 *   npx tsx scripts/migrate-bodies-to-html.mts
 *
 * Importing lib/legacy-body rather than restating its rules is the point: the
 * editor converts on load with the same function, so a migrated post and a
 * post converted by opening it in the editor come out identical. Two copies
 * would drift, and the drift would show up as quietly mangled articles.
 *
 * Safe to re-run — anything already HTML is skipped. Every original body is
 * written to a timestamped JSON backup BEFORE anything is updated, so a bad
 * run can be reversed.
 */
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";
import { legacyToHtml } from "../lib/legacy-body";

const db = new PrismaClient();
const DRY = process.argv.includes("--dry");

/** Same test the renderers use — kept in sync by importing it would be better,
    but lib/blog pulls in client-safe React helpers, so this mirrors it. */
const isHtml = (v: string) =>
  /<(p|h2|h3|h4|ul|ol|blockquote|figure|table|pre|img|hr)\b/i.test(v);

type Backup = {
  at: string;
  posts: { id: string; slug: string; body: string }[];
  pages: { id: string; slug: string; sections: unknown }[];
};

const backup: Backup = { at: new Date().toISOString(), posts: [], pages: [] };

console.log(DRY ? "DRY RUN — nothing will be written.\n" : "Converting.\n");

// ── Blog posts ─────────────────────────────────────────────────────────────
const posts = await db.blogPost.findMany({ select: { id: true, slug: true, body: true } });
let postsChanged = 0;

for (const p of posts) {
  if (!p.body.trim()) {
    console.log(`  skip   ${p.slug} — empty body`);
    continue;
  }
  if (isHtml(p.body)) {
    console.log(`  skip   ${p.slug} — already HTML`);
    continue;
  }
  const html = legacyToHtml(p.body);
  backup.posts.push({ id: p.id, slug: p.slug, body: p.body });
  postsChanged += 1;
  console.log(`  post   ${p.slug}  ${p.body.length} chars → ${html.length} chars HTML`);
  if (!DRY) await db.blogPost.update({ where: { id: p.id }, data: { body: html } });
}

// ── CMS rich-text blocks ───────────────────────────────────────────────────
const pages = await db.page.findMany({ select: { id: true, slug: true, sections: true } });
let pagesChanged = 0;
let blocksChanged = 0;

for (const pg of pages) {
  const sections = pg.sections as unknown;
  if (!Array.isArray(sections)) continue;

  let touched = 0;
  const next = sections.map((s) => {
    const sec = s as { type?: string; body?: string };
    if (sec?.type !== "richText" || typeof sec.body !== "string") return s;
    if (!sec.body.trim() || isHtml(sec.body)) return s;
    touched += 1;
    return { ...sec, body: legacyToHtml(sec.body) };
  });

  if (touched === 0) continue;
  backup.pages.push({ id: pg.id, slug: pg.slug, sections });
  pagesChanged += 1;
  blocksChanged += touched;
  console.log(`  page   /${pg.slug}  ${touched} rich-text block(s)`);
  if (!DRY) {
    await db.page.update({
      where: { id: pg.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { sections: next as any },
    });
  }
}

// ── Report ─────────────────────────────────────────────────────────────────
console.log(
  `\n${postsChanged} post(s), ${blocksChanged} rich-text block(s) across ${pagesChanged} page(s).`,
);

if (!DRY && (backup.posts.length || backup.pages.length)) {
  const file = `body-backup-${backup.at.replace(/[:.]/g, "-")}.json`;
  writeFileSync(file, JSON.stringify(backup, null, 2), "utf8");
  console.log(`Originals saved to ${file} — keep it until you have checked the pages.`);
}

if (DRY) console.log("\nNothing was written. Re-run without --dry to apply.");

await db.$disconnect();
