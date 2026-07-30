"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { withBase } from "@/lib/base-path";

/* Enable/disable browser push (desktop notifications) for the signed-in admin.
   Registers the tiny push-sw.js service worker, subscribes with the server's
   VAPID public key, and stores the subscription. Renders nothing when the
   browser can't do push or the server has no VAPID keys configured. */

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

type State = "loading" | "unsupported" | "unconfigured" | "off" | "on" | "denied";

export default function PushToggle() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState("");

  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supported) {
        if (!cancelled) setState("unsupported");
        return;
      }
      try {
        const res = await fetch(withBase("/api/push/public-key"));
        const json = await res.json();
        if (cancelled) return;
        if (!json.configured) {
          setState("unconfigured");
          return;
        }
        setKey(json.key);
        if (Notification.permission === "denied") {
          setState("denied");
          return;
        }
        const reg = await navigator.serviceWorker.getRegistration(withBase("/push-sw.js"));
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        if (!cancelled) setState(sub ? "on" : "off");
      } catch {
        if (!cancelled) setState("off");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supported]);

  const enable = useCallback(async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.register(withBase("/push-sw.js"));
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      });
      const json = sub.toJSON();
      const res = await fetch(withBase("/api/push/subscribe"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      setState(res.ok ? "on" : "off");
    } catch {
      setState("off");
    } finally {
      setBusy(false);
    }
  }, [key]);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration(withBase("/push-sw.js"));
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await fetch(withBase("/api/push/unsubscribe"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("off");
    } catch {
      setState("off");
    } finally {
      setBusy(false);
    }
  }, []);

  if (state === "loading" || state === "unsupported" || state === "unconfigured") {
    return null;
  }

  if (state === "denied") {
    return (
      <p className="flex items-center gap-2 border-t border-stone-100 px-4 py-2.5 text-[11px] text-stone-400 dark:border-stone-800">
        <BellOff size={13} aria-hidden />
        Desktop alerts blocked in your browser settings.
      </p>
    );
  }

  const on = state === "on";
  return (
    <button
      onClick={() => void (on ? disable() : enable())}
      disabled={busy}
      className="flex w-full items-center gap-2 border-t border-stone-100 px-4 py-2.5 text-left text-[11px] font-medium text-stone-600 transition-colors hover:bg-stone-50 disabled:opacity-60 dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-800"
    >
      {busy ? (
        <Loader2 size={13} className="animate-spin" aria-hidden />
      ) : on ? (
        <Bell size={13} className="text-orange-600" aria-hidden />
      ) : (
        <BellOff size={13} aria-hidden />
      )}
      {on ? "Desktop alerts on — click to turn off" : "Enable desktop alerts"}
    </button>
  );
}
