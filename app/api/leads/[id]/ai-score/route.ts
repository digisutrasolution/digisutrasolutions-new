import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { canSeeAllLeads } from "@/lib/auth/rbac";
import { logLeadActivity } from "@/lib/crm-server";
import { isConfigured, scoreLeadAI } from "@/lib/ai";
import { sourceLabel } from "@/lib/crm";

type Params = { params: Promise<{ id: string }> };

/** Advisory AI conversion score for a lead. Requires the AI + leads
    permissions; returns 503 cleanly when no ANTHROPIC_API_KEY is set. */
export async function POST(_req: Request, { params }: Params) {
  const { user, error } = await requirePermission("leads.manage");
  if (error) return error;
  if (!user.permissions.includes("ai.use")) {
    return NextResponse.json({ ok: false, error: "You don't have permission to use AI." }, { status: 403 });
  }
  if (!(await isConfigured())) {
    return NextResponse.json({ ok: false, error: "AI is not configured." }, { status: 503 });
  }

  const { id } = await params;
  const lead = await db.lead.findFirst({ where: { id, deletedAt: null } });
  if (!lead || (!canSeeAllLeads(user) && lead.assignedToId !== user.id)) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  const context = [
    `Name: ${lead.name}`,
    lead.company ? `Company: ${lead.company}` : "",
    lead.industry ? `Industry: ${lead.industry}` : "",
    `Source: ${sourceLabel(lead.source)}`,
    lead.services.length ? `Services wanted: ${lead.services.join(", ")}` : "",
    lead.budget ? `Budget: ${lead.budget}` : "",
    lead.expectedRevenue ? `Expected revenue: ₹${lead.expectedRevenue.toLocaleString("en-IN")}` : "",
    lead.timeline ? `Timeline: ${lead.timeline}` : "",
    [lead.city, lead.state, lead.country].filter(Boolean).length
      ? `Location: ${[lead.city, lead.state, lead.country].filter(Boolean).join(", ")}`
      : "",
    lead.website ? `Website: ${lead.website}` : "",
    lead.message ? `Message: ${lead.message}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const { score, reason } = await scoreLeadAI(context);
    void logLeadActivity({
      leadId: id,
      userId: user.id,
      userName: user.name,
      type: "ai-score",
      message: `AI conversion score: ${score}/100 — ${reason}`,
    });
    return NextResponse.json({ ok: true, score, reason });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI scoring failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
