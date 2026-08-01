import type { MetadataRoute } from "next";
import { withBase } from "@/lib/base-path";

/* PWA manifest — makes the site installable and gives Android/Chrome the
   high-res icons. Paths go through withBase() so they resolve on subpath
   deployments too. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DigiSutra Solutions",
    short_name: "DigiSutra",
    description: "Growth marketing, SEO and web development — your growth, our sutra.",
    start_url: withBase("/"),
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#F26419",
    icons: [
      { src: withBase("/web-app-manifest-192x192.png"), sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: withBase("/web-app-manifest-512x512.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
