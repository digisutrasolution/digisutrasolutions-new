import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Clock, FileSearch, MessageCircle } from "lucide-react";
import { SITE_URL } from "@/lib/site";

/**
 * A real URL for a completed enquiry.
 *
 * The lead form previously swapped to an inline success state, which no
 * analytics tool can see — there is no pageview, so there is no conversion
 * to count and no way to attribute it to a campaign. A distinct noindexed
 * page gives every measurement tool (and the first-party counter) a single
 * unambiguous conversion event.
 */
export const metadata: Metadata = {
  title: "Thank you — we've got your enquiry",
  description: "Your enquiry has reached the DigiSutra Solutions team.",
  alternates: { canonical: `${SITE_URL}/thank-you` },
  // Never a landing page: it would rank for nothing and confuse the
  // conversion count if someone arrived from search.
  robots: { index: false, follow: false },
};

const WA_HREF =
  "https://wa.me/919953900123?text=" +
  encodeURIComponent("Hi DigiSutra! I just sent an enquiry through the site.");

const NEXT_STEPS = [
  {
    icon: Clock,
    title: "We reply within 2 business hours",
    copy: "A strategist reads your enquiry and comes back on WhatsApp or email — whichever you gave us.",
  },
  {
    icon: FileSearch,
    title: "Your free 15-page audit follows",
    copy: "If you shared a website, the audit lands within 48 hours. No sales call needed to receive it.",
  },
  {
    icon: MessageCircle,
    title: "Need it sooner?",
    copy: "Message us on WhatsApp and we'll jump the queue — a real person, not an autoresponder.",
  },
];

export default function ThankYouPage() {
  return (
    <section className="mx-auto max-w-[1280px] px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Check size={30} aria-hidden />
        </span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
          Enquiry received
        </p>
        <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
          Thank you —{" "}
          <span className="font-serif-accent font-medium italic text-orange-600">
            we&rsquo;re on it
          </span>
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-stone-600 sm:text-base">
          Your details are with the right desk. Here&rsquo;s exactly what
          happens next, so nothing is a mystery.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
        {NEXT_STEPS.map((s) => (
          <div
            key={s.title}
            className="rounded-2xl border border-stone-200 bg-white p-6"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <s.icon size={20} aria-hidden />
            </span>
            <h2 className="font-display mt-4 text-base font-bold text-stone-900">
              {s.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">{s.copy}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-3">
        <a
          href={WA_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-600"
        >
          Continue on WhatsApp <ArrowRight size={14} aria-hidden />
        </a>
        <Link
          href="/free-tools"
          className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-6 py-3 text-sm font-bold text-stone-800 transition-colors hover:border-[#F26419] hover:text-orange-700"
        >
          Try a free tool while you wait
        </Link>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-6 py-3 text-sm font-bold text-stone-800 transition-colors hover:border-[#F26419] hover:text-orange-700"
        >
          Read the journal
        </Link>
      </div>
    </section>
  );
}
