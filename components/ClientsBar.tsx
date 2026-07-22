import Image from "next/image";
import { withBase } from "@/lib/base-path";
import type { ClientLogo } from "@/lib/proof";

/**
 * "Our clients" trust strip above the footer: a marquee of real client
 * logos in uniform white cards, so brand marks with different backgrounds
 * and aspect ratios all read at the same visual weight. A client without a
 * logo image falls back to its name as a wordmark.
 *
 * Every entry is a real client from the CMS, so a bar headed "Our clients"
 * never lists a company that is not one — with the table empty the whole
 * strip hides.
 */
export default function ClientsBar({ clients = [] }: { clients?: ClientLogo[] }) {
  if (clients.length === 0) return null;

  // Enough copies that the -50% marquee half outspans an ultrawide viewport.
  const loop = [...clients, ...clients, ...clients, ...clients];

  return (
    <div
      aria-label="Our clients"
      className="flex items-stretch border-t border-stone-200/70 bg-white"
    >
      <div className="hidden shrink-0 items-center gap-2 border-r border-[#FFE3CC] bg-[#FFF6EF] px-5 sm:flex">
        <span className="h-1.5 w-1.5 rounded-full bg-[#F26419]" aria-hidden />
        <span className="whitespace-nowrap text-[0.7rem] font-black uppercase tracking-[0.16em] text-orange-800">
          Our clients
        </span>
      </div>

      <div className="relative flex-1 overflow-hidden py-3">
        <div
          className="flex w-max items-center gap-3 hover:[animation-play-state:paused] animate-marquee"
          style={{ animationDuration: "60s" }}
        >
          {loop.map((c, i) => (
            <span
              key={`${c.name}-${i}`}
              aria-hidden={i >= clients.length || undefined}
              title={c.name}
              className="flex h-11 min-w-[132px] items-center justify-center rounded-xl border border-[#F0E7DE] bg-white px-5 transition-colors hover:border-[#F26419]"
            >
              {c.imageUrl ? (
                <span className="relative h-7 w-[104px]">
                  <Image
                    src={withBase(c.imageUrl)}
                    alt={c.name}
                    fill
                    sizes="104px"
                    className="object-contain"
                  />
                </span>
              ) : (
                <span className="whitespace-nowrap text-sm font-bold text-stone-500">
                  {c.name}
                </span>
              )}
            </span>
          ))}
        </div>
        <span
          className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white to-transparent"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent"
          aria-hidden
        />
      </div>

      {/* Owner-confirmed headline figures. Keep these in sync with the STATS
          on /work and lib/data.ts — they are the same claim in three
          places. */}
      <div className="hidden shrink-0 items-center gap-4 self-stretch border-l border-stone-200/70 bg-[#FAFAF9] px-5 lg:flex">
        <span className="whitespace-nowrap text-xs text-stone-600">
          <b className="font-display font-extrabold text-[#F26419]">120+</b> happy clients
        </span>
        <span className="whitespace-nowrap text-xs text-stone-600">
          <b className="font-display font-extrabold text-[#F26419]">12</b> countries
        </span>
        <span className="whitespace-nowrap text-xs text-stone-600">
          <b className="font-display font-extrabold text-[#F26419]">5.8×</b> avg ROAS
        </span>
      </div>
    </div>
  );
}
