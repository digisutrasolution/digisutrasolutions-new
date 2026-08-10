import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import Reveal from "@/components/Reveal";
import { withBase } from "@/lib/base-path";
import { db } from "@/lib/db";
import type { Section } from "@/lib/cms/sections";

/* Server-rendered blocks that pull from the admin libraries rather than
   carrying their own copy. Each one:
     - shows every visible record when `ids` is empty, the picked subset when not
     - keeps the library's own `order` either way, so sequence is maintained in
       one place instead of per page
     - renders nothing at all when the library is empty, so a page never ships
       a bare heading over a blank strip
   A failed query degrades to nothing rather than throwing the whole page. */

const SECTION = "mx-auto max-w-[1280px] px-6 pt-16 sm:pt-20";

function BlockHeading({ text }: { text: string }) {
  if (!text) return null;
  return (
    <Reveal>
      <h2 className="font-display max-w-2xl text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
        {text}
      </h2>
    </Reveal>
  );
}

/** `ids` empty = no filter. Kept in one place so every block behaves alike. */
const pick = (ids: string[]) => (ids.length ? { id: { in: ids } } : {});

/* ------------------------------------------------------------------ quotes */

export async function TestimonialsBlock({
  s,
}: {
  s: Extract<Section, { type: "testimonials" }>;
}) {
  const items = await db.testimonial
    .findMany({
      where: { visible: true, ...pick(s.ids) },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      take: s.limit,
    })
    .catch(() => []);
  if (items.length === 0) return null;

  return (
    <section className={SECTION}>
      <BlockHeading text={s.heading} />
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((t, i) => (
          <Reveal key={t.id} delay={(i % 3) * 0.06}>
            <figure className="flex h-full flex-col rounded-3xl border border-stone-200 bg-white p-6">
              {t.rating > 0 && (
                <div className="flex gap-0.5" aria-label={`${t.rating} out of 5`}>
                  {Array.from({ length: Math.min(5, t.rating) }).map((_, k) => (
                    <Star key={k} size={14} className="fill-[#F26419] text-[#F26419]" aria-hidden />
                  ))}
                </div>
              )}
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-stone-600">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-4 border-t border-stone-100 pt-3">
                <span className="font-display block text-sm font-bold text-stone-900">
                  {t.name}
                </span>
                {t.role && <span className="block text-xs text-stone-500">{t.role}</span>}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------- logos */

export async function LogosBlock({ s }: { s: Extract<Section, { type: "logos" }> }) {
  const items = await db.clientLogo
    .findMany({
      where: { visible: true, ...pick(s.ids) },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      take: s.limit,
    })
    .catch(() => []);
  if (items.length === 0) return null;

  return (
    <section className={SECTION}>
      <BlockHeading text={s.heading} />
      <Reveal>
        <ul
          className={`${s.heading ? "mt-8" : ""} grid list-none grid-cols-2 gap-px overflow-hidden rounded-3xl border border-stone-200 bg-stone-200 sm:grid-cols-3 lg:grid-cols-4`}
        >
          {items.map((c) => {
            /* Without a file the name renders as a wordmark — the model
               allows a logo-less client and a broken <img> is worse. */
            const body = c.imageUrl ? (
              <Image
                src={withBase(c.imageUrl)}
                alt={c.name}
                width={140}
                height={44}
                className="max-h-11 w-auto object-contain opacity-70 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0"
              />
            ) : (
              <span className="font-condensed text-base font-bold uppercase tracking-wide text-stone-400 transition-colors hover:text-stone-700">
                {c.name}
              </span>
            );
            return (
              <li key={c.id} className="flex items-center justify-center bg-white px-5 py-7">
                {c.websiteUrl ? (
                  <Link
                    href={c.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    aria-label={c.name}
                  >
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------- case studies */

type Metric = { value?: string; label?: string };

export async function CaseStudiesBlock({
  s,
}: {
  s: Extract<Section, { type: "caseStudies" }>;
}) {
  const items = await db.caseStudy
    .findMany({
      where: { visible: true, ...pick(s.ids) },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      take: s.limit,
    })
    .catch(() => []);
  if (items.length === 0) return null;

  return (
    <section className={SECTION}>
      <BlockHeading text={s.heading} />
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((cs, i) => {
          // metrics is free-form JSON on the model — narrow it before use.
          const metrics: Metric[] = Array.isArray(cs.metrics)
            ? (cs.metrics as Metric[]).slice(0, 3)
            : [];
          return (
            <Reveal key={cs.id} delay={(i % 3) * 0.06}>
              <Link
                href={`/work/${cs.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white transition-transform duration-300 hover:-translate-y-1.5"
              >
                {cs.image && (
                  <div className="relative aspect-[16/10] overflow-hidden bg-stone-900">
                    <Image
                      src={withBase(cs.image)}
                      alt={cs.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 400px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 bg-[#F26419]/25 mix-blend-color" aria-hidden />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-800">
                    {cs.client}
                    {cs.industry && ` · ${cs.industry}`}
                  </p>
                  <h3 className="font-display mt-2 text-base font-bold text-stone-900">
                    {cs.title}
                  </h3>
                  {cs.result && (
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-500">
                      {cs.result}
                    </p>
                  )}
                  {metrics.length > 0 && (
                    <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-stone-100 pt-3">
                      {/* dt before dd as the spec requires, flipped visually so
                          the number leads. An sr-only dt alongside a visible
                          label would read the label out twice. */}
                      {metrics.map((m, k) => (
                        <div key={k} className="flex flex-col-reverse">
                          <dt className="text-[11px] text-stone-500">{m.label}</dt>
                          <dd className="font-display text-lg font-extrabold tabular-nums text-[#F26419]">
                            {m.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- pricing */

export async function PricingBlock({ s }: { s: Extract<Section, { type: "pricing" }> }) {
  const plans = await db.pricingPlan
    .findMany({
      where: { visible: true, ...pick(s.ids) },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    })
    .catch(() => []);
  if (plans.length === 0) return null;

  return (
    <section className={SECTION}>
      <BlockHeading text={s.heading} />
      {s.copy && (
        <Reveal>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">
            {s.copy}
          </p>
        </Reveal>
      )}
      <div
        className={`mt-8 grid grid-cols-1 gap-4 ${
          plans.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {plans.map((p, i) => (
          <Reveal key={p.id} delay={(i % 3) * 0.06}>
            <div
              className={`flex h-full flex-col rounded-3xl border p-6 ${
                p.featured
                  ? "border-[#F26419] bg-white shadow-[0_18px_50px_rgba(242,100,25,0.12)]"
                  : "border-stone-200 bg-white"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display text-base font-bold text-stone-900">{p.name}</h3>
                {p.featured && (
                  <span className="rounded-full bg-[#F26419] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Popular
                  </span>
                )}
              </div>
              {p.tagline && <p className="mt-1 text-xs text-stone-500">{p.tagline}</p>}
              <p className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-3xl font-extrabold tracking-tight text-stone-900">
                  {p.price}
                </span>
                <span className="text-sm text-stone-500">{p.period}</span>
              </p>
              {p.marketNote && <p className="mt-1 text-[11px] text-stone-400">{p.marketNote}</p>}
              <div className="flex-1" />
              <Link
                href="/contact"
                className={`mt-6 inline-block rounded-full px-6 py-3 text-center text-sm font-semibold transition-colors ${
                  p.featured
                    ? "bg-[#F26419] text-white hover:bg-orange-600"
                    : "border border-stone-300 text-stone-800 hover:border-stone-900"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
