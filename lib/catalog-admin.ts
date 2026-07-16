import { z } from "zod";
import { db } from "@/lib/db";
import { DEFAULT_PLANS, DEFAULT_MATRIX, DEFAULT_RATECARD } from "@/lib/pricing";
import { DEFAULT_SERVICES } from "@/lib/services";

/* Server helpers shared by the services/pricing admin routes. */

export const CategorySchema = z.object({
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only."),
  name: z.string().trim().min(2).max(90),
  blurb: z.string().trim().max(160).optional(),
  intro: z.string().trim().max(600).optional(),
  icon: z.string().trim().max(40).nullable().optional(),
  badge: z.string().trim().max(20).nullable().optional(),
  image: z.string().trim().max(600).nullable().optional(),
  stat: z.string().trim().max(20).nullable().optional(),
  statLabel: z.string().trim().max(60).nullable().optional(),
  priceFrom: z.string().trim().max(60).nullable().optional(),
  marketNote: z.string().trim().max(80).nullable().optional(),
  visible: z.boolean().optional(),
});

export const OfferSchema = z.object({
  name: z.string().trim().min(2).max(90),
  blurb: z.string().trim().max(120).optional(),
  highlight: z.boolean().optional(),
  visible: z.boolean().optional(),
});

export const PlanSchema = z.object({
  name: z.string().trim().min(1).max(40),
  price: z.string().trim().min(1).max(30),
  quarterlyPrice: z.string().trim().max(30).nullable().optional(),
  period: z.string().trim().max(10).optional(),
  tagline: z.string().trim().max(120).optional(),
  marketNote: z.string().trim().max(90).nullable().optional(),
  cta: z.string().trim().max(40).optional(),
  featured: z.boolean().optional(),
  visible: z.boolean().optional(),
});

export const MatrixRowSchema = z.object({
  label: z.string().trim().min(1).max(90),
  tooltip: z.string().trim().max(160).nullable().optional(),
  values: z.array(z.string().trim().max(40)).min(1).max(6),
  visible: z.boolean().optional(),
});

export const RateRowSchema = z.object({
  label: z.string().trim().min(1).max(90),
  price: z.string().trim().min(1).max(60),
  marketNote: z.string().trim().max(120).nullable().optional(),
  visible: z.boolean().optional(),
});

export async function bootstrapServicesIfEmpty() {
  const count = await db.serviceCategory.count();
  if (count > 0) return;
  for (let i = 0; i < DEFAULT_SERVICES.length; i++) {
    const s = DEFAULT_SERVICES[i];
    await db.serviceCategory.create({
      data: {
        slug: s.slug,
        name: s.name,
        blurb: s.blurb,
        intro: s.intro,
        icon: s.icon,
        badge: s.badge ?? null,
        image: s.image ?? null,
        stat: s.stat ?? null,
        statLabel: s.statLabel ?? null,
        priceFrom: s.priceFrom ?? null,
        marketNote: s.marketNote ?? null,
        order: i,
        offers: {
          create: s.offers.map((o, j) => ({
            name: o.name,
            blurb: o.blurb ?? "",
            highlight: o.highlight ?? false,
            order: j,
          })),
        },
      },
    });
  }
}

export async function bootstrapPricingIfEmpty() {
  const count = await db.pricingPlan.count();
  if (count > 0) return;
  await db.pricingPlan.createMany({
    data: DEFAULT_PLANS.map((p, i) => ({
      name: p.name,
      price: p.price,
      quarterlyPrice: p.quarterlyPrice ?? null,
      period: p.period ?? "/mo",
      tagline: p.tagline ?? "",
      marketNote: p.marketNote ?? null,
      cta: p.cta ?? "Choose plan",
      featured: p.featured ?? false,
      order: i,
    })),
  });
  await db.pricingRow.createMany({
    data: DEFAULT_MATRIX.map((r, i) => ({
      label: r.label,
      tooltip: r.tooltip ?? null,
      values: r.values,
      order: i,
    })),
  });
  await db.rateCardRow.createMany({
    data: DEFAULT_RATECARD.map((r, i) => ({
      label: r.label,
      price: r.price,
      marketNote: r.marketNote ?? null,
      order: i,
    })),
  });
}
