/* Create /get-started — a standalone page built around the lead form.
 *
 * The site had no page whose job was simply "leave your details". /contact is
 * a full contact directory with desks and phone numbers, and /free-audit sells
 * one specific offer. This is the short one you can point a link at.
 *
 * CREATE-IF-MISSING, never overwrite. scripts/update-about-page.mjs rewrites
 * its sections array on every run, which means anything an admin deletes comes
 * back on the next deploy — a trap worth not repeating. Once this page exists
 * the CMS owns it and this script does nothing.
 *
 *   docker compose exec app node scripts/seed-get-started-page.mjs
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const SLUG = "get-started";

const existing = await db.page.findUnique({
  where: { slug: SLUG },
  select: { id: true, status: true },
});

if (existing) {
  console.log(`/${SLUG} already exists (${existing.status}) — left untouched.`);
} else {
  /* kind PAGE, not LANDING: this one keeps the site header and footer. It is a
     normal page people reach from the site, not a no-chrome destination for a
     paid click. */
  const page = await db.page.create({
    data: {
      title: "Get started",
      slug: SLUG,
      kind: "PAGE",
      status: "PUBLISHED",
      publishedAt: new Date(),
      noIndex: false,
      seoTitle: "Get started with DigiSutra",
      seoDescription:
        "Tell us what you need and we'll come back within one business day with the right person and a straight answer.",
      sections: [
        {
          type: "hero",
          eyebrow: "Start here",
          heading: "Tell us what you need",
          highlight: "we'll do the rest",
          copy: "One short form. We'll come back within one business day with the right person on it — not a sales sequence.",
          ctaLabel: "",
          ctaHref: "",
          cta2Label: "",
          cta2Href: "",
          hidden: false,
        },
        { type: "form", heading: "", formSlug: "lead-form", hidden: false },
        { type: "logos", heading: "Trusted by", ids: [], limit: 8, hidden: false },
        {
          type: "faq",
          heading: "Before you send it",
          items: [
            {
              q: "How quickly will I hear back?",
              a: "Within one business day, from the person who would actually run the work — not a call centre.",
            },
            {
              q: "Do I need to know exactly what I want?",
              a: "No. A sentence about what isn't working is enough to start from.",
            },
            {
              q: "What happens to my details?",
              a: "They stay with us. We don't resell data and we don't add you to a mailing list you didn't ask for.",
            },
          ],
          hidden: false,
        },
      ],
    },
    select: { id: true, slug: true },
  });

  // Versioning is what the editor's history reads; a page created without an
  // initial version shows an empty timeline.
  await db.pageVersion
    .create({
      data: {
        pageId: page.id,
        version: 1,
        title: "Get started",
        sections: [],
        seoSnapshot: {},
        note: "Created by seed-get-started-page.mjs",
      },
    })
    .catch(() => {
      /* Version history is a nicety — never fail page creation over it. */
    });

  console.log(`Created /${page.slug} (PUBLISHED).`);
}

/* The page is worthless if the form it embeds is not wired to the CRM. */
const form = await db.form.findUnique({
  where: { slug: "lead-form" },
  select: { destination: true, isActive: true },
});
if (!form) {
  console.log('\n  WARNING: no "lead-form" exists — the page will render without a form.');
} else if (!form.isActive || form.destination !== "lead") {
  console.log(
    `\n  WARNING: lead-form is active=${form.isActive}, destination="${form.destination}".\n` +
      '  Set it active and to "store + create a Lead" in /admin/forms, or submissions never reach the CRM.',
  );
}

await db.$disconnect();
