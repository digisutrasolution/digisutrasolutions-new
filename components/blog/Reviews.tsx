import { Star } from "lucide-react";
import ReviewForm from "@/components/blog/ReviewForm";

export type ReviewItem = {
  id: string;
  name: string;
  body: string;
  rating: number | null;
  reply: string | null;
  createdAt: Date;
};

function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          aria-hidden
          className={
            n <= value ? "fill-[#F26419] text-[#F26419]" : "text-stone-300"
          }
        />
      ))}
    </span>
  );
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/* Approved reader reviews + form. Data fetched by the page (which also
   feeds AggregateRating JSON-LD from the same numbers). */
export default function Reviews({
  postSlug,
  reviews,
  average,
}: {
  postSlug: string;
  reviews: ReviewItem[];
  average: number | null;
}) {
  const rated = reviews.filter((r) => r.rating != null);

  return (
    <section id="reviews" className="mt-12 border-t border-stone-200 pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-extrabold tracking-tight text-stone-900">
          Reader reviews
        </h2>
        {average != null && (
          <p className="flex items-center gap-2 text-sm text-stone-500">
            <Stars value={Math.round(average)} />
            <span className="font-bold text-stone-900">{average.toFixed(1)}</span>
            · {rated.length} {rated.length === 1 ? "rating" : "ratings"}
          </p>
        )}
      </div>

      {reviews.length > 0 && (
        <div className="mt-5 space-y-4">
          {reviews.map((r) => (
            <div key={r.id}>
              <div className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-[11px] font-bold text-orange-800">
                    {initials(r.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-stone-900">{r.name}</p>
                    <p className="text-xs text-stone-400">
                      {r.createdAt.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  {r.rating != null && (
                    <span className="ml-auto shrink-0">
                      <Stars value={r.rating} />
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">
                  {r.body}
                </p>
              </div>
              {r.reply && (
                <div className="ml-6 mt-2 rounded-2xl border border-[#FFE3CC] bg-[#FFF6EF] p-4">
                  <p className="flex items-center gap-2 text-xs font-bold text-orange-950">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F26419] text-[8px] font-bold text-white">
                      DS
                    </span>
                    DigiSutra Team
                    <span className="rounded-full bg-[#F26419] px-2 py-0.5 text-[9px] font-bold text-white">
                      Author
                    </span>
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">
                    {r.reply}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-5">
        <ReviewForm postSlug={postSlug} />
      </div>
    </section>
  );
}
