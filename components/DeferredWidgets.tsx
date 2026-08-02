"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { BotNudge } from "@/lib/bot-nudge";

/* The floating widgets (chat bot, back-to-top, call button) are interactive-
   only — no content, no SEO value — so they don't belong in the initial bundle
   competing with first paint. Each is code-split (ssr:false, allowed here
   because this wrapper is itself a client component) and only mounted once the
   browser goes idle or the visitor first interacts. That keeps their JS off the
   critical path without changing behaviour. */
const SutraBot = dynamic(() => import("@/components/SutraBot"), { ssr: false });
const BackToTop = dynamic(() => import("@/components/BackToTop"), { ssr: false });
const FloatingCall = dynamic(() => import("@/components/FloatingCall"), {
  ssr: false,
});

export default function DeferredWidgets({ nudge }: { nudge: BotNudge }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      setReady(true);
    };

    // Whichever comes first: the browser goes idle, or the visitor interacts.
    const events: (keyof WindowEventMap)[] = [
      "scroll",
      "pointerdown",
      "keydown",
      "touchstart",
    ];
    events.forEach((e) => window.addEventListener(e, go, { once: true, passive: true }));

    const ric = (
      window as unknown as {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      }
    ).requestIdleCallback;
    const idle = ric ? ric(go, { timeout: 2500 }) : window.setTimeout(go, 1500);

    return () => {
      events.forEach((e) => window.removeEventListener(e, go));
      const cic = (window as unknown as { cancelIdleCallback?: (id: number) => void })
        .cancelIdleCallback;
      if (ric && cic) cic(idle as number);
      else clearTimeout(idle as number);
    };
  }, []);

  if (!ready) return null;

  return (
    <>
      <SutraBot nudge={nudge} />
      <BackToTop />
      <FloatingCall />
    </>
  );
}
