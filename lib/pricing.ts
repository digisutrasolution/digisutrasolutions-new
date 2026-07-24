import { db } from "@/lib/db";

/* Dynamic pricing: plans (cards), matrix rows (feature comparison, one value
   per plan in plan order) and the one-off rate card. Direct-edit from admin;
   defaults seed on first admin load and are the public fallback. */

export type PlanDef = {
  name: string;
  price: string;
  quarterlyPrice?: string;
  /* Owner-entered USD equivalents, not converted at render: a pricing page
     wants round marketing numbers and must not drift with the FX rate. */
  priceUsd?: string;
  quarterlyPriceUsd?: string;
  period?: string;
  tagline?: string;
  marketNote?: string;
  cta?: string;
  featured?: boolean;
};

export type MatrixRowDef = { label: string; tooltip?: string; values: string[] };
export type RateRowDef = {
  label: string;
  price: string;
  priceUsd?: string;
  marketNote?: string;
};

/* USD display prefers these owner-entered strings and falls back to the
   rate conversion in lib/currency.ts when one is blank, so the toggle always
   works and typed-in marketing numbers simply override the converted ones. */

export const DEFAULT_PLANS: PlanDef[] = [
  {
    name: "Starter",
    price: "₹19,999",
    quarterlyPrice: "₹17,599",
    tagline: "For businesses starting their digital journey",
    marketNote: "market bills ₹20k–50k for this single-channel scope",
    cta: "Start with Starter",
  },
  {
    name: "Growth",
    price: "₹49,999",
    quarterlyPrice: "₹43,999",
    tagline: "Full-funnel growth for scaling brands",
    marketNote: "bought separately this stack totals ₹80,000+/mo",
    cta: "Get my growth plan",
    featured: true,
  },
  {
    name: "Scale",
    price: "Custom",
    period: "",
    tagline: "AI agents, custom platforms, multi-market growth",
    cta: "Talk to sales",
  },
];

export const DEFAULT_MATRIX: MatrixRowDef[] = [
  {
    label: "SEO + AI Search (AEO/GEO)",
    tooltip: "Rankings plus citations in AI answers",
    values: ["✓", "✓ advanced", "✓ multi-market"],
  },
  { label: "Paid channels managed", values: ["1", "3 + CRO", "Unlimited"] },
  { label: "WhatsApp + email automation", values: ["—", "✓", "✓ + AI agents"] },
  { label: "Landing pages", values: ["1", "Unlimited", "Unlimited"] },
  { label: "Reporting", values: ["Monthly", "Live dashboard", "Live + SLA"] },
  { label: "Account manager", values: ["Shared", "Dedicated", "Dedicated team"] },
];

export const DEFAULT_RATECARD: RateRowDef[] = [
  { label: "SEO retainer (monthly)", price: "₹15,000–₹40,000/mo", marketNote: "market runs ₹20k–₹50k/mo for SMB SEO" },
  { label: "Google/Meta ads management", price: "from ₹15,000/mo", marketNote: "market: ₹15k–₹60k/mo flat or 10–20% of spend" },
  { label: "AI automation setup (chatbot + WhatsApp)", price: "from ₹40,000", marketNote: "market: ₹75k–₹4L for SMB AI chatbot builds" },
  { label: "Business website", price: "₹35,000–₹1,20,000", marketNote: "market: ₹40k–₹1.5L; mid-market clusters ₹80k–₹2L" },
  { label: "E-commerce store (Shopify/WooCommerce)", price: "from ₹60,000", marketNote: "market sweet spot ₹75k–₹2L launch-ready" },
  { label: "Mobile app (Flutter/React Native)", price: "from ₹3,00,000", marketNote: "market: ₹3L–₹8L for an MVP with backend" },
  { label: "Brand identity package", price: "from ₹45,000", marketNote: "market: ₹50k–₹2L at mid-market agencies" },
  { label: "CRM setup (Zoho/HubSpot)", price: "from ₹50,000", marketNote: "partners quote ₹75k–₹2.5L for SMB scope" },
];

export async function getLivePricing() {
  try {
    const [plans, matrix, rateCard] = await Promise.all([
      db.pricingPlan.findMany({ where: { visible: true }, orderBy: { order: "asc" } }),
      db.pricingRow.findMany({ where: { visible: true }, orderBy: { order: "asc" } }),
      db.rateCardRow.findMany({ where: { visible: true }, orderBy: { order: "asc" } }),
    ]);
    if (plans.length > 0) {
      return {
        plans: plans.map((p) => ({
          name: p.name,
          price: p.price,
          quarterlyPrice: p.quarterlyPrice ?? undefined,
          priceUsd: p.priceUsd ?? undefined,
          quarterlyPriceUsd: p.quarterlyPriceUsd ?? undefined,
          period: p.period,
          tagline: p.tagline,
          marketNote: p.marketNote ?? undefined,
          cta: p.cta,
          featured: p.featured,
        })),
        matrix: matrix.map((r) => ({
          label: r.label,
          tooltip: r.tooltip ?? undefined,
          values: (r.values as string[]) ?? [],
        })),
        rateCard: rateCard.map((r) => ({
          label: r.label,
          price: r.price,
          priceUsd: r.priceUsd ?? undefined,
          marketNote: r.marketNote ?? undefined,
        })),
      };
    }
  } catch {
    /* fall through */
  }
  return {
    plans: DEFAULT_PLANS.map((p) => ({ period: "/mo", ...p })),
    matrix: DEFAULT_MATRIX,
    rateCard: DEFAULT_RATECARD,
  };
}
