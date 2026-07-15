import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { AdPlacement } from "@prisma/client";
import { db } from "@/lib/db";

/* Managed sponsor slot: newest active banner for the placement (schedule-
   aware). Impressions counted on render; clicks via /api/ads/[id]/click.
   Renders nothing when no banner is live — the slot costs no layout. */
export default async function AdSlot({ placement }: { placement: AdPlacement }) {
  const now = new Date();
  const ad = await db.adBanner
    .findFirst({
      where: {
        placement,
        active: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: { createdAt: "desc" },
    })
    .catch(() => null);
  if (!ad) return null;

  await db.adBanner
    .update({ where: { id: ad.id }, data: { impressions: { increment: 1 } } })
    .catch(() => {});

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
        Sponsored
      </p>
      <a
        href={`/api/ads/${ad.id}/click`}
        target="_blank"
        rel="sponsored noopener"
        className="group mt-3 block overflow-hidden rounded-2xl border border-stone-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-[#F26419]"
      >
        {ad.imageUrl && (
          <div className="relative h-28 overflow-hidden bg-stone-900">
            <Image
              src={ad.imageUrl}
              alt={ad.title}
              fill
              sizes="320px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
        <div className="p-4">
          <p className="font-display text-sm font-bold text-stone-900">
            {ad.title}
          </p>
          {ad.description && (
            <p className="mt-1 text-xs leading-relaxed text-stone-500">
              {ad.description}
            </p>
          )}
          <p className="mt-2.5 flex items-center gap-1 text-xs font-bold text-[#F26419]">
            Learn more
            <ArrowRight
              size={12}
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            />
          </p>
        </div>
      </a>
    </div>
  );
}
