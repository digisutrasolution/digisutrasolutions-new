import Link from "next/link";
import Reveal from "@/components/Reveal";
import FormEmbed from "@/components/sections/FormEmbed";
import VideoBlock from "@/components/sections/VideoBlock";
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

function RichTextBlock({ s }: { s: Extract<Section, { type: "richText" }> }) {
  const paragraphs = s.body.split(/\n{2,}/).filter((p) => p.trim());
  return (
    <section className="mx-auto max-w-3xl px-6 pt-16 sm:pt-20">
      <Reveal>
        {s.heading && <Heading text={s.heading} />}
        <div className="mt-5 space-y-4">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-stone-600 sm:text-base">
              {p}
            </p>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

function CardsBlock({ s }: { s: Extract<Section, { type: "cards" }> }) {
  return (
    <section className="mx-auto max-w-[1280px] px-6 pt-16 sm:pt-20">
      <Reveal>{s.heading && <Heading text={s.heading} />}</Reveal>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {s.items.map((item, i) => (
          <Reveal key={i} delay={(i % 3) * 0.06}>
            <div className="h-full rounded-3xl border border-stone-200 bg-white p-6 transition-transform duration-300 hover:-translate-y-1.5">
              <p className="font-display text-3xl font-extrabold text-orange-200">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="font-display mt-2 text-base font-bold text-stone-900">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-500">
                {item.copy}
              </p>
            </div>
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

function FaqBlock({ s }: { s: Extract<Section, { type: "faq" }> }) {
  return (
    <section className="mx-auto max-w-3xl px-6 pt-16 sm:pt-20">
      <Reveal>{s.heading && <Heading text={s.heading} />}</Reveal>
      <div className="mt-6 divide-y divide-stone-200 rounded-3xl border border-stone-200 bg-white px-6">
        {s.items.map((item, i) => (
          <details key={i} className="group py-4">
            <summary className="font-display cursor-pointer list-none text-sm font-bold text-stone-900 sm:text-base [&::-webkit-details-marker]:hidden">
              <span className="mr-2 text-orange-600 transition-transform group-open:rotate-90 inline-block">
                ›
              </span>
              {item.q}
            </summary>
            <p className="mt-2 pl-5 text-sm leading-relaxed text-stone-600">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

function CtaBlock({ s }: { s: Extract<Section, { type: "cta" }> }) {
  return (
    <section className="mx-auto max-w-[1280px] px-6 pt-16 sm:pt-20">
      <Reveal>
        <div className="flex flex-col items-start justify-between gap-5 rounded-3xl bg-stone-900 p-8 sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="font-display text-xl font-extrabold tracking-tight text-stone-50 sm:text-2xl">
              {s.heading}
            </h2>
            {s.copy && <p className="mt-1 text-sm text-stone-400">{s.copy}</p>}
          </div>
          <Link
            href={s.ctaHref || "/contact"}
            className="animate-shimmer shrink-0 rounded-full bg-[linear-gradient(120deg,#EA580C,#FB923C,#EA580C)] px-6 py-3 text-sm font-semibold text-white"
          >
            {s.ctaLabel}
          </Link>
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
          case "faq":
            return <FaqBlock key={i} s={section} />;
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
