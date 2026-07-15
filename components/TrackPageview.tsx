"use client";

import { withBase } from "@/lib/base-path";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Cookie-less first-party page-view beacon for the public site. */
export default function TrackPageview() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const payload = JSON.stringify({
      path: pathname,
      referrer: document.referrer || undefined,
    });
    // sendBeacon survives navigation; fetch keepalive is the fallback.
    if (!navigator.sendBeacon?.(withBase("/api/track"), new Blob([payload], { type: "application/json" }))) {
      void fetch(withBase("/api/track"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }, [pathname]);

  return null;
}
