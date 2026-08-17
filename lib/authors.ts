import { SITE_URL } from "@/lib/site";

/* Author bylines.
   The organisation is a first-class byline here rather than a fallback string.
   A post with no named author is genuinely team-written, and saying so is a
   better E-E-A-T signal than crediting an invented person — Google objects to
   fake authors, not to an honest Organization author. */

/** What a byline needs, whoever it belongs to. */
export type AuthorLike = {
  slug: string;
  name: string;
  role: string;
  photoUrl: string | null;
  bio: string;
  experienceYears: number | null;
  credentials: string[];
  linkedinUrl: string | null;
};

/** The organisation byline, used when a post has no named author. */
export const ORG_BYLINE = {
  name: "DigiSutra Solutions",
  role: "Growth team",
  bio: "Digital marketing agency in Noida, India — SEO, ads and AI automation for startups and SMBs across 12 countries.",
} as const;

/** URL-safe slug from a person's name. */
export function authorSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

/** Two-letter initials for the avatar when there is no photo. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** "6 years' experience", or "" when it was never filled in. Never guessed. */
export function experienceLabel(years: number | null): string {
  if (!years || years < 1) return "";
  return `${years} ${years === 1 ? "year" : "years"}' experience`;
}

/**
 * The `author` node for an Article.
 *
 * A bare `{ "@type": "Person", name }` — which is what this site emitted
 * before — gives a search engine a string and nothing to attach reputation to.
 * `url` points at a profile that actually exists, and `sameAs` links the
 * person to a profile someone else controls; those two are the parts that
 * carry weight.
 */
export function authorJsonLd(author: AuthorLike | null) {
  if (!author) {
    return { "@type": "Organization", name: ORG_BYLINE.name, url: SITE_URL };
  }
  return {
    "@type": "Person",
    name: author.name,
    url: `${SITE_URL}/author/${author.slug}`,
    ...(author.role ? { jobTitle: author.role } : {}),
    ...(author.photoUrl ? { image: `${SITE_URL}${author.photoUrl}` } : {}),
    ...(author.linkedinUrl ? { sameAs: [author.linkedinUrl] } : {}),
    worksFor: { "@type": "Organization", name: ORG_BYLINE.name, url: SITE_URL },
  };
}
