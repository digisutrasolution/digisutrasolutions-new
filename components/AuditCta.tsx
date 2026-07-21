import { Check } from "lucide-react";
import Reveal from "@/components/Reveal";
import AuditForm from "@/components/AuditForm";
import AuditScoreCard from "@/components/AuditScoreCard";

const AUDIT_CHECKS = [
  "SEO & keyword gaps",
  "Core Web Vitals & speed",
  "UX & conversion leaks",
  "Competitor snapshot",
];

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
                {AUDIT_CHECKS.map((c, i) => (
                  <Reveal key={c} delay={0.12 + i * 0.09} y={10}>
                    <li className="flex items-center gap-2 text-sm font-medium text-white">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 transition-colors duration-300 hover:bg-white/35">
                        <Check size={12} aria-hidden />
                      </span>
                      {c}
                    </li>
                  </Reveal>
                ))}
              </ul>
              <AuditForm />
            </div>

            {/* Animated audit score preview card — decorative, so phones
                skip it (the checklist + form carry the message) and the
                band stays a single screen tall */}
            <div className="hidden lg:block">
              <AuditScoreCard />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
