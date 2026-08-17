import Image from "next/image";
import Link from "next/link";
import { withBase } from "@/lib/base-path";
import LinkedInGlyph from "@/components/LinkedInGlyph";
import {
  ORG_BYLINE,
  experienceLabel,
  initials,
  type AuthorLike,
} from "@/lib/authors";

/**
 * "About the author" beneath an article.
 *
 * Replaces a hardcoded block that always said "Written by the DigiSutra growth
 * team" — which contradicted the byline at the top of the same page whenever a
 * person was credited. One source now feeds both.
 *
 * With no author it still shows the organisation, deliberately: a team-written
 * post saying so is a better trust signal than a person who does not exist.
 */
export default function AuthorBox({ author }: { author: AuthorLike | null }) {
  const name = author?.name ?? ORG_BYLINE.name;
  const role = author?.role || (author ? "" : ORG_BYLINE.role);
  const bio = author?.bio || (author ? "" : ORG_BYLINE.bio);
  const years = experienceLabel(author?.experienceYears ?? null);

  return (
    <div className="mt-10 rounded-2xl border border-stone-200 bg-white p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400">
        About the author
      </p>
      <div className="mt-3 flex items-start gap-4">
        <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F26419] text-sm font-bold text-white">
          {author?.photoUrl ? (
            <Image
              src={withBase(author.photoUrl)}
              alt=""
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            initials(name)
          )}
        </span>

        <div className="min-w-0">
          <p className="font-display text-base font-bold text-stone-900">
            {author ? (
              <Link href={`/author/${author.slug}`} className="hover:text-orange-700">
                {name}
              </Link>
            ) : (
              name
            )}
          </p>
          {(role || years) && (
            <p className="mt-0.5 text-xs font-semibold text-orange-800">
              {[role, years].filter(Boolean).join(" · ")}
            </p>
          )}
          {bio && (
            <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{bio}</p>
          )}

          {author && author.credentials.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {author.credentials.map((c) => (
                <li
                  key={c}
                  className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-600"
                >
                  {c}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold">
            {author && (
              <Link href={`/author/${author.slug}`} className="text-orange-700 hover:underline">
                More from {name.split(/\s+/)[0]}
              </Link>
            )}
            {author?.linkedinUrl && (
              /* rel="me" alongside the sameAs in the JSON-LD: the machine-
                 readable claim and the visible link should agree. */
              <a
                href={author.linkedinUrl}
                target="_blank"
                rel="me noopener noreferrer"
                className="inline-flex items-center gap-1 text-stone-500 hover:text-orange-700"
              >
                <LinkedInGlyph /> LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
