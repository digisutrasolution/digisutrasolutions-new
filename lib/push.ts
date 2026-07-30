import webpush from "web-push";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/site";

/**
 * Web Push (desktop/browser notifications). VAPID keys come from the env:
 *   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (a mailto: or URL).
 * With no keys set nothing sends — the in-app bell and emails still work, so
 * push is purely additive and the site never breaks for a missing key.
 */

const PUBLIC = process.env.VAPID_PUBLIC_KEY ?? "";
const PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
const SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:info@digisutrasolutions.com";

let ready = false;
if (PUBLIC && PRIVATE) {
  try {
    webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE);
    ready = true;
  } catch (err) {
    console.error("web-push VAPID setup failed:", err);
  }
}

export function pushConfigured(): boolean {
  return ready;
}

export function vapidPublicKey(): string {
  return PUBLIC;
}

export type PushPayload = {
  title: string;
  body?: string;
  /** Path (e.g. /admin/leads) opened when the notification is clicked. */
  link?: string;
  tag?: string;
};

/** Best-effort push to every subscription owned by the given users. Expired
    endpoints (404/410) are pruned. Never throws into the caller. */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload,
): Promise<void> {
  if (!ready) return;
  const ids = [...new Set(userIds)].filter(Boolean);
  if (ids.length === 0) return;

  const subs = await db.pushSubscription
    .findMany({ where: { userId: { in: ids } } })
    .catch(() => []);
  if (subs.length === 0) return;

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body ?? "",
    url: `${SITE_URL}${payload.link ?? "/admin"}`,
    icon: `${SITE_URL}/logo.png`,
    tag: payload.tag,
  });

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          await db.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        } else {
          console.error("push send failed:", code ?? err);
        }
      }
    }),
  );
}
