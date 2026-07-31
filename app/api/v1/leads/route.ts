import { z } from "zod";
import { db } from "@/lib/db";
import { apiError, authenticateApiKey } from "@/lib/api-auth";
import { onLeadCreated } from "@/lib/lead-intake";
import { leadPayload } from "@/lib/webhooks";
import { LEAD_PRIORITIES } from "@/lib/crm";

const CreateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  whatsapp: z.string().trim().max(40).optional(),
  email: z.string().trim().email().max(200).optional(),
  company: z.string().trim().max(160).optional(),
  website: z.string().trim().max(300).optional(),
  city: z.string().trim().max(80).optional(),
  country: z.string().trim().max(80).optional(),
  budget: z.string().trim().max(60).optional(),
  message: z.string().trim().max(4000).optional(),
  services: z.array(z.string().trim().max(80)).max(10).optional(),
  priority: z.enum(LEAD_PRIORITIES).optional(),
}).refine((v) => v.whatsapp || v.email, { message: "A whatsapp or email is required." });

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

/** POST /api/v1/leads — create a lead (scope leads:write). */
export async function POST(req: Request) {
  const key = await authenticateApiKey(req);
  if (!key) return apiError("Invalid or missing API key.", 401);
  if (!key.scopes.includes("leads:write")) return apiError("This key lacks the leads:write scope.", 403);

  const parsed = CreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Invalid input.", 400);
  const d = parsed.data;

  const lead = await db.lead.create({
    data: {
      name: d.name,
      whatsapp: (d.whatsapp ?? "").replace(/[\s-]/g, "") || "—",
      email: d.email ?? null,
      company: d.company ?? null,
      website: d.website ?? null,
      city: d.city ?? null,
      country: d.country ?? null,
      budget: d.budget ?? null,
      message: d.message ?? null,
      services: d.services ?? [],
      priority: d.priority ?? "MEDIUM",
      source: "API",
      notes: "Created via API",
    },
  });
  // Auto-assign, score, and fire the lead.created webhook.
  onLeadCreated(lead);

  return json({ lead: leadPayload(lead) }, 201);
}

/** GET /api/v1/leads — list leads (scope leads:read). ?limit=&cursor=&status= */
export async function GET(req: Request) {
  const key = await authenticateApiKey(req);
  if (!key) return apiError("Invalid or missing API key.", 401);
  if (!key.scopes.includes("leads:read")) return apiError("This key lacks the leads:read scope.", 403);

  const p = new URL(req.url).searchParams;
  const limit = Math.min(100, Math.max(1, parseInt(p.get("limit") ?? "50", 10) || 50));
  const status = p.get("status");
  const cursor = p.get("cursor");

  const leads = await db.lead.findMany({
    where: { deletedAt: null, ...(status ? { status: status as never } : {}) },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = leads.length > limit;
  const page = hasMore ? leads.slice(0, limit) : leads;
  return json({ leads: page.map(leadPayload), nextCursor: hasMore ? page[page.length - 1].id : null });
}
