import {
  Bot,
  Clock,
  FileSearch,
  Globe,
  IndianRupee,
  MessageCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import Reveal from "@/components/Reveal";
import { FAQS } from "@/lib/data";

/* Positional — one icon per FAQS entry, same order as lib/data.ts. */
const ICONS = [
  IndianRupee,
  Clock,
  FileSearch,
  Search,
  Bot,
  RefreshCw,
  Globe,
  MessageCircle,
];

const WA_HREF =
  "https://wa.me/919953900123?text=" +
  encodeURIComponent("Hi DigiSutra! I have a question about your services.");

/* Open answer cards — every Q&A stays permanently visible in the DOM so
   search engines and AI Overviews can lift the answer-first copy without
   any interaction. */
export default function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-[1280px] px-6 pt-20 sm:pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: `${f.lead} ${f.rest}` },
            })),
          }),
        }}
      />
      <Reveal>
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
          FAQ
        </p>
        <h2 className="font-display text-center text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
          Straight{" "}
          <span className="font-serif-accent font-medium italic text-orange-600">
            answers
          </span>
        </h2>
      </Reveal>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {FAQS.map((faq, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <Reveal key={faq.q} delay={0.05 * (i % 2)} className="h-full">
              <div className="group flex h-full gap-4 rounded-2xl border border-stone-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#F26419] hover:shadow-[0_16px_40px_rgba(28,25,23,0.08)]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition-colors duration-300 group-hover:bg-[#F26419] group-hover:text-white">
                  <Icon size={18} aria-hidden />
                </span>
                <div>
                  <h3 className="font-display text-sm font-bold text-stone-900 sm:text-base">
                    {faq.q}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">
                    <b className="font-semibold text-orange-800">{faq.lead}</b>{" "}
                    {faq.rest}
                  </p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
      <Reveal delay={0.15}>
        <p className="mt-8 text-center text-sm text-stone-600">
          Something else on your mind?{" "}
          <a
            href={WA_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#F26419] hover:underline"
          >
            WhatsApp us →
          </a>{" "}
          — real human, usually within minutes.
        </p>
      </Reveal>
    </section>
  );
}
