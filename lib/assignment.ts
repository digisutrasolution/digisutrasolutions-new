import { db } from "@/lib/db";
import { logLeadActivity } from "@/lib/crm-server";
import { notifyUsers } from "@/lib/notify";

/* Auto-assignment engine (CRM Phase 2 tail).

   A freshly-captured lead is routed to an owner by the first enabled rule
   whose conditions all match. Each rule owns a target pool worked round-robin.
   Everything here is best-effort: a routing failure must never break lead
   intake, so the caller fires it and ignores errors. */

type LeadLike = {
  id: string;
  source: string;
  services: string[];
  country: string | null;
  state: string | null;
  city: string | null;
  priority: string;
  name: string;
  company: string | null;
  message: string | null;
  assignedToId: string | null;
};

type Rule = {
  id: string;
  name: string;
  sources: string[];
  services: string[];
  countries: string[];
  states: string[];
  cities: string[];
  priorities: string[];
  keyword: string | null;
  targetUserIds: string[];
  rrIndex: number;
};

const norm = (s: string) => s.trim().toLowerCase();

/** Empty rule list = wildcard. Otherwise match if any rule value and any lead
    value overlap (either contains the other), so "Delhi" matches "New Delhi". */
function listMatch(ruleList: string[], values: (string | null)[]): boolean {
  if (ruleList.length === 0) return true;
  const vals = values.filter((v): v is string => !!v).map(norm);
  if (vals.length === 0) return false;
  return ruleList.some((r) => {
    const rn = norm(r);
    return vals.some((v) => v === rn || v.includes(rn) || rn.includes(v));
  });
}

export function matchesRule(rule: Rule, lead: LeadLike): boolean {
  if (rule.sources.length && !rule.sources.includes(lead.source)) return false;
  if (!listMatch(rule.services, lead.services)) return false;
  if (!listMatch(rule.countries, [lead.country])) return false;
  if (!listMatch(rule.states, [lead.state])) return false;
  if (!listMatch(rule.cities, [lead.city])) return false;
  if (rule.priorities.length && !rule.priorities.includes(lead.priority)) return false;
  if (rule.keyword && rule.keyword.trim()) {
    const hay = [lead.name, lead.company, lead.message, ...lead.services]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!hay.includes(norm(rule.keyword))) return false;
  }
  return true;
}

/** Dry-run: which enabled rule would claim this lead, and who is next in its
    pool — without advancing any cursor. Powers the rule tester. */
export async function previewAssignment(lead: LeadLike): Promise<{
  ruleId: string;
  ruleName: string;
  userId: string | null;
} | null> {
  const rules = await db.assignmentRule.findMany({
    where: { enabled: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  for (const rule of rules) {
    if (!matchesRule(rule as Rule, lead)) continue;
    const pool = await activePool(rule.targetUserIds);
    if (!pool.length) continue;
    const userId = pool[rule.rrIndex % pool.length];
    return { ruleId: rule.id, ruleName: rule.name, userId };
  }
  return null;
}

/** Keep only users that still exist and are active, preserving pool order. */
async function activePool(ids: string[]): Promise<string[]> {
  if (!ids.length) return [];
  const users = await db.user.findMany({
    where: { id: { in: ids }, isActive: true },
    select: { id: true },
  });
  const live = new Set(users.map((u) => u.id));
  return ids.filter((id) => live.has(id));
}

/** Route a just-created lead. Returns the assigned userId, or null if it was
    already assigned or no rule matched. Advances the winning rule's cursor
    atomically and records the assignment on the timeline + notifies the owner. */
export async function autoAssignLead(lead: LeadLike): Promise<string | null> {
  try {
    if (lead.assignedToId) return null;

    const rules = await db.assignmentRule.findMany({
      where: { enabled: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    for (const rule of rules) {
      if (!matchesRule(rule as Rule, lead)) continue;
      const pool = await activePool(rule.targetUserIds);
      if (!pool.length) continue;

      // Atomic cursor bump so concurrent leads don't collide on the same slot.
      const bumped = await db.assignmentRule.update({
        where: { id: rule.id },
        data: { rrIndex: { increment: 1 }, matchCount: { increment: 1 } },
        select: { rrIndex: true },
      });
      const userId = pool[(bumped.rrIndex - 1) % pool.length];

      await db.lead.update({ where: { id: lead.id }, data: { assignedToId: userId } });

      const owner = await db.user.findUnique({ where: { id: userId }, select: { name: true } });
      void logLeadActivity({
        leadId: lead.id,
        type: "assigned",
        message: `Auto-assigned to ${owner?.name ?? "a teammate"} · rule "${rule.name}"`,
      });
      void notifyUsers([userId], {
        type: "lead-assigned",
        title: `Lead assigned to you: ${lead.name}`,
        body: `Routed by "${rule.name}"`,
        link: `/admin/leads/${lead.id}`,
      });
      return userId;
    }
    return null;
  } catch (err) {
    console.error("autoAssignLead failed:", err);
    return null;
  }
}
