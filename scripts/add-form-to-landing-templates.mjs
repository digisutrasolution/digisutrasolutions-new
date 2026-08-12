/* Put a lead-capture form on the starter landing pages.
 *
 * The four templates shipped without one: every CTA on them was a LINK to
 * /free-audit or /contact, so a paid click that was ready to convert got sent
 * to another page to do it. That is the same leak the no-chrome landing header
 * was built to close.
 *
 * lib/cms/starter-templates.ts now includes the block, but that only helps a
 * FRESH install — app/api/pages/starter-templates is idempotent by slug and
 * deliberately overwrites nothing, so templates already loaded here will never
 * pick it up. This adds it to those.
 *
 * Covers TEMPLATE rows and any LANDING page already cloned from one, since a
 * clone made before today has the same gap.
 *
 * Idempotent: a page that already has ANY form block is left completely alone,
 * including one an admin positioned by hand.
 *
 *   docker compose exec app node scripts/add-form-to-landing-templates.mjs
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const FORM_SLUG = "lead-form";

/* Where the form goes, per template, and why — mirrors the rule in
   starter-templates.ts. "afterHero" for a low-risk ask, "beforeClosingCta"
   when the argument has to land first. */
const PLAN = {
  "starter-free-audit": { at: "afterHero", heading: "Request your free audit" },
  "starter-google-ads": { at: "afterHero", heading: "Get your free account review" },
  "starter-seo-aeo": { at: "beforeClosingCta", heading: "See where you stand in AI answers" },
  "starter-web-build": { at: "beforeClosingCta", heading: "Tell us what you're building" },
};

function insertionIndex(sections, at) {
  if (at === "afterHero") {
    const hero = sections.findIndex((s) => s && s.type === "hero");
    // No hero (someone rebuilt the page) → put it first rather than guess.
    return hero === -1 ? 0 : hero + 1;
  }
  /* Before the closing CTA. Searched from the END: these pages also carry a
     stickyCta, and matching the first "cta" would land the form in the middle
     of the page. */
  for (let i = sections.length - 1; i >= 0; i--) {
    if (sections[i] && sections[i].type === "cta") return i;
  }
  // No CTA to anchor to — append, but before a trailing stickyCta if present.
  const sticky = sections.findIndex((s) => s && s.type === "stickyCta");
  return sticky === -1 ? sections.length : sticky;
}

const pages = await db.page.findMany({
  where: { slug: { startsWith: "starter-" } },
  select: { id: true, slug: true, title: true, kind: true, sections: true },
});

if (pages.length === 0) {
  console.log(
    'No "starter-*" pages found. Load them from /admin/pages → "Load starter templates";\n' +
      "they will include the form already, so this script is only for older installs.",
  );
}

let added = 0;
let skipped = 0;

for (const p of pages) {
  const sections = Array.isArray(p.sections) ? p.sections : null;
  if (!sections) {
    console.log(`  ${p.slug}: sections is not an array — left alone`);
    continue;
  }
  if (sections.some((s) => s && s.type === "form")) {
    console.log(`  ${p.slug}: already has a form — left alone`);
    skipped++;
    continue;
  }

  /* Any starter-derived page not in the plan (a renamed clone, say) still gets
     a form — just at the safe default position rather than a tuned one. */
  const plan = PLAN[p.slug] ?? { at: "beforeClosingCta", heading: "Get started" };
  const at = insertionIndex(sections, plan.at);
  const next = [...sections];
  next.splice(at, 0, { type: "form", heading: plan.heading, formSlug: FORM_SLUG, hidden: false });

  await db.page.update({ where: { id: p.id }, data: { sections: next } });
  console.log(`  ${p.slug} [${p.kind}]: form added at position ${at + 1} of ${next.length}`);
  added++;
}

if (pages.length) {
  console.log(`\n${added} page(s) updated, ${skipped} already had a form.`);
  if (added) {
    console.log(
      "PUBLISHED landing pages show the change immediately; templates pass it to\n" +
        "future clones. Pages cloned BEFORE this ran keep their own copy of the\n" +
        "sections and were updated above if they still matched starter-*.",
    );
  }
}

await db.$disconnect();
