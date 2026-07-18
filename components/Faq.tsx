import Link from "next/link";
import { createElement } from "react";
import Reveal from "@/components/Reveal";
import { navIcon } from "@/components/nav-icons";
import { getLiveFaqs } from "@/lib/faq";

const WA_HREF =
  "https://wa.me/919953900123?text=" +
  encodeURIComponent("Hi DigiSutra! I have a question about your services.");

/* Open answer cards — every Q&A stays permanently visible in the DOM so
   search engines and AI Overviews can lift the answer-first copy without
   any interaction. Content is admin-managed (/admin/faq): items marked
   featured appear here (first 8); the full bank lives on /faq. */
export default async function Faq() {
  const faqs = (await getLiveFaqs({ featuredOnly: true })).slice(0, 8);
  if (faqs.length === 0) return null;

  return (
    <section id="faq" className="mx-auto max-w-[1280px] px-6 pt-20 sm:pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.question,
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
        {faqs.map((faq, i) => (
          <Reveal key={faq.question} delay={0.05 * (i % 2)} className="h-full">
            <div className="group flex h-full gap-4 rounded-2xl border border-stone-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#F26419] hover:shadow-[0_16px_40px_rgba(28,25,23,0.08)]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition-colors duration-300 group-hover:bg-[#F26419] group-hover:text-white">
                {createElement(navIcon(faq.icon), { size: 18, "aria-hidden": true })}
              </span>
              <div>
                <h3 className="font-display text-sm font-bold text-stone-900 sm:text-base">
                  {faq.question}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  <b className="font-semibold text-orange-800">{faq.lead}</b>{" "}
                  {faq.rest}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.15}>
        <p className="mt-8 text-center text-sm text-stone-600">
          <Link href="/faq" className="font-semibold text-[#F26419] hover:underline">
            See every question answered →
          </Link>{" "}
          or{" "}
          <a
            href={WA_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#F26419] hover:underline"
          >
            WhatsApp us
          </a>{" "}
          — real human, usually within minutes.
        </p>
      </Reveal>
    </section>
  );
}
