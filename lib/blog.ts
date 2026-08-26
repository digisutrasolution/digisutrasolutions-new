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

/**
 * Does this category belong to no hub at all?
 *
 * An orphaned post is still on /blog and still reachable by its URL, but it is
 * absent from its topic page, uncounted in the hub cards, and its breadcrumb
 * loses the hub link — in the visible trail and in the BreadcrumbList JSON-LD.
 *
 * The schema default is "General", which matches nothing, so this used to be
 * the state EVERY new post was born in. The create form and the publish gate
 * both check it; one definition so they cannot disagree about what counts.
 */
export const isOrphanCategory = (category: string): boolean =>
  !categoryByDb(category);

/**
 * Published posts in a hub, summed from a `groupBy(["category"])` result.
 *
 * Sums every stored value that RESOLVES to the hub rather than looking for one
 * exact row: posts filed as "Performance Marketing" or "SEO Tools" were counted
 * as zero, and the hub page filtered the same way, so they were unreachable too
 * — which is why cards read 0 beside content that plainly existed.
 *
 * Shared rather than closed over in one page: the index cards and the hub rail
 * both print these counts, and two copies would be two chances to drift.
 */
export const hubCount = (
  counts: { category: string; _count: { _all: number } }[],
  cat: BlogCategory,
): number =>
  counts.reduce(
    (n, c) => (categoryByDb(c.category)?.slug === cat.slug ? n + c._count._all : n),
    0,
  );

export function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/**
 * Is this body editor HTML rather than the legacy text format?
 *
 * Both shapes exist at once, and will for a while: the deploy that ships the
 * rich editor reaches production before the migration is run against it, and
 * anything written earlier keeps its original text until someone edits it.
 * Everything that reads a body therefore handles both rather than assuming.
 *
 * Client-safe on purpose — BlogBody renders in the editor preview as well as
 * on the server, so this cannot sit beside the sanitiser in the server-only
 * module.
 */
export function isHtmlBody(body: string): boolean {
  return /<(p|h2|h3|h4|ul|ol|blockquote|figure|table|pre|img|hr)\b/i.test(body);
}

/** Strip tags and decode the few entities an editor emits. */
function textOf(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** H2 headings from a post body, with anchor ids — both formats.
    Ids come from the same slugifyHeading either way, so an anchor already
    published against a post keeps resolving after that post is migrated. */
export function extractHeadings(body: string) {
  if (isHtmlBody(body)) {
    const out: { id: string; text: string }[] = [];
    const re = /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(body)) !== null) {
      const text = textOf(m[1]);
      if (text) out.push({ id: slugifyHeading(text), text });
    }
    return out;
  }
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
  if (isHtmlBody(body)) {
    const out: string[] = [];
    /* The first paragraph after each h2. Post copy is written answer-first,
       which is exactly what makes its opening sentence stand alone. */
    const re = /<h2\b[^>]*>[\s\S]*?<\/h2>\s*<p\b[^>]*>([\s\S]*?)<\/p>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(body)) !== null && out.length < max) {
      const sentence = textOf(m[1]).split(/(?<=[.!?])\s/)[0]?.trim();
      if (sentence && sentence.length > 20) out.push(sentence);
    }
    return out;
  }

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
