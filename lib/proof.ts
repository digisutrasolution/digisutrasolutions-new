import { db } from "@/lib/db";
import type { WorkCategory } from "@/lib/data";
import type { WorkCase } from "@/lib/work-data";

/**
 * Public readers for the social-proof tables. There is deliberately no
 * seed data and no fallback content: an empty table means the agency has
 * not published that proof yet, and every consumer renders nothing rather
 * than inventing a placeholder.
 */

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  rating: number;
};

export type ClientLogo = {
  name: string;
  imageUrl: string | null;
  websiteUrl: string | null;
};

const CATEGORIES: WorkCategory[] = ["Web", "Marketing", "AI"];
const asCategory = (v: string): WorkCategory =>
  (CATEGORIES as string[]).includes(v) ? (v as WorkCategory) : "Web";

/* Metrics are stored as JSON; anything that is not a {value,label} pair is
   dropped rather than rendered as "undefined". */
function asMetrics(value: unknown): { value: string; label: string }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((m) =>
    m && typeof m === "object" && "value" in m && "label" in m
      ? [{ value: String(m.value), label: String(m.label) }]
      : [],
  );
}

export async function getLiveTestimonials(): Promise<Testimonial[]> {
  try {
    const rows = await db.testimonial.findMany({
      where: { visible: true },
      orderBy: { order: "asc" },
    });
    return rows.map((r) => ({
      quote: r.quote,
      name: r.name,
      role: r.role,
      rating: Math.min(5, Math.max(1, r.rating)),
    }));
  } catch {
    return [];
  }
}

export async function getLiveClientLogos(): Promise<ClientLogo[]> {
  try {
    const rows = await db.clientLogo.findMany({
      where: { visible: true },
      orderBy: { order: "asc" },
    });
    return rows.map((r) => ({
      name: r.name,
      imageUrl: r.imageUrl,
      websiteUrl: r.websiteUrl,
    }));
  } catch {
    return [];
  }
}

export async function getLiveCaseStudies(): Promise<WorkCase[]> {
  try {
    const rows = await db.caseStudy.findMany({
      where: { visible: true },
      orderBy: { order: "asc" },
    });
    return rows.map((r) => ({
      slug: r.slug,
      client: r.client,
      title: r.title,
      industry: r.industry,
      category: asCategory(r.category),
      services: r.services,
      challenge: r.challenge,
      solution: r.solution,
      result: r.result,
      metrics: asMetrics(r.metrics),
      timeframe: r.timeframe,
      image: r.image ?? "",
    }));
  } catch {
    return [];
  }
}
