import { Check, Globe } from "lucide-react";
import Reveal from "@/components/Reveal";
import AuditForm from "@/components/AuditForm";

const AUDIT_CHECKS = [
  "SEO & keyword gaps",
  "Core Web Vitals & speed",
  "UX & conversion leaks",
  "Competitor snapshot",
];

const SCORE_ROWS = [
  { label: "SEO health", score: 62, color: "#F59E0B" },
  { label: "Site speed", score: 41, color: "#DC2626" },
  { label: "UX & conversion", score: 55, color: "#F59E0B" },
];

/* 58/100 arc: r=34 → circumference ≈ 213.6 */
const RING_C = 2 * Math.PI * 34;

export default function AuditCta() {
  return (
    <section id="audit" className="mx-auto max-w-[1280px] px-6 py-20 sm:py-24">
      <Reveal>
        <div className="bg-dots-light relative overflow-hidden rounded-[2rem] bg-[#F26419] px-6 py-12 sm:px-12 sm:py-14">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-orange-100">
                Free website audit
              </p>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                From website to{" "}
                <span className="font-serif-accent font-medium italic text-orange-100">
                  digital growth
                </span>
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-orange-50/90 sm:text-base">
                15 pages of findings across SEO, speed, UX and conversion —
                yours free, no strings attached. Know exactly what&apos;s
                holding your growth back.
              </p>
              <ul className="mt-6 grid max-w-md grid-cols-1 gap-2.5 sm:grid-cols-2">
                {AUDIT_CHECKS.map((c) => (
                  <li
                    key={c}
                    className="flex items-center gap-2 text-sm font-medium text-white"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                      <Check size={12} aria-hidden />
                    </span>
                    {c}
                  </li>
                ))}
              </ul>
              <AuditForm />
            </div>

            {/* Audit score preview card */}
            <div className="relative mx-auto w-full max-w-sm">
              <div className="rounded-2xl bg-white p-6 shadow-[0_30px_60px_rgba(124,45,18,0.35)]">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-3 text-sm text-stone-500">
                  <Globe size={15} className="text-[#F26419]" aria-hidden />
                  yourwebsite.com
                  <span className="ml-auto text-xs font-semibold text-stone-400">
                    audit preview
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-5">
                  <svg viewBox="0 0 80 80" className="h-24 w-24 shrink-0" aria-hidden>
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      fill="none"
                      stroke="#F5EDE4"
                      strokeWidth="9"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      fill="none"
                      stroke="#F26419"
                      strokeWidth="9"
                      strokeLinecap="round"
                      strokeDasharray={`${RING_C * 0.58} ${RING_C}`}
                      transform="rotate(-90 40 40)"
                    />
                    <text
                      x="40"
                      y="42"
                      textAnchor="middle"
                      fontSize="20"
                      fontWeight="800"
                      fill="#1C1917"
                    >
                      58
                    </text>
                    <text
                      x="40"
                      y="55"
                      textAnchor="middle"
                      fontSize="8"
                      fill="#78716C"
                    >
                      /100
                    </text>
                  </svg>
                  <div>
                    <p className="font-display text-sm font-bold text-stone-900">
                      Growth score
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-stone-500">
                      Where most websites sit before we get to work.
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {SCORE_ROWS.map((r) => (
                    <div key={r.label}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="font-medium text-stone-600">
                          {r.label}
                        </span>
                        <span className="font-bold" style={{ color: r.color }}>
                          {r.score}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-stone-100">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${r.score}%`,
                            backgroundColor: r.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                  ✓ Average client score after 6 months: 89/100
                </p>
              </div>
              <span className="animate-float-y absolute -top-3 right-2 rounded-full border border-white/60 bg-stone-900 px-3.5 py-1.5 text-xs font-semibold text-orange-300">
                15-page report · in 48 hours
              </span>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
