import Image from "next/image";
import { Check, Minus } from "lucide-react";
import Reveal from "@/components/Reveal";
import { withBase } from "@/lib/base-path";
import type { Section } from "@/lib/cms/sections";

/* Conversion blocks that carry their own content (as opposed to the
   library-backed ones in LibraryBlocks.tsx). Same 1280 grid and section
   rhythm as the rest of the site so they line up with the header. */

const SECTION = "mx-auto max-w-[1280px] px-6 pt-16 sm:pt-20";

function BlockHead({ heading, copy }: { heading: string; copy?: string }) {
  if (!heading && !copy) return null;
  return (
    <Reveal>
      {heading && (
        <h2 className="font-display max-w-2xl text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
          {heading}
        </h2>
      )}
      {copy && (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">
          {copy}
        </p>
      )}
    </Reveal>
  );
}

/* --------------------------------------------------------------- comparison */

const YES = /^(yes|y|true|✓|✔)$/i;
const NO = /^(no|n|false|✗|✘|-|—|–)$/i;

/** A cell is a tick, a dash, or its own words — so the table can mix
    "has this / does not" rows with "how many / how fast" rows. */
function Cell({ value }: { value: string }) {
  const v = value.trim();
  if (YES.test(v)) {
    return (
      <>
        <Check size={17} className="mx-auto text-[#F26419]" aria-hidden />
        <span className="sr-only">Yes</span>
      </>
    );
  }
  if (NO.test(v)) {
    return (
      <>
        <Minus size={17} className="mx-auto text-stone-300" aria-hidden />
        <span className="sr-only">No</span>
      </>
    );
  }
  return <>{v}</>;
}

export function ComparisonBlock({ s }: { s: Extract<Section, { type: "comparison" }> }) {
  const rows = s.rows.filter((r) => r.label.trim());
  if (s.columns.length === 0 || rows.length === 0) return null;

  return (
    <section className={SECTION}>
      <BlockHead heading={s.heading} copy={s.copy} />
      <Reveal>
        {/* The table scrolls inside its own box; the page body must never
            scroll sideways because a comparison has four columns. */}
        <div className="mt-8 overflow-x-auto rounded-3xl border border-stone-200 bg-white">
          <table className="w-full min-w-[34rem] border-collapse text-sm">
            <caption className="sr-only">{s.heading || "Comparison"}</caption>
            <thead>
              <tr>
                <th scope="col" className="w-2/5 px-5 py-4 text-left font-semibold text-stone-500">
                  <span className="sr-only">Feature</span>
                </th>
                {s.columns.map((c, i) => (
                  <th
                    key={i}
                    scope="col"
                    className={`px-4 py-4 text-center font-display text-sm font-bold ${
                      c.highlight ? "text-[#F26419]" : "text-stone-500"
                    }`}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="border-t border-stone-100">
                  <th scope="row" className="px-5 py-3.5 text-left font-medium text-stone-700">
                    {r.label}
                  </th>
                  {s.columns.map((c, ci) => (
                    <td
                      key={ci}
                      className={`px-4 py-3.5 text-center text-stone-600 ${
                        c.highlight ? "bg-orange-50/60 font-semibold text-stone-900" : ""
                      }`}
                    >
                      <Cell value={r.values[ci] ?? ""} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </section>
  );
}

/* -------------------------------------------------------------------- steps */

export function StepsBlock({ s }: { s: Extract<Section, { type: "steps" }> }) {
  const items = s.items.filter((i) => i.title.trim() || i.copy.trim());
  if (items.length === 0) return null;

  return (
    <section className={SECTION}>
      <BlockHead heading={s.heading} copy={s.copy} />
      {/* Numbering is real information here — these are ordered stages, not a
          decorative counter — so it is an <ol> and the numeral is content. */}
      <ol className="mt-8 grid list-none grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {/* as="li" — an <li> must be a direct child of the <ol>, so Reveal
            has to BE the item rather than wrap one. */}
        {items.map((item, i) => (
          <Reveal key={i} delay={(i % 4) * 0.06} as="li" className="relative">
            {/* The rule runs to the next step and stops at the last one. */}
            {i < items.length - 1 && (
              <span
                className="absolute left-11 right-[-1.5rem] top-4 hidden h-px bg-stone-200 lg:block"
                aria-hidden
              />
            )}
            <span className="font-display relative z-[1] flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-xs font-extrabold tabular-nums text-white">
              {i + 1}
            </span>
            <h3 className="font-display mt-4 text-base font-bold text-stone-900">
              {item.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-stone-500">{item.copy}</p>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------------ gallery */

const COLS: Record<"2" | "3" | "4", string> = {
  "2": "sm:grid-cols-2",
  "3": "sm:grid-cols-2 lg:grid-cols-3",
  "4": "sm:grid-cols-2 lg:grid-cols-4",
};

export function GalleryBlock({ s }: { s: Extract<Section, { type: "gallery" }> }) {
  const items = s.items.filter((i) => i.src.trim());
  if (items.length === 0) return null;

  return (
    <section className={SECTION}>
      <BlockHead heading={s.heading} />
      <ul className={`${s.heading ? "mt-8" : ""} grid list-none grid-cols-1 gap-4 ${COLS[s.columns]}`}>
        {items.map((item, i) => (
          <Reveal key={i} delay={(i % 3) * 0.06} as="li">
            <figure>
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-stone-100">
                <Image
                  src={withBase(item.src)}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 400px"
                  className="object-cover"
                />
              </div>
              {item.caption && (
                <figcaption className="mt-2 text-xs text-stone-500">{item.caption}</figcaption>
              )}
            </figure>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
