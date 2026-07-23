import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import Reveal from "@/components/Reveal";
import CountriesBlock from "@/components/sections/CountriesBlock";
import FormEmbed from "@/components/sections/FormEmbed";
import IndustriesBlock from "@/components/sections/IndustriesBlock";
import SpotlightCard from "@/components/sections/SpotlightCard";
import VideoBlock from "@/components/sections/VideoBlock";
import { withBase } from "@/lib/base-path";
import type { Section } from "@/lib/cms/sections";

function Heading({ text }: { text: string }) {
  return (
    <h2 className="font-display max-w-2xl text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
      {text}
    </h2>
  );
}

function HeroBlock({ s }: { s: Extract<Section, { type: "hero" }> }) {
  return (
    <section className="relative overflow-hidden bg-[#FFFBF7]">
      <span className="animate-aurora absolute -left-10 -top-16 h-72 w-72 rounded-full bg-orange-300 opacity-45 blur-[60px]" />
      <span className="animate-aurora-slow absolute -right-10 top-10 h-64 w-64 rounded-full bg-amber-300 opacity-40 blur-[60px]" />
      <div className="relative mx-auto max-w-[1280px] px-6 pb-16 pt-12 sm:pt-16">
        {s.eyebrow && (
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
            {s.eyebrow}
          </p>
        )}
        <h1 className="font-display max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-stone-900 sm:text-5xl">
          {s.heading}{" "}
          {s.highlight && (
            <span className="bg-[linear-gradient(100deg,#EA580C,#F59E0B)] bg-clip-text text-transparent">
              {s.highlight}
            </span>
          )}
        </h1>
        {s.copy && (
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-stone-600 sm:text-base">
            {s.copy}
          </p>
        )}
        {s.ctaLabel && (
          <Link
            href={s.ctaHref || "/contact"}
            className="shine-sweep mt-7 inline-block rounded-full bg-stone-900 px-7 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            {s.ctaLabel}
          </Link>
        )}
      </div>
    </section>
  );
}

/* Three layouts, all on the 1280 grid so the block lines up with the
   header, stats and CTA bands instead of floating in a centred column:
   with an image, the photo takes the left and eyebrow + heading + copy
   the right; without one, the heading itself holds the left; and a
   headless block flows into two text columns. Copy is justified in the
   wide layouts but left as-is in the two-column one, where narrow
   measures + justification open up rivers of white space. */
function RichTextBlock({ s }: { s: Extract<Section, { type: "richText" }> }) {
  const paragraphs = s.body.split(/\n{2,}/).filter((p) => p.trim());
  const copy = (cls: string) => (
    <div className={cls}>
      {paragraphs.map((p, i) => (
        <p key={i} className="text-sm leading-relaxed text-stone-600 sm:text-base">
          {p}
        </p>
      ))}
    </div>
  );
  if (s.image) {
    return (
      <section className="mx-auto max-w-[1280px] px-6 pt-16 sm:pt-20">
        <Reveal>
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)] lg:gap-14">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-stone-900">
              <Image
                src={withBase(s.image)}
                alt={s.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 520px"
                className="object-cover"
              />
              <span className="absolute inset-0 bg-[#F26419]/25 mix-blend-color" aria-hidden />
            </div>
            <div>
              {s.eyebrow && (
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
                  {s.eyebrow}
                </p>
              )}
              {s.heading && (
                <h2 className="font-display text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
                  {s.heading}
                </h2>
              )}
              {copy("mt-5 space-y-4 hyphens-auto text-justify")}
            </div>
          </div>
        </Reveal>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1280px] px-6 pt-16 sm:pt-20">
      <Reveal>
        {s.heading ? (
          /* Heading on top, then one card per paragraph in an even grid.
             Splitting on the paragraph (rather than letting CSS columns
             break mid-thought) keeps every card a whole idea, so the row
             stays balanced whatever the paragraph count. No icons: the CMS
             can't know what a paragraph is about, and a mismatched icon
             reads worse than none — a short accent rule carries the rhythm. */
          <div>
            {s.eyebrow && (
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
                {s.eyebrow}
              </p>
            )}
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
              {s.heading}
            </h2>
            {paragraphs.length >= 3 ? (
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paragraphs.map((p, i) => (
                  <div
                    key={i}
                    className="h-full rounded-3xl border border-stone-200 bg-white p-6 transition-transform duration-300 hover:-translate-y-1.5"
                  >
                    <span
                      className="block h-1 w-8 rounded-full bg-[#F26419]"
                      aria-hidden
                    />
                    <p className="mt-4 text-sm leading-relaxed text-stone-600">{p}</p>
                  </div>
                ))}
              </div>
            ) : (
              /* One or two paragraphs can't fill a row without leaving a
                 hole, and splitting sequential prose (the legal pages) into
                 side-by-side cards breaks the reading order — so those stay
                 as flowing copy in a single card. */
              <div className="mt-6 rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                {copy("[&>p]:mb-4 [&>p:last-child]:mb-0")}
              </div>
            )}
          </div>
        ) : paragraphs.length > 1 ? (
          copy(
            "[&>p]:mb-4 [&>p]:break-inside-avoid [&>p:last-child]:mb-0 lg:columns-2 lg:gap-14",
          )
        ) : (
          copy("max-w-3xl hyphens-auto text-justify")
        )}
      </Reveal>
    </section>
  );
}

