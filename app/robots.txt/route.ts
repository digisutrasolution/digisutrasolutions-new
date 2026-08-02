import { NOINDEX, SITE_URL } from "@/lib/site";

/* Served as a route handler (not the metadata convention) so we can emit a
   Content-Signal line — Next's MetadataRoute.Robots can't. */
export function GET() {
  if (NOINDEX) {
    // Staging (SITE_NOINDEX=1): keep dev URLs out of every index.
    return text("User-agent: *\nDisallow: /\n");
  }
  const body = [
    "User-agent: *",
    // Content Signals (contentsignals.org / draft-romm-aipref-contentsignals):
    // we WANT to be found and cited by AI answer engines, so all uses are allowed.
    "Content-Signal: search=yes, ai-input=yes, ai-train=yes",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /admin/",
    "Disallow: /api/",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n");
  return text(body);
}

function text(body: string): Response {
  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
