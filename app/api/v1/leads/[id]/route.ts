import { db } from "@/lib/db";
import { apiError, authenticateApiKey } from "@/lib/api-auth";
import { leadPayload } from "@/lib/webhooks";

type Params = { params: Promise<{ id: string }> };

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

/** GET /api/v1/leads/:id — fetch one lead (scope leads:read). */
export async function GET(req: Request, { params }: Params) {
  const key = await authenticateApiKey(req);
  if (!key) return apiError("Invalid or missing API key.", 401);
  if (!key.scopes.includes("leads:read")) return apiError("This key lacks the leads:read scope.", 403);

  const { id } = await params;
  const lead = await db.lead.findFirst({ where: { id, deletedAt: null } });
  if (!lead) return apiError("Lead not found.", 404);
  return json({ lead: leadPayload(lead) });
}
