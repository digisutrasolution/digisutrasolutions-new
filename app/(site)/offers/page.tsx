import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgePercent, MessageCircle, Sparkles } from "lucide-react";
import Reveal from "@/components/Reveal";
import OfferCard, { type OfferView } from "@/components/offers/OfferCard";
import { getFooterSocials } from "@/lib/footer";
import { discountLabel, discountParts, livePromotions } from "@/lib/promotions-server";
import { SITE_URL } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";

/* Offers are time-boxed and claim-counted, so a cached copy of this page goes
   stale the moment someone claims the last code. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Offers & Discounts",
  description:
    "Every DigiSutra offer running right now — follow us, claim your code, and use it on your next enquiry. No contracts, no catch.",
  alternates: { canonical: `${SITE_URL}/offers` },
};

const STEPS = [
  {
    n: "01",
    title: "Pick an offer",
    body: "Everything live is on this page. When an offer ends or its codes run out, it comes off — nothing here is expired.",
  },
  {
    n: "02",
    title: "Follow us",
    body: "Tap the profiles on the offer. It takes a few seconds and keeps you in front of the work we publish.",
  },
  {
    n: "03",
    title: "Claim your code",
    body: "Leave a name and a number, get your code instantly. Quote it on your next enquiry and we apply it.",
  },
];

export default async function OffersPage() {
  const [promos, socials] = await Promise.all([livePromotions(), getFooterSocials()]);
  const all = socials ?? [];

  const offers: OfferView[] = promos.map((p) => {
    const parts = discountParts(p);
    /* An empty channels list means "all of them", which is what an untouched
       promotion does — narrowing is the deliberate act, not the default. */
    const channels = p.channels.length
      ? all.filter((s) => p.channels.includes(s.key))
      : all;
    return {
      id: p.id,
      name: p.name,
      headline: p.headline || `Follow us and take ${discountLabel(p)}`,
      body: p.body,
      discountValue: parts.value,
      discountUnit: parts.unit,
      discountLabel: discountLabel(p),
      channels: channels.map((c) => ({ key: c.key, label: c.label, url: c.url })),
      endsAt: p.endsAt ? p.endsAt.toISOString() : null,
      remaining: p.remaining,
      claimed: p.claimed,
      maxClaims: p.maxClaims,
    };
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Offers", item: `${SITE_URL}/offers` },
        ],
      },
      ...offers.map((o) => ({
        "@type": "Offer",
        name: o.headline,
        description: o.body || o.headline,
        url: `${SITE_URL}/offers`,
        availability: "https://schema.org/InStock",
        seller: { "@type": "Organization", name: "DigiSutra Solutions" },
        ...(o.endsAt ? { validThrough: o.endsAt } : {}),
      })),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />

      {/* ---------------- hero ---------------- */}
      {/* overflow-x-clip: the floating shapes are transformed and would
          otherwise widen the document — the bug this codebase has hit before. */}
      <section className="relative overflow-x-clip bg-stone-900">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          aria-hidden
          style={{
            background:
              "radial-gradient(58rem 26rem at 18% -10%, rgba(242,100,25,0.42), transparent 62%), radial-gradient(40rem 22rem at 92% 8%, rgba(242,100,25,0.16), transparent 65%)",
          }}
        />
        {/* Ambient tickets. Decorative only, so hidden from assistive tech. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="offer-float absolute -left-10 top-16 h-28 w-28 rounded-3xl border border-white/10 bg-white/[0.04]"
            style={{ ["--spin" as string]: "-14deg", animationDelay: "0s" }}
          />
          <div
            className="offer-float absolute right-[8%] top-10 h-20 w-20 rounded-2xl border border-white/10 bg-white/[0.03]"
            style={{ ["--spin" as string]: "18deg", animationDelay: "-4s" }}
          />
          <div
            className="offer-float absolute bottom-8 right-[26%] h-16 w-16 rounded-2xl border border-white/10 bg-white/[0.03]"
            style={{ ["--spin" as string]: "8deg", animationDelay: "-8s" }}
          />
        </div>

        <div className="relative mx-auto max-w-[1280px] px-6 pb-20 pt-20 sm:pb-24 sm:pt-24">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-300">
              <Sparkles size={13} aria-hidden />
              {offers.length > 0
                ? `${offers.length} offer${offers.length === 1 ? "" : "s"} running now`
                : "Offers"}
            </span>
          </Reveal>
          <Reveal delay={0.06}>
            <h1 className="font-display mt-6 max-w-4xl text-4xl font-extrabold leading-[1.04] tracking-tight text-white sm:text-6xl">
              Good work, at a{" "}
              <span className="font-serif-accent italic text-[#F26419]">better price.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-stone-300 sm:text-lg">
              Every offer we&rsquo;re running is on this page — nothing expired, nothing
              hidden behind a mailing list. Follow us, claim your code, and quote it
              whenever you&rsquo;re ready to start.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------------- the offers ---------------- */}
      <section className="mx-auto max-w-[1280px] px-6 pt-16 sm:pt-20">
        {offers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
            <BadgePercent size={30} className="mx-auto text-stone-300" aria-hidden />
            <h2 className="font-display mt-4 text-xl font-extrabold tracking-tight text-stone-900">
              Nothing running right now
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-600">
              We run offers in short bursts rather than keeping a permanent
              discount up. Tell us what you need and we&rsquo;ll let you know the
              moment something applies to it.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#F26419] px-6 text-sm font-bold text-white transition-colors hover:bg-orange-600"
            >
              Talk to us <ArrowRight size={15} aria-hidden />
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((o, i) => (
              <OfferCard key={o.id} offer={o} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* ---------------- how it works ---------------- */}
      <section className="mx-auto max-w-[1280px] px-6 pt-20 sm:pt-24">
        <Reveal>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
            How it <span className="font-serif-accent italic text-[#F26419]">works</span>
          </h2>
        </Reveal>
        {/* A real sequence, so it is numbered and marked up as an ordered list. */}
        <ol className="mt-8 grid list-none gap-6 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} as="li" delay={0.06 * i} className="rounded-2xl border border-stone-200 bg-white p-6">
              <span className="font-display block text-sm font-extrabold tracking-wide text-[#F26419]">
                {s.n}
              </span>
              <h3 className="font-display mt-2 text-lg font-extrabold tracking-tight text-stone-900">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{s.body}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ---------------- terms + fallback CTA ---------------- */}
      <section className="mx-auto max-w-[1280px] px-6 py-20 sm:py-24">
        <div className="flex flex-col gap-6 rounded-3xl bg-stone-900 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div className="max-w-xl">
            <h2 className="font-display text-xl font-extrabold tracking-tight text-white sm:text-2xl">
              Not sure which offer fits?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-400">
              Tell us what you&rsquo;re trying to do and we&rsquo;ll point you at the
              right one — or tell you straight if none of them help.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#F26419] px-6 text-sm font-bold text-white transition-colors hover:bg-orange-600"
          >
            <MessageCircle size={16} aria-hidden />
            Ask us
          </Link>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-stone-500">
          One code per person. Codes apply to new engagements, can&rsquo;t be combined
          with another offer, and expire with the offer they came from. We can&rsquo;t
          verify follows — claiming takes you at your word.
        </p>
      </section>
    </>
  );
}
