import "server-only";
import type { Lead } from "@prisma/client";
import { autoAssignLead } from "@/lib/assignment";
import { scoreAndSave } from "@/lib/scoring-server";

/** Post-capture side effects for a newly created lead: route it to an owner by
    the assignment rules, and compute its score. Both are best-effort and never
    block intake (auto-assign no-ops if the lead is already assigned). */
export function onLeadCreated(lead: Lead): void {
  void autoAssignLead(lead);
  void scoreAndSave(lead.id);
}
