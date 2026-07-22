import type { NextConfig } from "next";

/**
 * Security headers per the platform brief.
 *
 * A site-wide enforcing CSP still needs a nonce pipeline for Next's inline
 * runtime scripts, so it ships Report-Only for now (violations POST to
 * /api/csp-report). /uploads is the exception: nothing there should ever
 * execute, so it gets a strict enforcing policy — that is what stops an
 * uploaded SVG running script on our origin.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  {
    key: "Content-Security-Policy-Report-Only",
    value: [
      "default-src 'self'",
      // unsafe-inline/eval are what the nonce pipeline will remove; they
      // are listed so the report shows real gaps, not framework noise.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://flagcdn.com https://images.unsplash.com",
      "font-src 'self' data:",
      "connect-src 'self' https://api.resend.com https://generativelanguage.googleapis.com https://api.anthropic.com",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "report-uri /api/csp-report",
    ].join("; "),
  },
];

/* Uploaded files are user-supplied bytes served from our own origin. An
   SVG can carry script, so the response denies every capability it could
   use — this holds even if the sanitiser in lib/storage.ts misses a
   vector. */
const uploadHeaders = [
  { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
];

/* Subpath deploys: SITE_URL like https://host/inhouse/site sets basePath
   automatically; a root-domain SITE_URL leaves it unset. */
let basePath: string | undefined;
try {
  const p = new URL(process.env.SITE_URL ?? "").pathname.replace(/\/+$/, "");
  basePath = p && p !== "/" ? p : undefined;
} catch {
  basePath = undefined;
}

const nextConfig: NextConfig = {
  ...(basePath ? { basePath } : {}),
  env: { NEXT_PUBLIC_BASE_PATH: basePath ?? "" },
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        source: "/admin/:path*",
        headers: [
          ...securityHeaders.filter((h) => h.key !== "X-Frame-Options"),
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      { source: "/uploads/:path*", headers: uploadHeaders },
    ];
  },
};

export default nextConfig;
