import { z } from "zod";

/* Admin-managed settings for the review-request page. Client-safe (no server
   imports) so both the public page and the settings form can use it; the
   loader is lib/reviews-config-server.ts. */

export const REVIEWS_SETTING_KEY = "reviews";

const s = (max: number, def = "") => z.string().trim().max(max).default(def);

export const ReviewsConfigSchema = z.object({
  /* Google Place ID for the business. Without it the Google button is simply
     not rendered — a review CTA pointing nowhere is worse than none. Find it
     with the site's own /free-tools/google-review-link. */
  placeId: s(120),
  heading: s(120, "How did we do?"),
  intro: s(400, "Your words help other businesses decide whether to trust us. It takes a minute."),
  /* Copy on the Google button. Shown only when placeId is set. */
  googleCta: s(80, "Leave a Google review"),
  googleNote: s(300, "Opens Google in a new tab. Public, and it helps us more than anything else you could do."),
  thanks: s(300, "Thank you — that means a lot. We read every one."),
});

export type ReviewsConfig = z.infer<typeof ReviewsConfigSchema>;

export const DEFAULT_REVIEWS_CONFIG: ReviewsConfig = ReviewsConfigSchema.parse({});

/**
 * The public "write a review" URL for a Place ID.
 *
 * Same format the site's own Google Review Link Generator produces — kept in
 * one place so the tool and the internal request page can never disagree.
 */
export function googleReviewUrl(placeId: string): string {
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId.trim())}`;
}
