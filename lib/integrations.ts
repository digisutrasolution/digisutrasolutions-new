/* Integrations — client-safe catalog for the REST API + webhooks. No server
   imports so the admin UI and the server handlers share one source of truth. */

export const API_SCOPES = ["leads:read", "leads:write"] as const;
export type ApiScope = (typeof API_SCOPES)[number];
export const SCOPE_LABEL: Record<ApiScope, string> = {
  "leads:read": "Read leads",
  "leads:write": "Create / update leads",
};

export const WEBHOOK_EVENTS = [
  "lead.created",
  "lead.status_changed",
  "lead.won",
  "lead.assigned",
] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];
export const EVENT_LABEL: Record<WebhookEvent, string> = {
  "lead.created": "Lead created",
  "lead.status_changed": "Lead status changed",
  "lead.won": "Lead won",
  "lead.assigned": "Lead assigned",
};

export const API_KEY_PREFIX = "dsk_";
