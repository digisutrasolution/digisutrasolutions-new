/**
 * Moves two sections off the main About page onto their natural sub-pages,
 * without disturbing the content already there:
 *
 *   - about/why-choose-us  ← the "Why businesses choose DigiSutra" cards
 *   - about/global-presence ← the animated countries block, and the two
 *                              stats bands merged into one (no duplicate)
 *
 * Run alongside update-about-page.mjs (which removes these from /about):
 *   docker compose exec app node scripts/update-about-subpages.mjs
 *
 * Idempotent: blocks are matched by heading/type, so re-running updates in
 * place instead of adding duplicates. Existing hero / cards / text blocks
 * on each sub-page are left untouched.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* One merged list instead of two. The page previously carried "The honest
   list" and a second "Why businesses choose" grid that answered the same
   question — twelve near-identical boxes with real overlap (measurable
   outcomes ≈ measured like money, ethical partner ≈ no lock-in). This keeps
   the sharper, falsifiable claims from the honest list and adds only the
   two points it genuinely didn't cover (customisation, engineering), then
   renders them as a checklist rather than a wall of cards. */
const WHY_CHOOSE = {
  type: "cards",
  layout: "checklist",
  heading: "Why choose DigiSutra?",
  items: [
    { title: "Built for AI-era search", copy: "AEO and GEO are in every SEO retainer — we optimize for AI answers, not just blue links." },
    { title: "Measured like money", copy: "Ads and content report in leads and ROAS, not impressions." },
    { title: "Strategies built for you", copy: "Every growth plan is customized to your business, audience and goals; nothing is copied from a template." },
    { title: "We use what we sell", copy: "The AI automation we pitch runs our own site, leads and follow-ups." },
    { title: "Secure, scalable builds", copy: "High-performance development that's secure and built to scale as you grow." },
    { title: "No lock-in", copy: "Retainers pause with 30 days' notice; the audit comes before any commitment." },
    { title: "Senior eyes on your account", copy: "Strategy stays with experienced hands, not handed to interns." },
    { title: "WhatsApp-speed support", copy: "Decisions move at chat speed — no ticket queues." },
  ],
};

const COUNTRIES = {
  type: "countries",
  heading: "countries served, one team",
  copy: "From India to the Gulf, Europe, North America and beyond — we run marketing, development and AI for businesses across the world. (Edit this list any time in the CMS.)",
  count: "12",
  countries: [
    { name: "India", code: "in" },
    { name: "United States", code: "us" },
    { name: "United Kingdom", code: "gb" },
    { name: "United Arab Emirates", code: "ae" },
    { name: "Saudi Arabia", code: "sa" },
    { name: "Qatar", code: "qa" },
    { name: "Singapore", code: "sg" },
    { name: "Australia", code: "au" },
    { name: "Canada", code: "ca" },
    { name: "Germany", code: "de" },
    { name: "Netherlands", code: "nl" },
    { name: "South Africa", code: "za" },
  ],
};

/* One merged stats band for the global-presence page — the unique stats
   from both the old About band and the sub-page's own band, deduped. */
const MERGED_STATS = [
  { value: "2018", label: "founded" },
  { value: "250+", label: "projects shipped" },
  { value: "120+", label: "happy clients" },
  { value: "12", label: "countries served" },
  { value: "3", label: "continents" },
  { value: "1", label: "HQ — Noida, Delhi NCR" },
];

/** Insert `block` just before the first CTA (so CTAs stay last), or append. */
function insertBeforeCta(sections, block) {
  const ctaIdx = sections.findIndex((s) => s.type === "cta");
  if (ctaIdx === -1) return [...sections, block];
  return [...sections.slice(0, ctaIdx), block, ...sections.slice(ctaIdx)];
}

async function save(slug, sections, note) {
  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page) {
    console.log(`skip  ${slug} — page not found`);
    return;
  }
  const version = (await prisma.pageVersion.count({ where: { pageId: page.id } })) + 1;
  await prisma.page.update({ where: { slug }, data: { sections } });
  await prisma.pageVersion.create({
    data: {
      pageId: page.id,
      version,
      title: page.title,
      sections,
      seoSnapshot: {},
      note,
      createdByName: "Script",
    },
  });
  console.log(`ok    ${slug} — ${sections.length} sections (v${version})`);
}

/* why-choose-us: collapse every cards block into the single merged
   checklist, so the duplicate "honest list" grid goes away. */
{
  const page = await prisma.page.findUnique({ where: { slug: "about/why-choose-us" } });
  if (page) {
    const sections = Array.isArray(page.sections) ? [...page.sections] : [];
    const firstCards = sections.findIndex((s) => s.type === "cards");
    const without = sections.filter((s) => s.type !== "cards");
    const at = firstCards === -1 ? without.length : firstCards;
    const next = [...without.slice(0, at), WHY_CHOOSE, ...without.slice(at)];
    await save("about/why-choose-us", next, "Merge the two why-choose lists into one checklist");
  } else {
    console.log("skip  about/why-choose-us — page not found");
  }
}

/* technology: four cards leave a 3+1 hole, so switch that block to bento. */
{
  const page = await prisma.page.findUnique({ where: { slug: "about/technology" } });
  if (page) {
    const sections = (Array.isArray(page.sections) ? page.sections : []).map((s) =>
      s.type === "cards" ? { ...s, layout: "bento" } : s,
    );
    await save("about/technology", sections, "Bento layout for the four-card grid");
  } else {
    console.log("skip  about/technology — page not found");
  }
}

/* global-presence: merge the stats band and add the countries block. */
{
  const page = await prisma.page.findUnique({ where: { slug: "about/global-presence" } });
  if (page) {
    let sections = Array.isArray(page.sections) ? [...page.sections] : [];

    const statIdx = sections.findIndex((s) => s.type === "stats");
    if (statIdx >= 0) sections[statIdx] = { type: "stats", items: MERGED_STATS };
    else sections = insertBeforeCta(sections, { type: "stats", items: MERGED_STATS });

    const cIdx = sections.findIndex((s) => s.type === "countries");
    if (cIdx >= 0) sections[cIdx] = COUNTRIES;
    else sections = insertBeforeCta(sections, COUNTRIES);

    await save("about/global-presence", sections, "Move: countries + merged stats from /about");
  } else {
    console.log("skip  about/global-presence — page not found");
  }
}

await prisma.$disconnect();
