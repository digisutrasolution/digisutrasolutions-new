import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import OfferClaim from "@/components/OfferClaim";
import { getFooterSocials } from "@/lib/footer";
import { activePromotion, discountLabel } from "@/lib/promotions-server";
import { markOpened, resolveOutreachToken } from "@/lib/outreach-server";

/* Offer page, reached only by a tokenised link we sent to one lead. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "A thank-you from DigiSutra",
  robots: { index: false, follow: false },
};

export default async function OfferPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const link = await resolveOutreachToken(token, "PROMO");
  if (!link) notFound();

  void markOpened(link.id);

  const promo = await activePromotion(link.promotionId);
  const socials = (await getFooterSocials()) ?? [];
  const firstName = link.lead.name.trim().split(/\s+/)[0] ?? "";

  if (!promo) {
    return (
      <section className="mx-auto max-w-3xl px-6 pb-20 pt-16 sm:pb-24 sm:pt-20">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-stone-900">
          This offer has ended
        </h1>
        <p className="mt-3 text-sm text-stone-600">
          Get in touch anyway — we&rsquo;ll tell you what&rsquo;s running now.
        </p>
      </section>
    );
  }

  /* An empty channels list means "all of them", which is what an untouched
     promotion does — narrowing is the deliberate act, not the default. */
  const shown = promo.channels.length
    ? socials.filter((s) => promo.channels.includes(s.key))
    : socials;

  // Already claimed? Show the code rather than asking again.
  const existing = await db.promotionClaim
    .findUnique({
      where: { promotionId_leadId: { promotionId: promo.id, leadId: link.leadId } },
      select: { code: true },
    })
    .catch(() => null);

  return (
    <section className="mx-auto max-w-3xl px-6 pb-20 pt-16 sm:pb-24 sm:pt-20">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
        {firstName ? `For ${firstName}` : "For you"}
      </p>
      <h1 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
        {promo.headline || `Follow us and take ${discountLabel(promo)}`}
      </h1>
      {promo.body && (
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">
          {promo.body}
        </p>
      )}

      <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Step one — follow us
        </p>
        {shown.length > 0 ? (
          <ul className="mt-3 flex list-none flex-wrap gap-2">
            {shown.map((s) => (
              <li key={s.key}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-800 transition-colors hover:border-orange-400 hover:text-orange-700"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-stone-500">
            Our profiles are linked in the footer of the site.
          </p>
        )}

        <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-stone-500">
          Step two — claim {discountLabel(promo)}
        </p>
        <div className="mt-3">
          {existing ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-800">
                Your code
              </p>
              <p className="font-display mt-1 select-all text-3xl font-extrabold text-green-900">
                {existing.code}
              </p>
            </div>
          ) : (
            <OfferClaim token={token} ctaLabel={`I've followed — get my ${discountLabel(promo)}`} />
          )}
        </div>
      </div>
    </section>
  );
}
