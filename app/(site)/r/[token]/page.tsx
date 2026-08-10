import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import ReviewRequestForm from "@/components/ReviewRequestForm";
import { getReviewsConfig } from "@/lib/reviews-config-server";
import { googleReviewUrl } from "@/lib/reviews-config";
import { markOpened, resolveOutreachToken } from "@/lib/outreach-server";

/* Review request page, reached only by a tokenised link we sent.

   Never indexed: it is addressed to one client, the URL carries a token, and
   there is nothing here worth a search result. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leave a review",
  robots: { index: false, follow: false },
};

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const link = await resolveOutreachToken(token, "REVIEW");
  if (!link) notFound();

  void markOpened(link.id);
  const cfg = await getReviewsConfig();
  const firstName = link.lead.name.trim().split(/\s+/)[0] ?? "";

  return (
    <section className="mx-auto max-w-3xl px-6 pb-20 pt-16 sm:pb-24 sm:pt-20">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
        {firstName ? `Hello ${firstName}` : "Hello"}
      </p>
      <h1 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
        {cfg.heading}
      </h1>
      {cfg.intro && (
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">
          {cfg.intro}
        </p>
      )}

      {link.completedAt ? (
        <div className="mt-8 rounded-3xl border border-green-200 bg-green-50 p-6">
          <p className="font-display text-lg font-bold text-green-900">{cfg.thanks}</p>
        </div>
      ) : (
        <div className="mt-8">
          <ReviewRequestForm token={token} defaultName={link.lead.name} thanks={cfg.thanks} />
        </div>
      )}

      {/* The Google ask sits alongside, not behind a sentiment check — see the
          note in ReviewRequestForm. Hidden entirely when no Place ID is set,
          because a review button that goes nowhere is worse than none. */}
      {cfg.placeId.trim() && (
        <div className="mt-6 rounded-3xl border border-stone-200 bg-[#FFFBF7] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-display flex items-center gap-2 text-base font-bold text-stone-900">
                <Star size={17} className="fill-[#F26419] text-[#F26419]" aria-hidden />
                {cfg.googleCta}
              </p>
              {cfg.googleNote && (
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-stone-600">
                  {cfg.googleNote}
                </p>
              )}
            </div>
            <a
              href={googleReviewUrl(cfg.placeId)}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-full bg-[#F26419] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600"
            >
              {cfg.googleCta}
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
