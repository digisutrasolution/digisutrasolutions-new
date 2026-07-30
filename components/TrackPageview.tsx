"use client";

import { withBase } from "@/lib/base-path";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Cookie-less first-party page-view beacon for the public site. */
export default function TrackPageview() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    // Ephemeral per-tab id: lives in sessionStorage, gone when the tab closes.
    // Groups this visit's pages together without any cookie or lasting id.
    let sid: string | undefined;
    try {
      sid = sessionStorage.getItem("ds_sid") ?? undefined;
      if (!sid) {
        sid =
          crypto.randomUUID?.() ??
          `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
        sessionStorage.setItem("ds_sid", sid);
      }
    } catch {
      sid = undefined;
    }
    const payload = JSON.stringify({
      path: pathname,
      referrer: document.referrer || undefined,
      sid,
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
