import type { MetadataRoute } from "next";
import { NOINDEX, SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Staging (SITE_NOINDEX=1) blocks everything so dev URLs never get indexed.
  if (NOINDEX) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
