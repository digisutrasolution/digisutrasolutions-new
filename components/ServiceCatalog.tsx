import Link from "next/link";
import Image from "next/image";
import { Award, Check, Megaphone, Code2, Palette, Sparkles } from "lucide-react";
import Reveal from "@/components/Reveal";
import { withBase } from "@/lib/base-path";
import { CERTS, SERVICE_CATEGORIES } from "@/lib/data";

const ICONS = {
  megaphone: Megaphone,
  code: Code2,
  palette: Palette,
  sparkles: Sparkles,
} as const;

/* Each studio panel gets its own duotone-graded stock photo. */
const PANELS = [
  { image: "/services/marketing.jpg", metricLabel: "+248% avg organic growth" },
  {
    image: "/services/development.jpg",
    metricLabel: "99.9% uptime · 214ms responses",
  },
  { image: "/services/design.jpg", metricLabel: "95+ Lighthouse scores" },
  { image: "/services/ai.jpg", metricLabel: "24/7 always-on agents" },
] as const;

export default function ServiceCatalog() {
  return (
    <section id="services" className="mx-auto max-w-[1280px] px-6 pt-16 sm:pt-20">
      <Reveal>
        <div className="text-center">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
            DigiSutra&rsquo;s Studios —{" "}
            <span className="font-serif-accent font-medium italic text-orange-600">
              Your Growth, Our Sutra
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-5xl text-[0.95rem] leading-relaxed text-stone-600">
            DigiSutra Solutions is a leading digital marketing agency in India,
            helping startups and SMBs worldwide grow through{" "}
            <span className="lg:block">
              <b className="font-semibold text-orange-700">SEO</b>,{" "}
              <b className="font-semibold text-orange-700">PPC</b>,{" "}
              <b className="font-semibold text-orange-700">Social Media</b>,{" "}
              <b className="font-semibold text-orange-700">
                Email &amp; SMS Marketing
              </b>
              ,{" "}
              <b className="font-semibold text-orange-700">
                Organic Lead Generation
              </b>
              , <b className="font-semibold text-orange-700">Development</b>,{" "}
              <b className="font-semibold text-orange-700">AI Automation</b>.
            </span>
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3 empty:hidden">
            {CERTS.map((cert) => (
              <span
                key={cert}
                className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-600"
              >
                <Award size={14} className="text-orange-600" aria-hidden />
                {cert}
              </span>
            ))}
          </div>
        </div>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="mt-10 flex flex-col gap-3 lg:h-[360px] lg:flex-row">
          {SERVICE_CATEGORIES.map((cat, i) => {
            const Icon = ICONS[cat.icon];
            const p = PANELS[i];
            return (
              <div
                key={cat.title}
                className="xpanel group relative overflow-hidden rounded-2xl bg-stone-900"
              >
                {/* Stock photo + brand duotone grade */}
                <Image
                  src={withBase(p.image)}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  aria-hidden
                />
                <span
                  className="absolute inset-0 bg-[#F26419]/30 mix-blend-color"
                  aria-hidden
                />
                <span
                  className="absolute inset-0 bg-[linear-gradient(160deg,rgba(124,45,18,0.5),rgba(18,12,8,0.55))] mix-blend-multiply"
                  aria-hidden
                />

                {/* Collapsed spine (desktop only) */}
                <div className="xmini pointer-events-none absolute inset-0 flex-col items-center justify-between bg-[linear-gradient(180deg,rgba(18,12,8,0.25),rgba(18,12,8,0.65))] py-6">
                  <Icon size={22} className="text-orange-200" aria-hidden />
                  <span className="vtext text-sm font-bold tracking-wide text-white">
                    {cat.title}
                  </span>
                  <span className="text-sm font-extrabold text-[#FDBA74]">
                    0{i + 1}
                  </span>
                </div>

                {/* Expanded content (always visible on mobile) */}
                <div className="xfull flex flex-col bg-[linear-gradient(180deg,rgba(18,12,8,0.35),rgba(18,12,8,0.85))] p-6">
                  <div className="flex items-center justify-between">
                    <span className="font-display flex items-center gap-2.5 text-lg font-bold text-white">
                      <Icon size={19} className="text-[#FDBA74]" aria-hidden />
                      {cat.title}
                    </span>
                    <span className="text-sm font-extrabold text-[#FDBA74]">
                      0{i + 1}
                    </span>
                  </div>
                  <ul className="mt-5 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
                    {cat.items.map((item) => (
                      <li
                        key={item}
                        className="xitem flex items-start gap-2 whitespace-nowrap text-sm text-orange-50"
                      >
                        <Check
                          size={14}
                          className="mt-0.5 shrink-0 text-[#FDBA74]"
                          aria-hidden
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/services"
                    className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-bold text-[#FDBA74] no-underline transition-transform hover:translate-x-1"
                  >
                    {p.metricLabel} →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}
