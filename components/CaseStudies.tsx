import Link from "next/link";
import Reveal from "@/components/Reveal";
import { CASE_STUDIES } from "@/lib/data";

export default function CaseStudies() {
  return (
    <section id="case-studies" className="mx-auto max-w-[1280px] px-6 pt-20 sm:pt-24">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
              Case studies
            </p>
            <h2 className="font-display max-w-xl text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
              Numbers that{" "}
              <span className="font-serif-accent font-medium italic text-orange-600">
                moved
              </span>
            </h2>
          </div>
          <Link
            href="/work"
            className="text-sm font-semibold text-stone-900 underline decoration-orange-500 decoration-2 underline-offset-4 transition-colors hover:text-orange-700"
          >
            View all work →
          </Link>
        </div>
      </Reveal>
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {CASE_STUDIES.map((cs, i) => (
          <Reveal key={cs.client} delay={i * 0.08}>
            <article className="h-full rounded-3xl border border-stone-200 bg-white p-7 transition-transform duration-300 hover:-translate-y-1.5 sm:p-8">
              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-900">
                {cs.category}
              </span>
              <h3 className="font-display mt-4 text-xl font-bold text-stone-900 sm:text-2xl">
                {cs.client}: {cs.title}
              </h3>
              <dl className="mt-5 space-y-4 text-sm leading-relaxed">
                <div>
                  <dt className="font-semibold text-red-700">Challenge</dt>
                  <dd className="mt-0.5 text-stone-600">{cs.challenge}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-orange-700">Solution</dt>
                  <dd className="mt-0.5 text-stone-600">{cs.solution}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-green-700">Result</dt>
                  <dd className="mt-0.5 text-stone-600">{cs.result}</dd>
                </div>
              </dl>
              <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-stone-900 p-5 text-center sm:grid-cols-4">
                {cs.metrics.map((m) => (
                  <div key={m.label}>
                    <p className="font-display text-lg font-extrabold text-orange-400">
                      {m.value}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-tight text-stone-400">
                      {m.label}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
      <div className="mt-10 text-center">
        <Link
          href="/contact"
          className="shine-sweep inline-block rounded-full bg-[#F26419] px-7 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        >
          Get results like these — book your free expert call →
        </Link>
      </div>
    </section>
  );
}
