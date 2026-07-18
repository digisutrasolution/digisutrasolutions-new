import { db } from "@/lib/db";
import { FAQS } from "@/lib/data";

/* Dynamic FAQ catalog. Admin edits FaqItem rows directly (visible toggle
   gates the public site, featured gates the home section); these defaults
   seed the DB on first admin load and are the render fallback. */

export type FaqDef = {
  question: string;
  lead: string;
  rest: string;
  category: string;
  icon?: string;
  featured?: boolean;
};

/* Category + icon assignments for the 8 original home FAQs (lib/data.ts
   FAQS stays the raw copy source — icon keys mirror the old positional
   ICONS list in Faq.tsx). All 8 stay featured on the home page. */
const HOME_FAQ_META: { category: string; icon: string }[] = [
  { category: "Pricing & engagement", icon: "calculator" },
  { category: "SEO & AI search", icon: "timer" },
  { category: "Working with us", icon: "fileSearch" },
  { category: "SEO & AI search", icon: "search" },
  { category: "AI automation & CRM", icon: "bot" },
  { category: "Pricing & engagement", icon: "badgeCheck" },
  { category: "Working with us", icon: "earth" },
  { category: "Working with us", icon: "messageCircle" },
];

export const DEFAULT_FAQ_ITEMS: FaqDef[] = FAQS.map((f, i) => ({
  question: f.q,
  lead: f.lead,
  rest: f.rest,
  category: HOME_FAQ_META[i]?.category ?? "General",
  icon: HOME_FAQ_META[i]?.icon,
  featured: true,
}));

/* Display order for /faq category sections; unknown categories append. */
export const FAQ_CATEGORY_ORDER = [
  "Pricing & engagement",
  "SEO & AI search",
  "Ads & lead generation",
  "Websites & e-commerce",
  "AI automation & CRM",
  "Working with us",
  "General",
];

export type LiveFaq = FaqDef & { id?: string };

/** Visible FAQ entries for public pages; defaults if DB empty/down. */
export async function getLiveFaqs(opts?: { featuredOnly?: boolean }): Promise<LiveFaq[]> {
  try {
    const rows = await db.faqItem.findMany({
      where: { visible: true, ...(opts?.featuredOnly ? { featured: true } : {}) },
      orderBy: { order: "asc" },
    });
    if (rows.length > 0) {
      return rows.map((f) => ({
        id: f.id,
        question: f.question,
        lead: f.lead,
        rest: f.rest,
        category: f.category,
        icon: f.icon ?? undefined,
        featured: f.featured,
      }));
    }
  } catch {
    /* fall through to defaults */
  }
  return opts?.featuredOnly
    ? DEFAULT_FAQ_ITEMS.filter((f) => f.featured)
    : DEFAULT_FAQ_ITEMS;
}

/** Visible FAQs grouped into ordered category sections for /faq. */
export function groupFaqs(faqs: LiveFaq[]) {
  const byCategory = new Map<string, LiveFaq[]>();
  for (const f of faqs) {
    const list = byCategory.get(f.category) ?? [];
    list.push(f);
    byCategory.set(f.category, list);
  }
  const known = FAQ_CATEGORY_ORDER.filter((c) => byCategory.has(c));
  const extra = [...byCategory.keys()].filter((c) => !FAQ_CATEGORY_ORDER.includes(c));
  return [...known, ...extra].map((category) => ({
    category,
    faqs: byCategory.get(category)!,
  }));
}
