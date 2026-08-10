import "server-only";
import { db } from "@/lib/db";
import {
  DEFAULT_REVIEWS_CONFIG,
  REVIEWS_SETTING_KEY,
  ReviewsConfigSchema,
  type ReviewsConfig,
} from "@/lib/reviews-config";

/** Review-page settings, falling back to the defaults when unset or invalid —
    the page must render even if nobody has been near the settings screen. */
export async function getReviewsConfig(): Promise<ReviewsConfig> {
  try {
    const row = await db.siteSetting.findUnique({ where: { key: REVIEWS_SETTING_KEY } });
    const parsed = ReviewsConfigSchema.safeParse(row?.value ?? {});
    return parsed.success ? parsed.data : DEFAULT_REVIEWS_CONFIG;
  } catch {
    return DEFAULT_REVIEWS_CONFIG;
  }
}
