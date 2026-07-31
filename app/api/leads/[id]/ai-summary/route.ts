import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { canSeeAllLeads } from "@/lib/auth/rbac";
import { aiLeadBrief, isConfigured } from "@/lib/ai";
import { sourceLabel, statusLabel } from "@/lib/crm";

type Params = { params: Promise<{ id: string }> };

/** AI brief for a lead: a short summary + the best next action. Runs through
    the provider fallback chain; 503s cleanly when no provider is configured. */
export async function POST(_req: Request, { params }: Params) {
  const { user, error } = await requirePermission("leads.manage");
  if (error) return error;
  if (!user.permissions.includes("ai.use")) {
    return NextResponse.json({ ok: false, error: "You don't have permission to use AI." }, { status: 403 });
  }
  if (!isConfigured()) {
    return NextResponse.json({ ok: false, error: "AI is not configured." }, { status: 503 });
  }

  const { id } = await params;
  const lead = await db.lead.findFirst({
    where: { id, deletedAt: null },
    include: { activities: { orderBy: { createdAt: "desc" }, take: 15 } },
  });
  if (!lead || (!canSeeAllLeads(user) && lead.assignedToId !== user.id)) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  const context = [
    `Name: ${lead.name}`,
    lead.company ? `Company: ${lead.company}` : "",
    lead.industry ? `Industry: ${lead.industry}` : "",
    `Source: ${sourceLabel(lead.source)}`,
    `Status: ${statusLabel(lead.status)} · Priority: ${lead.priority}${lead.score != null ? ` · Score: ${lead.score}/100` : ""}`,
    lead.services.length ? `Services wanted: ${lead.services.join(", ")}` : "",
    lead.budget ? `Budget: ${lead.budget}` : "",
    lead.expectedRevenue ? `Expected revenue: ₹${lead.expectedRevenue.toLocaleString("en-IN")}` : "",
    lead.timeline ? `Timeline: ${lead.timeline}` : "",
    [lead.city, lead.state, lead.country].filter(Boolean).length ? `Location: ${[lead.city, lead.state, lead.country].filter(Boolean).join(", ")}` : "",
    lead.message ? `Message: ${lead.message}` : "",
    lead.notes ? `Internal notes: ${lead.notes}` : "",
    lead.activities.length ? `Recent activity:\n${lead.activities.map((a) => `- ${a.message}`).join("\n")}` : "No activity logged yet.",
  ].filter(Boolean).join("\n");

  try {
    const brief = await aiLeadBrief(context);
    return NextResponse.json({ ok: true, ...brief });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
