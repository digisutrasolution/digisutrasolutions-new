import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import LinkedInGlyph from "@/components/LinkedInGlyph";
import PostListCard from "@/components/blog/PostListCard";
import { withBase } from "@/lib/base-path";
import { db } from "@/lib/db";
import { ORG_BYLINE, experienceLabel, initials } from "@/lib/authors";
import { SITE_URL } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";

/* The public profile behind a byline.

   This page is the thing that makes an author name mean anything: without a
   real page to point at, the `url` in an Article's author node resolves to
   nothing and the name is just a string. */
export const dynamic = "force-dynamic";

const getAuthor = async (slug: string) =>
  db.author.findFirst({ where: { slug, isActive: true } }).catch(() => null);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = await getAuthor(slug);
  if (!a) return {};
  const title = a.role ? `${a.name} — ${a.role}` : a.name;
  return {
    title,
    description:
      a.bio ||
      `Articles by ${a.name} at DigiSutra Solutions — SEO, ads and AI automation.`,
    alternates: { canonical: `${SITE_URL}/author/${a.slug}` },
  };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const author = await getAuthor(slug);
  if (!author) notFound();

  const posts = await db.blogPost.findMany({
    where: { status: "PUBLISHED", authorId: author.id },
    orderBy: { publishedAt: "desc" },
    take: 20,
    select: {
      slug: true,
      title: true,
      excerpt: true,
      category: true,
      coverUrl: true,
      publishedAt: true,
      readingMinutes: true,
    },
  });

  const years = experienceLabel(author.experienceYears);
  const url = `${SITE_URL}/author/${author.slug}`;

  /* ProfilePage wrapping a Person, which is the shape Google documents for an
     author profile. sameAs is the load-bearing part: it ties this page to an
     identity someone else vouches for. */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: author.name,
      url,
      ...(author.role ? { jobTitle: author.role } : {}),
      ...(author.bio ? { description: author.bio } : {}),
      ...(author.photoUrl ? { image: `${SITE_URL}${author.photoUrl}` } : {}),
      ...(author.linkedinUrl ? { sameAs: [author.linkedinUrl] } : {}),
      ...(author.credentials.length
        ? { hasCredential: author.credentials }
        : {}),
      worksFor: { "@type": "Organization", name: ORG_BYLINE.name, url: SITE_URL },
    },
  };

  return (
    <section className="mx-auto max-w-[1280px] px-6 py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />

      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 transition-colors hover:text-orange-700"
      >
        <ArrowRight size={14} aria-hidden className="rotate-180" /> Journal
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="flex flex-wrap items-start gap-5">
            <span className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#F26419] text-2xl font-bold text-white">
              {author.photoUrl ? (
                <Image
                  src={withBase(author.photoUrl)}
                  alt={author.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                  priority
                />
              ) : (
                initials(author.name)
              )}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
                Author
              </p>
              <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
                {author.name}
              </h1>
              {(author.role || years) && (
                <p className="mt-1 text-sm font-semibold text-stone-600">
                  {[author.role, years].filter(Boolean).join(" · ")}
                </p>
              )}
              {author.linkedinUrl && (
                <a
                  href={author.linkedinUrl}
                  target="_blank"
                  rel="me noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 transition-colors hover:border-[#F26419] hover:text-orange-700"
                >
                  <LinkedInGlyph /> LinkedIn
                </a>
              )}
            </div>
          </div>

          {author.bio && (
            <p className="mt-6 text-base leading-relaxed text-stone-600">
              {author.bio}
            </p>
          )}

          {author.credentials.length > 0 && (
            <div className="mt-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400">
                Credentials
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {author.credentials.map((c) => (
                  <li
                    key={c}
                    className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-800">
              {posts.length > 0
                ? `${posts.length} ${posts.length === 1 ? "article" : "articles"}`
                : "Articles"}
            </p>
            <div className="mt-4 space-y-4">
              {posts.map((p) => (
                <PostListCard key={p.slug} post={p} />
              ))}
              {posts.length === 0 && (
                <p className="rounded-2xl border border-stone-200 bg-white p-10 text-center text-sm text-stone-500">
                  No published articles from {author.name.split(/\s+/)[0]} yet.
                </p>
              )}
            </div>
          </div>
        </div>

        <aside>
          <div className="rounded-2xl bg-[#FFF6EF] p-5">
            <p className="font-display text-sm font-bold text-orange-950">
              Work with our team
            </p>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">
              {ORG_BYLINE.bio}
            </p>
            <Link
              href="/contact"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-[#F26419] hover:text-orange-800"
            >
              Talk to us <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
