/* Shared blog helpers: category hub metadata + body parsing for TOC and
   key-takeaway extraction. Category `db` values must match BlogPost.category. */

export type BlogCategory = {
  db: string;
  slug: string;
  label: string;
  blurb: string;
  intro: string;
};

export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    db: "SEO",
    slug: "seo",
    label: "SEO & AI search",
    blurb: "Rankings, the map pack, AI Overviews and GEO.",
    intro:
      "Search is where buying decisions start — and in 2026 that means classic Google rankings, the local map pack and being the source AI Overviews and ChatGPT cite. These guides cover technical SEO, local SEO and generative engine optimization (GEO) for startups and SMBs.",
  },
  {
    db: "Marketing",
    slug: "marketing",
    label: "Marketing & ads",
    blurb: "PPC, WhatsApp, email and SMS that pay back.",
    intro:
      "Paid and lifecycle marketing that pays for itself: Google Ads, Meta campaigns, WhatsApp marketing automation, email and SMS flows and lead generation. Practical playbooks with real budgets in mind — written for business owners, not ad-platform enthusiasts.",
  },
  {
    db: "AI",
    slug: "ai",
    label: "AI automation",
    blurb: "Agents, chatbots and workflows that convert.",
    intro:
      "AI automation agents, chatbots and workflows that answer enquiries, chase leads and compile reports around the clock. How to put AI to work in a small marketing operation — what converts, what to measure and what to skip.",
  },
];

export const categoryBySlug = (slug: string) =>
  BLOG_CATEGORIES.find((c) => c.slug === slug);

export const categoryByDb = (db: string) =>
  BLOG_CATEGORIES.find((c) => c.db === db);

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
