import "server-only";
import type { Lead } from "@prisma/client";
import { autoAssignLead } from "@/lib/assignment";
import { scoreAndSave } from "@/lib/scoring-server";
import { dispatchWebhook, leadPayload } from "@/lib/webhooks";

/** Post-capture side effects for a newly created lead: route it to an owner by
    the assignment rules, compute its score, and fire the lead.created webhook.
    All best-effort and never block intake (auto-assign no-ops if already
    assigned). */
export function onLeadCreated(lead: Lead): void {
  void autoAssignLead(lead);
  void scoreAndSave(lead.id);
  dispatchWebhook("lead.created", leadPayload(lead));
}
