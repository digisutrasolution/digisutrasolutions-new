import Image from "next/image";
import { withBase } from "@/lib/base-path";
import type { ClientLogo } from "@/lib/proof";

/**
 * "Our clients" band above the footer: a fixed left label, then a marquee
 * of the real client logos in uniform white cards so brand marks with
 * different backgrounds and aspect ratios read at the same visual weight.
 * A client with no logo image falls back to its name as a wordmark.
 *
 * Headline stats live on /work, not here, so the logos are never crowded by
 * numbers. Every entry is a real client from the CMS, so a band headed "Our
 * clients" never lists a company that is not one — with the table empty the
 * whole band hides.
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
          style={{ animationDuration: "55s" }}
        >
          {loop.map((c, i) => (
            <span
              key={`${c.name}-${i}`}
              aria-hidden={i >= clients.length || undefined}
              title={c.name}
              className="flex h-12 w-[136px] shrink-0 items-center justify-center rounded-xl border border-[#F0E7DE] bg-white px-5 transition-colors hover:border-[#F26419]"
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
    </div>
  );
}
