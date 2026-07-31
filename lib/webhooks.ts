import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { db } from "@/lib/db";

export const newWebhookSecret = () => "whsec_" + randomBytes(24).toString("hex");

export function signPayload(secret: string, body: string): string {
  return "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
}

async function deliver(hook: { id: string; url: string; secret: string }, event: string, data: unknown): Promise<void> {
  const body = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(hook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "DigiSutra-Webhook/1",
        "X-DigiSutra-Event": event,
        "X-DigiSutra-Signature": signPayload(hook.secret, body),
      },
      body,
      signal: controller.signal,
    });
    await db.webhook.update({
      where: { id: hook.id },
      data: { lastStatus: res.status, lastError: res.ok ? null : `HTTP ${res.status}`, lastDeliveredAt: new Date() },
    }).catch(() => {});
  } catch (err) {
    const msg = err instanceof Error ? err.message : "delivery failed";
    await db.webhook.update({
      where: { id: hook.id },
      data: { lastStatus: null, lastError: msg.slice(0, 200), lastDeliveredAt: new Date() },
    }).catch(() => {});
  } finally {
    clearTimeout(timer);
  }
}

/** Fire an event to every active webhook subscribed to it. Best-effort and
    fully detached — never blocks or breaks the action that triggered it. */
export function dispatchWebhook(event: string, data: unknown): void {
  void (async () => {
    try {
      const hooks = await db.webhook.findMany({ where: { active: true, events: { has: event } } });
      await Promise.all(hooks.map((h) => deliver(h, event, data)));
    } catch (err) {
      console.error("dispatchWebhook failed:", err);
    }
  })();
}

/** Send a one-off test ping to a single webhook (the "Send test" button). */
export async function sendTestPing(id: string): Promise<{ ok: boolean; status: number | null; error: string | null }> {
  const hook = await db.webhook.findUnique({ where: { id } });
  if (!hook) return { ok: false, status: null, error: "Not found" };
  await deliver(hook, "ping", { message: "Test ping from DigiSutra." });
  const after = await db.webhook.findUnique({ where: { id }, select: { lastStatus: true, lastError: true } });
  return { ok: !!after && after.lastStatus != null && after.lastStatus < 400, status: after?.lastStatus ?? null, error: after?.lastError ?? null };
}

/** Compact JSON shape of a lead for webhook payloads / the public API. */
export function leadPayload(lead: {
  id: string; name: string; email: string | null; whatsapp: string; company: string | null;
  source: string; status: string; priority: string; score: number | null;
  assignedToId: string | null; createdAt: Date;
}) {
  return {
    id: lead.id, name: lead.name, email: lead.email, whatsapp: lead.whatsapp, company: lead.company,
    source: lead.source, status: lead.status, priority: lead.priority, score: lead.score,
    assignedToId: lead.assignedToId, createdAt: lead.createdAt.toISOString(),
  };
}
