/**
 * Prove the legacy→HTML conversion is faithful, BEFORE anything is written.
 *
 *   npx tsx scripts/check-body-conversion.mts
 *
 * For every post it compares the two things readers and Google actually see:
 * the visible text, and the derived TOC and key-takeaways. If a conversion
 * dropped a heading, mangled a link or lost a sentence, one of these diverges.
 */
import { PrismaClient } from "@prisma/client";
import { legacyToHtml } from "../lib/legacy-body";
import { extractHeadings, extractTakeaways } from "../lib/blog";

const db = new PrismaClient();

/** Visible words, from either format, so the two are comparable.
 *
 * Inline tags are removed with NO space and block tags become one, because
 * they mean different things to a reader: "<strong>Acme</strong>." renders as
 * "Acme." with the full stop attached, while "</p><p>" is a real word break.
 * Replacing every tag with a space reported a false difference on the one
 * post that had bold immediately before a full stop — the conversion was
 * fine, the comparison was not. */
const INLINE_TAGS = /<\/?(?:a|strong|b|em|i|u|s|mark|code|span|sub|sup)\b[^>]*>/gi;

const words = (v: string) =>
  v
    .replace(INLINE_TAGS, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // legacy markers that were never visible
    .replace(/^\s{0,3}#{2,3}\s+/gm, "")
    .replace(/^\s{0,3}-\s+/gm, "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .split(/\s+/)
    .filter(Boolean);

/** Same guard the migration uses. Without it, a post that has already been
    converted gets fed back through legacyToHtml, which escapes its markup and
    reports a difference against itself — every migrated post "failing" tells
    you nothing. */
const isHtml = (v: string) =>
  /<(p|h2|h3|h4|ul|ol|blockquote|figure|table|pre|img|hr)\b/i.test(v);

const posts = await db.blogPost.findMany({ select: { slug: true, body: true } });
let bad = 0;
let skipped = 0;

for (const p of posts) {
  if (!p.body.trim()) continue;
  if (isHtml(p.body)) {
    skipped += 1;
    console.log(`SKIP  ${p.slug} — already converted`);
    continue;
  }
  const html = legacyToHtml(p.body);

  const hA = extractHeadings(p.body).map((h) => `${h.id}|${h.text}`);
  const hB = extractHeadings(html).map((h) => `${h.id}|${h.text}`);
  const tA = extractTakeaways(p.body);
  const tB = extractTakeaways(html);
  const wA = words(p.body);
  const wB = words(html);

  const headingsOk = JSON.stringify(hA) === JSON.stringify(hB);
  const takeawaysOk = JSON.stringify(tA) === JSON.stringify(tB);
  const textOk = wA.join(" ") === wB.join(" ");
  const ok = headingsOk && takeawaysOk && textOk;
  if (!ok) bad += 1;

  console.log(`${ok ? "OK  " : "FAIL"}  ${p.slug}`);
  console.log(
    `        headings ${hA.length}→${hB.length} ${headingsOk ? "match" : "**DIFFER**"}` +
      ` · takeaways ${tA.length}→${tB.length} ${takeawaysOk ? "match" : "**DIFFER**"}` +
      ` · words ${wA.length}→${wB.length} ${textOk ? "identical" : "**DIFFER**"}`,
  );
  if (!headingsOk) {
    console.log("        legacy:", JSON.stringify(hA));
    console.log("        html:  ", JSON.stringify(hB));
  }
  if (!textOk) {
    const i = wA.findIndex((w, n) => w !== wB[n]);
    console.log(`        first difference at word ${i}:`);
    console.log("        legacy:", wA.slice(Math.max(0, i - 5), i + 6).join(" "));
    console.log("        html:  ", wB.slice(Math.max(0, i - 5), i + 6).join(" "));
  }
}

const tail = skipped ? ` (${skipped} already converted, skipped.)` : "";
console.log(
  bad === 0
    ? `\nAll conversions faithful.${tail}`
    : `\n${bad} post(s) differ — do NOT migrate.${tail}`,
);
await db.$disconnect();
process.exit(bad === 0 ? 0 : 1);
