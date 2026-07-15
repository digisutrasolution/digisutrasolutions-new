import Link from "next/link";
import Reveal from "@/components/Reveal";

export default function Services() {
  return (
    <section id="services" className="mx-auto max-w-[1280px] px-6 pt-20 sm:pt-24">
      <Reveal>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
          What we do
        </p>
        <h2 className="font-display max-w-xl text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
          One roof.{" "}
          <span className="font-serif-accent font-medium italic text-orange-600">
            Every
          </span>{" "}
          growth lever.
        </h2>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Reveal className="md:col-span-2" delay={0.05}>
          <Link
            href="/work"
            className="group relative block h-full overflow-hidden rounded-3xl bg-stone-900 p-7 transition-transform duration-300 hover:-translate-y-1.5 sm:p-8"
          >
            <span className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-orange-500 opacity-40 blur-[50px] transition-opacity duration-300 group-hover:opacity-60" />
            <div className="relative flex items-start justify-between gap-6">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-orange-300">
                  01 — Growth marketing
                </p>
                <h3 className="font-display text-xl font-bold text-stone-50 sm:text-2xl">
                  SEO, paid media &amp; CRO that compound
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-stone-400">
                  Full-funnel programs with live dashboards — every rupee
                  tracked from click to invoice.
                </p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white transition-transform duration-300 group-hover:translate-x-1.5">
                →
              </span>
            </div>
          </Link>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="group h-full rounded-3xl border border-stone-200 bg-white p-7 transition-transform duration-300 hover:-translate-y-1.5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-orange-800">
              02 — Engineering
            </p>
            <h3 className="font-display text-lg font-bold text-stone-900">
              Web apps &amp; AI agents
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-stone-500">
              Next.js, Laravel, Claude — built to scale.{" "}
              <span className="inline-block font-bold text-orange-600 transition-transform duration-300 group-hover:translate-x-1.5">
                →
              </span>
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="group h-full rounded-3xl border border-stone-200 bg-white p-7 transition-transform duration-300 hover:-translate-y-1.5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-orange-800">
              03 — Applied AI
            </p>
            <h3 className="font-display text-lg font-bold text-stone-900">
              Chatbots &amp; automation
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-stone-500">
              AI woven into sites, support and ops.{" "}
              <span className="inline-block font-bold text-orange-600 transition-transform duration-300 group-hover:translate-x-1.5">
                →
              </span>
            </p>
          </div>
        </Reveal>

        <Reveal className="md:col-span-2" delay={0.12}>
          <div className="flex h-full flex-col items-start justify-between gap-5 rounded-3xl border border-orange-200 bg-orange-50 p-7 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-display text-lg font-bold text-orange-950">
                Free growth audit
              </h3>
              <p className="mt-1 text-sm text-orange-900/80">
                15 pages of findings on your SEO, ads and site speed — no
                strings.
              </p>
            </div>
            <Link
              href="/contact"
              className="shrink-0 rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
            >
              Claim yours ↗
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
