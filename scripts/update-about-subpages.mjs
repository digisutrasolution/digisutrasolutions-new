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

const WHY_CHOOSE = {
  type: "cards",
  heading: "Why businesses choose DigiSutra",
  items: [
    { title: "Measurable outcomes", copy: "We commit to numbers — traffic, leads, revenue — backed by research, analytics and continuous optimization, not vanity metrics." },
    { title: "Strategies built for you", copy: "Every growth plan is customized to your business, audience and goals; nothing is copied from a template." },
    { title: "Transparent reporting", copy: "Clear communication and honest performance reporting, so you always know what we did and what it returned." },
    { title: "SEO, AI search & CRO", copy: "Implementation focused on search, AI answer engines and conversion — the things that actually move revenue." },
    { title: "Secure, scalable builds", copy: "High-performance development that's secure and built to scale as you grow." },
    { title: "Ethical, long-term partner", copy: "White-hat, ethical practices and experienced marketing and technology professionals focused on long-term growth." },
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

/* why-choose-us: add the cards below the existing "honest list". */
{
  const page = await prisma.page.findUnique({ where: { slug: "about/why-choose-us" } });
  if (page) {
    let sections = Array.isArray(page.sections) ? [...page.sections] : [];
    const at = sections.findIndex(
      (s) => s.type === "cards" && s.heading === WHY_CHOOSE.heading,
    );
    if (at >= 0) sections[at] = WHY_CHOOSE;
    else sections = insertBeforeCta(sections, WHY_CHOOSE);
    await save("about/why-choose-us", sections, "Move: why-choose cards from /about");
  } else {
    console.log("skip  about/why-choose-us — page not found");
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
