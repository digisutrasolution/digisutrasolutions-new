"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { withBase } from "@/lib/base-path";

/* Enable/disable browser push (desktop notifications) for the signed-in admin.
   Registers the tiny push-sw.js service worker, subscribes with the server's
   VAPID public key, and stores the subscription. Renders nothing when the
   browser can't do push or the server has no VAPID keys configured.

   Granting the browser's own Notifications permission is NOT enough — a push
   subscription only exists once this button creates one, which is why the row
   keeps offering "Enable desktop alerts" after someone flips the permission in
   Chrome's site settings. Failures are surfaced verbatim rather than swallowed:
   subscribe() rejects for reasons no one can guess from a crossed-out bell
   (blocked push service, stale service worker, revoked permission). */

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

/** Turn a thrown value into something an admin can act on. The browser's own
    message is kept — it is the only clue about which step failed. */
function explain(err: unknown): string {
  const e = err as { name?: string; message?: string };
  const detail = e?.message || String(err);
  if (e?.name === "NotAllowedError") {
    return `Permission refused by the browser. ${detail}`;
  }
  if (e?.name === "AbortError") {
    // Chrome funnels every subscription through its own push service; a
    // network that blocks it fails here and nowhere else.
    return `The browser could not reach its push service — usually a network or firewall block. ${detail}`;
  }
  if (e?.name === "InvalidStateError") {
    return `A previous service worker is still active. Fully close every tab of this site, reopen, and try again. ${detail}`;
  }
  return detail;
}

type State = "loading" | "unsupported" | "unconfigured" | "off" | "on" | "denied";

export default function PushToggle() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState("");
  const [note, setNote] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

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
      } catch (err) {
        if (!cancelled) {
          setState("off");
          setNote({ kind: "error", text: explain(err) });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supported]);

  const enable = useCallback(async () => {
    setBusy(true);
    setNote(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        setNote({
          kind: "error",
          text:
            permission === "default"
              ? "You closed the browser prompt without choosing. Click again and pick Allow."
              : "The browser blocked notifications for this site.",
        });
        return;
      }
      const reg = await navigator.serviceWorker.register(withBase("/push-sw.js"));
      // Not serviceWorker.ready — that waits on the worker controlling THIS
      // page, which never happens while an older worker sits in `waiting`.
      await navigator.serviceWorker.ready.catch(() => {});
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
        }));
      const json = sub.toJSON();
      const res = await fetch(withBase("/api/push/subscribe"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setState("off");
        setNote({
          kind: "error",
          text: `The server rejected the subscription (${res.status}). ${body.error ?? ""}`.trim(),
        });
        return;
      }
      setState("on");
      setNote({ kind: "ok", text: "Subscribed. Send a test to confirm it reaches your desktop." });
    } catch (err) {
      setState("off");
      setNote({ kind: "error", text: explain(err) });
    } finally {
      setBusy(false);
    }
  }, [key]);

  const disable = useCallback(async () => {
    setBusy(true);
    setNote(null);
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
    } catch (err) {
      setState("off");
      setNote({ kind: "error", text: explain(err) });
    } finally {
      setBusy(false);
    }
  }, []);

  /* Round-trips a real push through the same path a new lead takes, so a
     silent failure downstream of the subscription shows up here too. */
  const test = useCallback(async () => {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch(withBase("/api/push/test"), { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.sent > 0) {
        setNote({
          kind: "ok",
          text: "Sent. Nothing on screen? Check Windows Settings → Notifications → Google Chrome.",
        });
      } else {
        setNote({
          kind: "error",
          text: body.error ?? "The server accepted the request but delivered to 0 devices.",
        });
        if (body.pruned) setState("off");
      }
    } catch (err) {
      setNote({ kind: "error", text: explain(err) });
    } finally {
      setBusy(false);
    }
  }, []);

  if (state === "loading" || state === "unsupported" || state === "unconfigured") {
    return null;
  }

  if (state === "denied") {
    return (
      <p className="flex items-start gap-2 border-t border-stone-100 px-4 py-2.5 text-[11px] text-stone-400 dark:border-stone-800">
        <BellOff size={13} className="mt-px shrink-0" aria-hidden />
        Desktop alerts are blocked for this site. Open the padlock in the address
        bar → Notifications → Allow, then reload.
      </p>
    );
  }

  const on = state === "on";
  return (
    <div className="border-t border-stone-100 dark:border-stone-800">
      <div className="flex items-center gap-2 px-4 py-2.5 text-[11px]">
        {busy ? (
          <Loader2 size={13} className="shrink-0 animate-spin text-stone-400" aria-hidden />
        ) : on ? (
          <Bell size={13} className="shrink-0 text-orange-600" aria-hidden />
        ) : (
          <BellOff size={13} className="shrink-0 text-stone-400" aria-hidden />
        )}
        <span className="font-medium text-stone-600 dark:text-stone-300">
          {on ? "Desktop alerts on" : "Desktop alerts off"}
        </span>
        <span className="ml-auto flex items-center gap-2">
          {on && (
            <button
              onClick={() => void test()}
              disabled={busy}
              className="cursor-pointer font-semibold text-orange-700 hover:underline disabled:opacity-60 dark:text-orange-400"
            >
              Send test
            </button>
          )}
          <button
            onClick={() => void (on ? disable() : enable())}
            disabled={busy}
            className="cursor-pointer font-semibold text-orange-700 hover:underline disabled:opacity-60 dark:text-orange-400"
          >
            {on ? "Turn off" : "Enable"}
          </button>
        </span>
      </div>
      {note && (
        <p
          className={`px-4 pb-2.5 text-[11px] leading-snug ${
            note.kind === "error"
              ? "text-red-600 dark:text-red-400"
              : "text-emerald-700 dark:text-emerald-400"
          }`}
        >
          {note.text}
        </p>
      )}
    </div>
  );
}
