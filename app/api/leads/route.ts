import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { notifyRoles } from "@/lib/notify";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const LeadSchema = z.object({
  name: z.string().trim().min(2).max(90),
  whatsapp: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9\s-]{7,17}$/, "Enter a valid WhatsApp number."),
  email: z.string().trim().email().max(200).optional().or(z.literal("").transform(() => undefined)),
  website: z.string().trim().max(300).optional().or(z.literal("").transform(() => undefined)),
  services: z.array(z.string().trim().max(80)).max(10).optional(),
  budget: z.string().trim().max(60).optional(),
  timeline: z.string().trim().max(60).optional(),
  message: z.string().trim().max(2000).optional(),
  source: z.enum(["CONTACT", "AUDIT", "ESTIMATOR", "SUTRABOT"]).optional(),
  hp: z.string().optional(),          // honeypot — must stay empty
  startedAt: z.number().optional(),   // time-trap — form render timestamp
});

/** Public: create a lead (contact page, audit band, estimator). */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const { allowed, retryAfterSec } = rateLimit(`leads:${ip}`, 5, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: `Too many requests. Try again in ${retryAfterSec}s.` },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = LeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const d = parsed.data;

  // Bots: honeypot filled or form submitted <3s after render. Pretend success.
  if (d.hp || (d.startedAt && Date.now() - d.startedAt < 3000)) {
    return NextResponse.json({ ok: true, id: "ok" });
  }

  const whatsapp = d.whatsapp.replace(/[\s-]/g, "");
  const duplicate = await db.lead.findFirst({
    where: { whatsapp, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    select: { id: true },
  });

  const lead = await db.lead.create({
    data: {
      name: d.name,
      whatsapp,
      email: d.email ?? null,
      website: d.website ?? null,
      services: d.services ?? [],
      budget: d.budget ?? null,
      timeline: d.timeline ?? null,
      message: d.message ?? null,
      source: d.source ?? "CONTACT",
      notes: duplicate ? "Possible duplicate: same WhatsApp within 24h." : null,
      ipHash: createHash("sha256").update(ip).digest("hex").slice(0, 24),
    },
  });

  notifyRoles(["SUPER_ADMIN", "SEO_MANAGER"], {
    type: "LEAD_NEW",
    title: `New lead: ${lead.name}`,
    body: `${lead.services.join(", ") || "No service selected"}${lead.budget ? ` · ${lead.budget}` : ""}`,
    link: "/admin/leads",
  }).catch(() => {});

  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
}

/** Admin: list/filter leads; ?format=csv exports. */
export async function GET(req: Request) {
  const { error } = await requirePermission("leads.manage");
  if (error) return error;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const where = status && status !== "ALL" ? { status: status as never } : {};
  const leads = await db.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  if (url.searchParams.get("format") === "csv") {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [
      ["Created", "Name", "WhatsApp", "Email", "Website", "Services", "Budget", "Timeline", "Source", "Status", "Verified", "Message", "Notes"].join(","),
      ...leads.map((l) =>
        [
          l.createdAt.toISOString(),
          l.name, l.whatsapp, l.email, l.website,
          l.services.join("; "), l.budget, l.timeline,
          l.source, l.status, l.verified ? "yes" : "no", l.message, l.notes,
        ].map(esc).join(","),
      ),
    ].join("\n");
    return new Response(rows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }
  return NextResponse.json({ ok: true, leads });
}
