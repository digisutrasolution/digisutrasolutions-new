import type { WorkCategory } from "@/lib/data";

/* Portfolio case studies for /work — outcome-led, written 2026-07-18.
   Kart360 + FinEdge metrics are the fixed house figures used site-wide
   (CASE_STUDIES, testimonials); keep them in sync if edited. */

export type WorkCase = {
  slug: string;
  client: string;
  title: string;
  industry: string;
  category: WorkCategory;
  services: string[];
  challenge: string;
  solution: string;
  result: string;
  metrics: { value: string; label: string }[];
  timeframe: string;
  image: string;
};

/* Real case studies only. /work renders its empty state while this is
   empty, and the ItemList schema is omitted rather than naming clients
   that do not exist. */
export const WORK_CASES: WorkCase[] = [];
