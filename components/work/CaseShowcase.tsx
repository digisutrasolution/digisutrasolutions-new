"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import Reveal from "@/components/Reveal";
import { withBase } from "@/lib/base-path";
import type { WorkCategory } from "@/lib/data";
import type { WorkCase } from "@/lib/work-data";

const FILTERS: Array<"All" | WorkCategory> = ["All", "Web", "Marketing", "AI"];

function Duotone({ src, alt, sizes }: { src: string; alt: string; sizes: string }) {
  return (
    <>
      <Image
        src={withBase(src)}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
      />
      <span className="absolute inset-0 bg-[#F26419]/25 mix-blend-color" aria-hidden />
      <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,10,5,0.15),rgba(18,10,5,0.45))]" aria-hidden />
    </>
  );
}

function Metrics({ metrics, size = "sm" }: { metrics: WorkCase["metrics"]; size?: "sm" | "lg" }) {
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-3">
      {metrics.map((m) => (
        <div key={m.label}>
          <p
            className={`font-display font-extrabold tracking-tight text-stone-900 ${
              size === "lg" ? "text-2xl" : "text-lg"
            }`}
          >
            {m.value}
          </p>
          <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400">
            {m.label}
          </p>
        </div>
      ))}
    </div>
  );
}

function FeaturedCase({ c }: { c: WorkCase }) {
  return (
    <Reveal>
      <article className="group grid overflow-hidden rounded-[2rem] border border-stone-200 bg-white transition-shadow duration-300 hover:shadow-[0_24px_60px_rgba(28,25,23,0.10)] lg:grid-cols-2">
        <div className="relative min-h-56 overflow-hidden bg-stone-900 lg:min-h-full">
          <Duotone src={c.image} alt={`${c.client} — ${c.industry}`} sizes="(max-width: 1024px) 100vw, 620px" />
          <span className="absolute left-4 top-4 rounded-full bg-orange-50/95 px-3 py-1 text-xs font-semibold text-orange-950">
            {c.industry}
          </span>
        </div>
        <div className="p-7 sm:p-9">
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-400">
            <span className="font-display font-bold uppercase tracking-[0.14em] text-orange-800">
              {c.client}
            </span>
            <span aria-hidden>·</span>
            <span className="flex items-center gap-1">
              <Clock size={11} aria-hidden /> {c.timeframe}
            </span>
          </div>
          <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
            {c.title}
          </h2>
          <dl className="mt-5 space-y-3 text-sm leading-relaxed">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">
                The challenge
              </dt>
              <dd className="mt-0.5 text-stone-600">{c.challenge}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">
                What we did
              </dt>
              <dd className="mt-0.5 text-stone-600">{c.solution}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">
                The result
              </dt>
              <dd className="mt-0.5 font-medium text-stone-800">{c.result}</dd>
            </div>
          </dl>
          <div className="mt-6 border-t border-stone-100 pt-5">
            <Metrics metrics={c.metrics} size="lg" />
          </div>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {c.services.map((s) => (
              <span
                key={s}
                className="rounded-full border border-stone-200 px-2.5 py-1 text-[11px] font-semibold text-stone-500"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </article>
    </Reveal>
  );
}

function CaseCard({ c, index }: { c: WorkCase; index: number }) {
  return (
    <Reveal delay={(index % 2) * 0.08} className="h-full">
      <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-orange-300 hover:shadow-[0_16px_40px_rgba(28,25,23,0.08)]">
        <div className="relative h-44 overflow-hidden bg-stone-900 sm:h-48">
          <Duotone src={c.image} alt={`${c.client} — ${c.industry}`} sizes="(max-width: 640px) 100vw, 420px" />
          <span className="absolute left-3 top-3 rounded-full bg-orange-50/95 px-3 py-1 text-xs font-semibold text-orange-950">
            {c.industry}
          </span>
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-stone-900/70 px-2.5 py-1 text-[10px] font-semibold text-stone-200">
            <Clock size={10} aria-hidden /> {c.timeframe}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <p className="font-display text-xs font-bold uppercase tracking-[0.14em] text-orange-800">
            {c.client}
          </p>
          <h3 className="font-display mt-1 text-lg font-bold leading-snug text-stone-900">
            {c.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">{c.result}</p>
          <div className="mt-4 border-t border-stone-100 pt-4">
            <Metrics metrics={c.metrics} />
          </div>
          <p className="mt-auto pt-4 text-xs text-stone-400">{c.services.join(" · ")}</p>
        </div>
      </article>
    </Reveal>
  );
}

export default function CaseShowcase({ cases }: { cases: WorkCase[] }) {
  const [filter, setFilter] = useState<"All" | WorkCategory>("All");
  const filtered = cases.filter((c) => filter === "All" || c.category === filter);
  const [featured, ...rest] = filter === "All" ? filtered : [null, ...filtered];

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-stone-900 text-white"
                : "border border-stone-200 bg-white text-stone-600 hover:border-orange-400 hover:text-orange-700"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {featured && <FeaturedCase c={featured} />}

      <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 ${featured ? "mt-6" : ""}`}>
        {rest.filter(Boolean).map((c, i) => (
          <CaseCard key={c!.slug} c={c!} index={i} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-16 text-center text-sm text-stone-500">
          No projects in this category yet — check back soon.
        </p>
      )}

      <div className="mt-14 rounded-[2rem] bg-stone-900 px-6 py-10 text-center sm:px-12">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Want numbers like these on{" "}
          <span className="font-serif-accent font-medium italic text-[#FDBA74]">
            your dashboard?
          </span>
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-stone-400">
          Every engagement starts the same way these did — with a free 15-page
          audit that shows exactly where the growth is hiding.
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#F26419] px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600"
        >
          Get my free audit <ArrowRight size={14} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
