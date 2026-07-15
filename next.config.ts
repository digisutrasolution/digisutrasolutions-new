import type { NextConfig } from "next";

/**
 * Security headers per the platform brief. A strict CSP is deferred:
 * Next.js inline runtime scripts and the JSON-LD blocks would need a
 * nonce pipeline — tracked as a post-launch hardening item.
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
      {
        source: "/uploads/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
