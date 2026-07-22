import Image from "next/image";
import { withBase } from "@/lib/base-path";
import type { ClientLogo } from "@/lib/proof";

/**
 * "Our clients" section above the footer: an eyebrow, a heading, then the
 * real client logos in uniform white cards so brand marks with different
 * backgrounds and aspect ratios read at the same visual weight. A client
 * with no logo image falls back to its name as a wordmark.
 *
 * At seven clients this wraps rather than scrolls — a marquee for so few
 * just loops distractingly. Headline stats live on /work, not here, so the
 * logos are never crowded by numbers.
 *
 * Every entry is a real client from the CMS, so a section headed "Our
 * clients" never lists a company that is not one — with the table empty the
 * whole section hides.
 */
export default function ClientsBar({ clients = [] }: { clients?: ClientLogo[] }) {
  if (clients.length === 0) return null;

  return (
    <section
      aria-label="Our clients"
      className="border-t border-stone-200/70 bg-[#FFFBF7]"
    >
      <div className="mx-auto max-w-[1280px] px-6 py-12 sm:py-14">
        <div className="text-center">
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

        <ul className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {clients.map((c) => (
            <li
              key={c.name}
              title={c.name}
              className="flex h-14 w-[140px] items-center justify-center rounded-xl border border-[#F0E7DE] bg-white px-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#F26419] hover:shadow-[0_10px_28px_rgba(124,45,18,0.10)]"
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
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
