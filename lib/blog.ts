/* Shared blog helpers: category hub metadata + body parsing for TOC and
   key-takeaway extraction. Category `db` values must match BlogPost.category. */

export type BlogCategory = {
  db: string;
  slug: string;
  label: string;
  blurb: string;
  intro: string;
  /* Other values of BlogPost.category that belong to this hub.
     The category field was a free-text box for a long time, so real posts are
     filed as "Performance Marketing" and "SEO Tools" rather than the three
     canonical names. Matching only `db` left those posts uncounted AND
     unreachable — the hub page filters on the same value. Aliases absorb them
     without anyone re-editing published work. */
  aliases: string[];
};

export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    db: "SEO",
    slug: "seo",
    label: "SEO & AI search",
    aliases: ["SEO Tools", "Search", "Local SEO", "Technical SEO", "AEO", "GEO", "AI Search"],
    blurb: "Rankings, the map pack, AI Overviews and GEO.",
    intro:
      "Search is where buying decisions start — and in 2026 that means classic Google rankings, the local map pack and being the source AI Overviews and ChatGPT cite. These guides cover technical SEO, local SEO and generative engine optimization (GEO) for startups and SMBs.",
  },
  {
    db: "Marketing",
    slug: "marketing",
    label: "Marketing & ads",
    aliases: [
      "Performance Marketing",
      "Social Media",
      "Social Media Marketing",
      "PPC",
      "Google Ads",
      "Paid Ads",
      "Email Marketing",
      "Content Marketing",
      "Marketing & Growth",
      "Lead Generation",
    ],
    blurb: "PPC, WhatsApp, email and SMS that pay back.",
    intro:
      "Paid and lifecycle marketing that pays for itself: Google Ads, Meta campaigns, WhatsApp marketing automation, email and SMS flows and lead generation. Practical playbooks with real budgets in mind — written for business owners, not ad-platform enthusiasts.",
  },
  {
    db: "AI",
    slug: "ai",
    label: "AI automation",
    aliases: ["AI & Automation", "Automation", "Chatbots", "AI Agents", "Workflows"],
    blurb: "Agents, chatbots and workflows that convert.",
    intro:
      "AI automation agents, chatbots and workflows that answer enquiries, chase leads and compile reports around the clock. How to put AI to work in a small marketing operation — what converts, what to measure and what to skip.",
  },
  {
    /* Added because web build posts had no hub at all — even a perfect alias
       map left them homeless, and website development is a service the agency
       actually sells. */
    db: "Web",
    slug: "web",
    label: "Web & design",
    aliases: [
      "Website Design & Development",
      "Web Development",
      "Website Design",
      "Web Design",
      "E-commerce",
      "Ecommerce",
      "UI/UX",
      "Branding",
    ],
    blurb: "Sites and stores built to convert, not just to look good.",
    intro:
      "Websites, e-commerce stores and the design decisions underneath them. What actually moves conversion rate, how site speed and structure feed SEO, and what to get right before a build starts rather than after launch.",
  },
];

export const categoryBySlug = (slug: string) =>
  BLOG_CATEGORIES.find((c) => c.slug === slug);

/* Casing and stray spaces are the commonest drift — "seo", "SEO " and "SEO"
   are one category to a human. Normalising catches those without anyone
   having to list each variant as an alias. */
const norm = (v: string) => v.trim().toLowerCase();

/** Every stored category value that belongs to this hub. */
export const categoryKeysFor = (cat: BlogCategory): string[] => [cat.db, ...cat.aliases];

/**
 * The hub a stored BlogPost.category belongs to.
 *
 * Name kept as `categoryByDb` because four call sites already import it — the
 * behaviour widens from "exact match on db" to "db or any alias, ignoring case
 * and surrounding space".
 */
export const categoryByDb = (db: string): BlogCategory | undefined => {
  const n = norm(db ?? "");
  if (!n) return undefined;
  return BLOG_CATEGORIES.find((c) => categoryKeysFor(c).some((k) => norm(k) === n));
};

export function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** H2 headings ("## ") from a post body, with anchor ids. */
export function extractHeadings(body: string) {
  return body
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter((b) => b.startsWith("## "))
    .map((b) => {
      const text = b.slice(3).trim();
      return { id: slugifyHeading(text), text };
    });
}

/** First sentence under each H2 — answer-first copy makes these liftable. */
export function extractTakeaways(body: string, max = 4) {
  const blocks = body
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  const takeaways: string[] = [];
  for (let i = 0; i < blocks.length && takeaways.length < max; i++) {
    if (!blocks[i].startsWith("## ")) continue;
    const next = blocks[i + 1];
    if (!next || next.startsWith("#")) continue;
    const sentence = next.split(/(?<=[.!?])\s/)[0]?.trim();
    if (sentence && sentence.length > 20) takeaways.push(sentence);
  }
  return takeaways;
}
