"use client";

import { createElement, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowRight } from "lucide-react";
import { navIcon } from "@/components/nav-icons";
import { withBase } from "@/lib/base-path";
import type { LiveService } from "@/lib/services";

/* PRO MAX editorial index: numbered rows; the active row expands into a dark
   spotlight with offer chips, an outcome stat and CTA. First row starts
   active; hover/focus moves it. Collapsed rows stay fully crawlable. */
export default function ServicesIndex({ services }: { services: LiveService[] }) {
  const [active, setActive] = useState(0);

  return (
    <div className="mt-10 border-t border-stone-200">
      {services.map((s, i) => {
        const isActive = i === active;
        const num = String(i + 1).padStart(2, "0");
        return (
          <div key={s.slug} onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)}>
            {isActive ? (
              <div className="my-2 rounded-3xl bg-stone-900 p-6 sm:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                  <span className="font-serif-accent shrink-0 text-4xl italic leading-none text-[#F26419] sm:text-5xl">
                    {num}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="font-display text-xl font-extrabold text-white sm:text-2xl">
                        {s.name}
                      </h2>
                      {s.badge && (
                        <span className="rounded-full bg-[#FFE3CC] px-2.5 py-0.5 text-[10px] font-bold text-orange-950">
                          {s.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-400">
                      {s.blurb}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {s.offers.map((o) => (
                        <span
                          key={o.name}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                            o.highlight
                              ? "bg-[#3a2a1d] text-[#FDBA74]"
                              : "bg-stone-800 text-stone-300"
                          }`}
                        >
                          {o.name}
                        </span>
                      ))}
                    </div>
                    {s.priceFrom && (
                      <p className="mt-4 text-xs text-stone-500">
                        <span className="font-bold text-emerald-400">{s.priceFrom}</span>
                        {s.marketNote && <> · {s.marketNote}</>}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-row items-center gap-6 lg:flex-col lg:items-end lg:gap-4">
                    {s.image && (
                      <span className="relative hidden h-20 w-32 overflow-hidden rounded-xl xl:block">
                        <Image src={withBase(s.image)} alt="" fill sizes="128px" className="object-cover" />
                        <span className="absolute inset-0 bg-[#F26419]/25 mix-blend-color" aria-hidden />
                      </span>
                    )}
                    {s.stat && (
                      <span className="text-right">
                        <span className="font-display block text-2xl font-extrabold text-emerald-400">{s.stat}</span>
                        <span className="block text-[11px] text-stone-500">{s.statLabel}</span>
                      </span>
                    )}
                    <Link
                      href={`/services/${s.slug}`}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#F26419] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600"
                    >
                      Explore service <ArrowRight size={14} aria-hidden />
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href={`/services/${s.slug}`}
                className="group flex items-center gap-4 border-b border-stone-200 px-1 py-4 no-underline transition-colors hover:bg-[#FFF7F0]"
              >
                <span className="font-serif-accent w-8 shrink-0 text-lg italic text-stone-300">{num}</span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  {createElement(navIcon(s.icon), { size: 14 })}
                </span>
                <span className="font-display font-bold text-stone-700 group-hover:text-stone-900">
                  {s.name}
                </span>
                {s.badge && (
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[9px] font-bold text-orange-900">
                    {s.badge}
                  </span>
                )}
                <span className="ml-auto hidden text-xs text-stone-400 md:inline">
                  {s.offers.slice(0, 3).map((o) => o.name).join(" · ")}
                  {s.offers.length > 3 ? " · …" : ""}
                </span>
                <ArrowDownRight size={14} className="shrink-0 text-stone-300 transition-colors group-hover:text-[#F26419]" aria-hidden />
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
