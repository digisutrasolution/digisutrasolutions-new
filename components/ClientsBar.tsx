import Image from "next/image";
import { withBase } from "@/lib/base-path";
import type { ClientLogo } from "@/lib/proof";

/**
 * "Our clients" section above the footer: an eyebrow, a heading, then a
 * marquee of the real client logos in uniform white cards so brand marks
 * with different backgrounds and aspect ratios read at the same visual
 * weight. A client with no logo image falls back to its name as a wordmark.
 *
 * Headline stats live on /work, not here, so the logos are never crowded by
 * numbers. Every entry is a real client from the CMS, so a section headed
 * "Our clients" never lists a company that is not one — with the table
 * empty the whole section hides.
 */
export default function ClientsBar({ clients = [] }: { clients?: ClientLogo[] }) {
  if (clients.length === 0) return null;

  // Enough copies that the -50% marquee half outspans an ultrawide viewport.
  const loop = [...clients, ...clients, ...clients, ...clients];

  return (
    <section
      aria-label="Our clients"
      className="border-t border-stone-200/70 bg-[#FFFBF7]"
    >
      <div className="py-12 sm:py-14">
        <div className="mx-auto max-w-[1280px] px-6 text-center">
          <p className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-orange-800">
            Trusted by growing brands
          </p>
          <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
            Brands that grow with{" "}
            <span className="font-serif-accent font-medium italic text-[#F26419]">
              DigiSutra
            </span>
          </h2>
        </div>

        <div className="relative mt-8 overflow-hidden">
          <div
            className="flex w-max items-center gap-3 hover:[animation-play-state:paused] animate-marquee sm:gap-4"
            style={{ animationDuration: "55s" }}
          >
            {loop.map((c, i) => (
              <span
                key={`${c.name}-${i}`}
                aria-hidden={i >= clients.length || undefined}
                title={c.name}
                className="flex h-14 w-[140px] shrink-0 items-center justify-center rounded-xl border border-[#F0E7DE] bg-white px-5 transition-colors hover:border-[#F26419]"
              >
                {c.imageUrl ? (
                  <span className="relative h-8 w-[108px]">
                    <Image
                      src={withBase(c.imageUrl)}
                      alt={c.name}
                      fill
                      sizes="108px"
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
            className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#FFFBF7] to-transparent"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#FFFBF7] to-transparent"
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}
