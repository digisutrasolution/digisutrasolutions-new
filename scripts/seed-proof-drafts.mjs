/**
 * Loads draft testimonials and case studies into the Proof CMS as HIDDEN
 * rows (visible: false), so they never appear on the public site.
 *
 * The wording is written; the factual specifics are left as [bracket]
 * blanks. The owner opens /admin → Proof, replaces the brackets with real
 * details, and flips the row visible. Nothing here is a published claim —
 * every draft is off the site and every fact is a blank to fill.
 *
 * Idempotent: a draft is only created when no row already references that
 * client, so re-running never duplicates and never touches a row you have
 * edited.
 *
 * Run: docker compose exec app node scripts/seed-proof-drafts.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TESTIMONIALS = [
  {
    client: "Denimique",
    role: "[Role], Denimique",
    quote:
      "We had a strong product but almost no online presence. DigiSutra rebuilt our store and ran the campaigns that put us in front of the right buyers — [real result, e.g. online sales tripled in 5 months]. They understand fashion retail, not just ads.",
  },
  {
    client: "Kadak Chai",
    role: "[Role], Kadak Chai",
    quote:
      "From branding to performance ads, DigiSutra treated our business like their own. [Real result, e.g. orders doubled in 3 months], and our WhatsApp ordering now runs on autopilot.",
  },
  {
    client: "Vidytrix",
    role: "[Role], Vidytrix",
    quote:
      "They rebuilt our platform and the content engine around it. [Real result], and it hasn't slowed since. They think like founders, not a vendor.",
  },
  {
    client: "Jobetto",
    role: "[Role], Jobetto",
    quote:
      "Our cost per signup was hurting us. DigiSutra's AI-driven campaigns brought it down — [real result] — while applicant quality went up. Data-driven from day one.",
  },
  {
    client: "Snakiy",
    role: "[Role], Snakiy",
    quote:
      "We needed a store, ads and an audience — fast. DigiSutra delivered all three: [real result] and a store that actually converts.",
  },
  {
    client: "Hitaaksh",
    role: "[Role], Hitaaksh",
    quote:
      "DigiSutra understood our market and built strategies that outperformed what we ran in-house. [Real result] — measurable, consistent, no guesswork.",
  },
  {
    client: "Wallpaper Gallery",
    role: "[Role], Wallpaper Gallery",
    quote:
      "Beautiful products, invisible online. DigiSutra fixed our SEO and ran the ads that brought buyers in — [real result].",
  },
];

/* Four strongest for full case studies — the owner can add more. */
const CASE_STUDIES = [
  { client: "Denimique", slug: "denimique", category: "Web" },
  { client: "Kadak Chai", slug: "kadak-chai", category: "Marketing" },
  { client: "Vidytrix", slug: "vidytrix", category: "Web" },
  { client: "Jobetto", slug: "jobetto", category: "Marketing" },
];

let t = 0;
for (let i = 0; i < TESTIMONIALS.length; i += 1) {
  const d = TESTIMONIALS[i];
  const exists = await prisma.testimonial.findFirst({
    where: { role: { contains: d.client } },
  });
  if (exists) {
    console.log(`ok    testimonial ${d.client} — already present`);
    continue;
  }
  await prisma.testimonial.create({
    data: {
      quote: d.quote,
      name: "[Add client contact name]",
      role: d.role,
      rating: 5,
      order: i,
      visible: false,
    },
  });
  t += 1;
  console.log(`draft testimonial ${d.client}`);
}

let c = 0;
for (let i = 0; i < CASE_STUDIES.length; i += 1) {
  const d = CASE_STUDIES[i];
  const exists = await prisma.caseStudy.findFirst({ where: { slug: d.slug } });
  if (exists) {
    console.log(`ok    case study ${d.client} — already present`);
    continue;
  }
  await prisma.caseStudy.create({
    data: {
      slug: d.slug,
      client: d.client,
      title: "[Headline result — e.g. 3x online sales in 5 months]",
      industry: "[Industry]",
      category: d.category,
      services: [],
      challenge: "[What they came to us for]",
      solution: "[What we did]",
      result: "[The real outcome]",
      metrics: [],
      timeframe: "[e.g. 5 months]",
      order: i,
      visible: false,
    },
  });
  c += 1;
  console.log(`draft case study ${d.client}`);
}

console.log(`\n${t} testimonial draft(s), ${c} case-study draft(s) added — all HIDDEN.`);
await prisma.$disconnect();
