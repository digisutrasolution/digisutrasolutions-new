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

export type PushResult = {
  /** Subscriptions the push service accepted. */
  sent: number;
  /** Dead endpoints (404/410) deleted during this send. */
  pruned: number;
  /** Human-readable reasons for the sends that failed for any other cause. */
  errors: string[];
};

/** Push to every subscription owned by the given users and report what
    happened. Expired endpoints (404/410) are pruned. Never throws. */
export async function sendPushToUsersDetailed(
  userIds: string[],
  payload: PushPayload,
): Promise<PushResult> {
  const result: PushResult = { sent: 0, pruned: 0, errors: [] };
  if (!ready) {
    result.errors.push("Push is not configured on the server (no VAPID keys).");
    return result;
  }
  const ids = [...new Set(userIds)].filter(Boolean);
  if (ids.length === 0) return result;

  const subs = await db.pushSubscription
    .findMany({ where: { userId: { in: ids } } })
    .catch(() => []);
  if (subs.length === 0) return result;

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
        result.sent += 1;
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          await db.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
          result.pruned += 1;
        } else {
          const detail = (err as { body?: string; message?: string }).body
            ?? (err as { message?: string }).message
            ?? String(err);
          result.errors.push(`${code ?? "?"}: ${detail}`.slice(0, 300));
          console.error("push send failed:", code ?? err);
        }
      }
    }),
  );
  return result;
}

/** Best-effort push — fire and forget. Callers on the request path use this. */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload,
): Promise<void> {
  await sendPushToUsersDetailed(userIds, payload);
}
