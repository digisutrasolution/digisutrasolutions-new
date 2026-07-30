"use client";

import { useEffect, useRef } from "react";
import { withBase } from "@/lib/base-path";

/** Beacons an on-site search term once per query so the admin can see what
    visitors look for. Client-side (not the server render) so RSC prefetches
    don't inflate the count. */
export default function TrackSearch({ query, results }: { query: string; results: number }) {
  const sent = useRef("");

  useEffect(() => {
    if (!query || query.length < 2 || sent.current === query) return;
    sent.current = query;
    const payload = JSON.stringify({ q: query, results });
    if (
      !navigator.sendBeacon?.(
        withBase("/api/search-track"),
        new Blob([payload], { type: "application/json" }),
      )
    ) {
      void fetch(withBase("/api/search-track"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }, [query, results]);

  return null;
}
