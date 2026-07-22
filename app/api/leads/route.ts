import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { notifyRoles } from "@/lib/notify";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { DEPARTMENT_KEYS, departmentEmail } from "@/lib/contact-channels";

const LeadSchema = z.object({
  name: z.string().trim().min(2).max(90),
  whatsapp: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9\s-]{7,17}$/, "Enter a valid WhatsApp number."),
  email: z.string().trim().email().max(200).optional().or(z.literal("").transform(() => undefined)),
  website: z.string().trim().max(300).optional().or(z.literal("").transform(() => undefined)),
  company: z.string().trim().max(120).optional(),
  department: z.enum(DEPARTMENT_KEYS).optional(),
  services: z.array(z.string().trim().max(80)).max(10).optional(),
  budget: z.string().trim().max(60).optional(),
  timeline: z.string().trim().max(60).optional(),
  heardFrom: z.string().trim().max(80).optional(),
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

  /* Spam signals are recorded, not obeyed.
     Both heuristics have real false positives: a password manager can fill
     a hidden honeypot, and a visitor whose draft was restored from
     localStorage can submit within three seconds of the page loading.
     Discarding those silently loses genuine enquiries while still showing
     the sender a success screen, so the lead is stored with a note and
     the admin decides. The response is identical either way, so a real
     bot still learns nothing. */
  const elapsed = d.startedAt ? Date.now() - d.startedAt : null;
  const flags: string[] = [];
  if (d.hp) flags.push("honeypot field was filled");
  if (elapsed !== null && elapsed < 3000) {
    flags.push(`submitted ${(elapsed / 1000).toFixed(1)}s after the page loaded`);
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
      message: [d.company ? `Company: ${d.company}` : "", d.message ?? ""]
        .filter(Boolean)
        .join("\n\n") || null,
      department: d.department ?? null,
      heardFrom: d.heardFrom ?? null,
      source: d.source ?? "CONTACT",
      notes:
        [
          duplicate ? "Possible duplicate: same WhatsApp within 24h." : null,
          flags.length ? `Possible spam: ${flags.join("; ")}.` : null,
        ]
          .filter(Boolean)
          .join(" ") || null,
      ipHash: createHash("sha256").update(ip).digest("hex").slice(0, 24),
    },
  });

  // Route the enquiry to the desk the visitor picked. Best-effort: the lead
  // is already stored, so a mail failure never loses it.
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const to = process.env.CONTACT_TO_EMAIL ?? departmentEmail(d.department);
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:
          process.env.CONTACT_FROM_EMAIL ??
          "DigiSutra <onboarding@resend.dev>",
        to: [to],
        ...(d.email ? { reply_to: d.email } : {}),
        subject: `${d.department ?? "CONTACT"} enquiry: ${lead.name}`,
        text: [
          `Desk: ${d.department ?? "—"}`,
          `Name: ${lead.name}`,
          `Company: ${d.company || "—"}`,
          `WhatsApp: ${lead.whatsapp}`,
          `Email: ${lead.email || "—"}`,
          `Website: ${lead.website || "—"}`,
          `Services: ${lead.services.join(", ") || "—"}`,
          `Budget: ${lead.budget || "—"}`,
          `Timeline: ${lead.timeline || "—"}`,
          `Found us via: ${lead.heardFrom || "—"}`,
          "",
          lead.message || "(no message)",
        ].join("\n"),
      }),
    }).catch(() => {});
  }

  // Suspected spam lands in the list but does not ping anyone.
  if (flags.length === 0) {
    notifyRoles(["SUPER_ADMIN", "SEO_MANAGER"], {
    type: "LEAD_NEW",
    title: `New lead: ${lead.name}`,
    body: `${lead.services.join(", ") || "No service selected"}${lead.budget ? ` · ${lead.budget}` : ""}`,
      link: "/admin/leads",
    }).catch(() => {});
  }

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
      ["Created", "Name", "WhatsApp", "Email", "Website", "Department", "Services", "Budget", "Timeline", "Found us via", "Source", "Status", "Verified", "Message", "Notes"].join(","),
      ...leads.map((l) =>
        [
          l.createdAt.toISOString(),
          l.name, l.whatsapp, l.email, l.website, l.department,
          l.services.join("; "), l.budget, l.timeline, l.heardFrom,
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
