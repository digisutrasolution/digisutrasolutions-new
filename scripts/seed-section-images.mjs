/**
 * Gives the editorial richText blocks a starting side image + eyebrow.
 *
 * Idempotent and non-destructive: a block is only touched when its image
 * is still blank, so anything set (or cleared) in admin afterwards wins.
 * Run once per environment: node scripts/seed-section-images.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* slug -> heading of the block -> what to set. Matching on the heading
   rather than the array index survives editors reordering sections. */
const SEEDS = {
  about: {
    "Why we exist": {
      eyebrow: "Our story",
      image: "/section-images/why-we-exist.jpg",
      imageAlt: "DigiSutra strategists and engineers working together around one table",
    },
  },
  "about/global-presence": {
    "How remote delivery works": {
      eyebrow: "Global presence",
      image: "/section-images/remote-delivery.jpg",
      imageAlt: "Earth at night showing lit-up cities across continents",
    },
  },
  career: {
    "How we work": {
      eyebrow: "Life at DigiSutra",
      image: "/section-images/how-we-work.jpg",
      imageAlt: "A team mapping out a campaign on a wall of sticky notes",
    },
  },
  careers: {
    "How we hire": {
      eyebrow: "Hiring",
      image: "/section-images/how-we-hire.jpg",
      imageAlt: "Two people shaking hands after an interview",
    },
  },
  "news-media/latest-news": {
    Recent: {
      eyebrow: "Newsroom",
      image: "/section-images/newsroom-recent.jpg",
      imageAlt: "A stack of folded business newspapers",
    },
  },
};

let changed = 0;

for (const [slug, byHeading] of Object.entries(SEEDS)) {
  const page = await prisma.page.findUnique({
    where: { slug },
    select: { id: true, sections: true },
  });
  if (!page) {
    console.log(`skip  ${slug} — no such page`);
    continue;
  }
  const sections = Array.isArray(page.sections) ? page.sections : [];
  let touched = false;

  const next = sections.map((s) => {
    if (!s || s.type !== "richText") return s;
    const seed = byHeading[s.heading];
    if (!seed || (s.image ?? "").trim()) return s;
    touched = true;
    return { ...s, ...seed };
  });

  if (!touched) {
    console.log(`ok    ${slug} — already set or heading not found`);
    continue;
  }
  await prisma.page.update({ where: { id: page.id }, data: { sections: next } });
  changed += 1;
  console.log(`wrote ${slug}`);
}

console.log(`\n${changed} page(s) updated.`);
await prisma.$disconnect();
