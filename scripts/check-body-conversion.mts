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

/** Visible words, from either format, so the two are comparable. */
const words = (v: string) =>
  v
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

const posts = await db.blogPost.findMany({ select: { slug: true, body: true } });
let bad = 0;

for (const p of posts) {
  if (!p.body.trim()) continue;
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

console.log(bad === 0 ? "\nAll conversions faithful." : `\n${bad} post(s) differ — do NOT migrate.`);
await db.$disconnect();
process.exit(bad === 0 ? 0 : 1);
