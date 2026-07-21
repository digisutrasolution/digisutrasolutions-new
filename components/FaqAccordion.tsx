"use client";

import { createElement, useState } from "react";
import { ChevronDown } from "lucide-react";
import Reveal from "@/components/Reveal";
import { navIcon } from "@/components/nav-icons";

type FaqItem = { question: string; lead: string; rest: string; icon?: string };

/* Phones get a collapsible accordion (first question open) so the home page
   stays short; from `sm` up every answer is forced visible again — the
   original open-card grid — so search engines and AI Overviews always see
   the full copy on the breakpoints that matter, and the DOM is identical
   on every viewport (mobile-first indexing keeps all 8 answers). */
export default function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-2">
      {faqs.map((faq, i) => {
        const isOpen = open === i;
        return (
          <Reveal key={faq.question} delay={0.05 * (i % 2)} className="h-full">
            <div className="group flex h-full gap-4 rounded-2xl border border-stone-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#F26419] hover:shadow-[0_16px_40px_rgba(28,25,23,0.08)] sm:p-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition-colors duration-300 group-hover:bg-[#F26419] group-hover:text-white">
                {createElement(navIcon(faq.icon), { size: 18, "aria-hidden": true })}
              </span>
              <div className="min-w-0 flex-1">
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="flex w-full cursor-pointer items-start justify-between gap-2 text-left sm:pointer-events-none sm:cursor-default"
                >
                  <h3 className="font-display text-sm font-bold text-stone-900 sm:text-base">
                    {faq.question}
                  </h3>
                  <ChevronDown
                    size={16}
                    aria-hidden
                    className={`mt-0.5 shrink-0 text-stone-400 transition-transform duration-300 sm:hidden ${
                      isOpen ? "rotate-180 text-[#F26419]" : ""
                    }`}
                  />
                </button>
                <p
                  className={`mt-2 text-sm leading-relaxed text-stone-600 sm:block ${
                    isOpen ? "block" : "hidden"
                  }`}
                >
                  <b className="font-semibold text-orange-800">{faq.lead}</b>{" "}
                  {faq.rest}
                </p>
              </div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