function CardsBlock({ s }: { s: Extract<Section, { type: "cards" }> }) {
  /* Checklist: no boxes at all. A long list of reasons-to-trust reads far
     faster as ticked claims than as a wall of identical cards, and the
     ticks themselves carry the "here is why" meaning. */
  if (s.layout === "checklist") {
    return (
      <section className="mx-auto max-w-[1280px] px-6 pt-16 sm:pt-20">
        <Reveal>{s.heading && <Heading text={s.heading} />}</Reveal>
        <div className="mt-8 grid grid-cols-1 gap-x-12 gap-y-5 sm:grid-cols-2">
          {s.items.map((item, i) => (
            <Reveal key={i} delay={(i % 2) * 0.06}>
              <div className="flex gap-3 border-b border-stone-200 pb-5">
                <Check size={17} className="mt-0.5 shrink-0 text-[#F26419]" aria-hidden />
                <div>
                  <h3 className="font-display text-base font-bold text-stone-900">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-stone-500">
                    {item.copy}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    );
  }

  /* Bento: the first item spans two rows and the fourth spans two columns,
     so a four-item set fills the grid instead of leaving a 3+1 hole. Only
     kicks in from four items; below that the plain grid is already even. */
  const bento = s.layout === "bento" && s.items.length >= 4;

  return (
    <section className="mx-auto max-w-[1280px] px-6 pt-16 sm:pt-20">
      <Reveal>{s.heading && <Heading text={s.heading} />}</Reveal>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {s.items.map((item, i) => (
          <Reveal
            key={i}
            delay={(i % 3) * 0.06}
            className={
              bento && i === 0
                ? "lg:row-span-2"
                : bento && i === 3
                  ? "lg:col-span-2"
                  : undefined
            }
          >
            <SpotlightCard className="flex h-full flex-col justify-center rounded-3xl border border-stone-200 bg-white p-6">
              <p className="font-display text-3xl font-extrabold text-orange-200">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="font-display mt-2 text-base font-bold text-stone-900">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-500">
                {item.copy}
              </p>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function StatsBlock({ s }: { s: Extract<Section, { type: "stats" }> }) {
  return (
    <section className="mx-auto max-w-[1280px] px-6 pt-16 sm:pt-20">
      <Reveal>
        <div className="grid grid-cols-2 gap-8 rounded-3xl bg-orange-50 px-6 py-10 text-center md:grid-cols-4">
          {s.items.map((item, i) => (
            <div key={i}>
              <p className="font-display text-3xl font-extrabold tracking-tight text-orange-600 sm:text-4xl">
                {item.value}
              </p>
              <p className="mt-1 text-sm text-orange-950/70">{item.label}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

function FaqBlock({ s, idx }: { s: Extract<Section, { type: "faq" }>; idx: number }) {
  // Split into two columns so the questions fill the width instead of
  // leaving a wide empty gap on the right. A shared `name` makes the
  // <details> an exclusive accordion — opening one closes the others.
  const group = `faq-${idx}`;
  const mid = Math.ceil(s.items.length / 2);
  const columns = [s.items.slice(0, mid), s.items.slice(mid)].filter(
    (c) => c.length > 0,
  );

  const item = (q: string, a: string, key: number) => (
    <details key={key} name={group} className="group py-4">
      <summary className="font-display cursor-pointer list-none text-sm font-bold text-stone-900 sm:text-base [&::-webkit-details-marker]:hidden">
        <span className="mr-2 inline-block text-orange-600 transition-transform group-open:rotate-90">
          ›
        </span>
        {q}
      </summary>
      <p className="mt-2 pl-5 text-sm leading-relaxed text-stone-600">{a}</p>
    </details>
  );

  return (
    <section className="mx-auto max-w-[1280px] px-6 pt-16 sm:pt-20">
      <Reveal>
        {s.heading && (
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            {s.heading}
          </h2>
        )}
      </Reveal>
      <div
        className={`mt-8 grid gap-4 md:gap-6 ${columns.length > 1 ? "md:grid-cols-2" : ""}`}
      >
        {columns.map((col, ci) => (
          <div
            key={ci}
            className="divide-y divide-stone-200 rounded-3xl border border-stone-200 bg-white px-6 sm:px-8"
          >
            {col.map((it, i) => item(it.q, it.a, ci * mid + i))}
          </div>
        ))}
      </div>
    </section>
  );
}

function CtaBlock({ s }: { s: Extract<Section, { type: "cta" }> }) {
  return (
    <section className="mx-auto max-w-[1280px] px-6 pt-16 sm:pt-20">
      <Reveal>
        {/* Stock photo under an orange-tinted scrim — same recipe as the
            shared CtaBand, so the CMS CTA matches the rest of the site. */}
        <div className="relative overflow-hidden rounded-3xl bg-stone-900">
          <Image
            src={withBase("/cta-band.jpg")}
            alt=""
            fill
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover"
          />
          <span className="absolute inset-0 bg-[#F26419]/25 mix-blend-color" aria-hidden />
          <span
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,10,5,0.92),rgba(18,10,5,0.86)_55%,rgba(18,10,5,0.94))]"
            aria-hidden
          />
          <div className="relative flex flex-col items-start justify-between gap-5 p-8 sm:flex-row sm:items-center sm:p-10">
            <div>
              <h2 className="font-display text-xl font-extrabold tracking-tight text-stone-50 sm:text-2xl">
                {s.heading}
              </h2>
              {s.copy && <p className="mt-1 text-sm text-stone-300">{s.copy}</p>}
            </div>
            <Link
              href={s.ctaHref || "/contact"}
              className="shrink-0 rounded-full bg-[#F26419] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600"
            >
              {s.ctaLabel}
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function FormBlock({ s }: { s: Extract<Section, { type: "form" }> }) {
  return (
    <section className="mx-auto max-w-3xl px-6 pt-16 sm:pt-20">
      <Reveal>
        {s.heading && <Heading text={s.heading} />}
        <div className="mt-6">
          <FormEmbed slug={s.formSlug} />
        </div>
      </Reveal>
    </section>
  );
}

export default function SectionRenderer({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map((section, i) => {
        switch (section.type) {
          case "hero":
            return <HeroBlock key={i} s={section} />;
          case "richText":
            return <RichTextBlock key={i} s={section} />;
          case "cards":
            return <CardsBlock key={i} s={section} />;
          case "stats":
            return <StatsBlock key={i} s={section} />;
          case "countries":
            return <CountriesBlock key={i} s={section} />;
          case "industries":
            return <IndustriesBlock key={i} s={section} />;
          case "faq":
            return <FaqBlock key={i} s={section} idx={i} />;
          case "cta":
            return <CtaBlock key={i} s={section} />;
          case "form":
            return <FormBlock key={i} s={section} />;
          case "video":
            return (
              <VideoBlock key={i} slug={section.videoSlug} heading={section.heading} />
            );
        }
      })}
    </>
  );
}
