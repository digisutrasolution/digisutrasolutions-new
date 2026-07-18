import { z } from "zod";
import { db } from "@/lib/db";
import { DEFAULT_FAQ_ITEMS } from "@/lib/faq";

/* Server helpers shared by the FAQ admin routes. */

export const FaqSchema = z.object({
  question: z.string().trim().min(5).max(160),
  lead: z.string().trim().max(240).optional(),
  rest: z.string().trim().max(600).optional(),
  category: z.string().trim().min(2).max(50).optional(),
  icon: z.string().trim().max(40).nullable().optional(),
  featured: z.boolean().optional(),
  visible: z.boolean().optional(),
});

export async function bootstrapFaqsIfEmpty() {
  const count = await db.faqItem.count();
  if (count > 0) return;
  await db.faqItem.createMany({
    data: DEFAULT_FAQ_ITEMS.map((f, i) => ({
      question: f.question,
      lead: f.lead,
      rest: f.rest,
      category: f.category,
      icon: f.icon ?? null,
      featured: f.featured ?? false,
      order: i,
    })),
  });
}
