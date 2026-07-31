import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { alertEmail, emailUrl, thankYouEmail } from "@/lib/email-templates";
import { notifyRoles } from "@/lib/notify";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getContactConfig } from "@/lib/contact-config-server";
import { deskEmail } from "@/lib/contact-config";
import { logLeadActivity } from "@/lib/crm-server";
import { onLeadCreated } from "@/lib/lead-intake";
import { getScoringConfig } from "@/lib/scoring-server";
import { leadScopeWhere } from "@/lib/auth/rbac";
import { sourceLabel } from "@/lib/crm";

const LeadSchema = z.object({
  name: z.string().trim().min(2).max(90),
  whatsapp: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9\s-]{7,17}$/, "Enter a valid WhatsApp number."),
  email: z.string().trim().email().max(200).optional().or(z.literal("").transform(() => undefined)),
  website: z.string().trim().max(300).optional().or(z.literal("").transform(() => undefined)),
  company: z.string().trim().max(120).optional(),
  department: z.string().trim().max(24).optional(),
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

  void logLeadActivity({
    leadId: lead.id,
    type: "created",
    message: `Lead captured from ${sourceLabel(lead.source)}`,
  });

  // Auto-route to an owner and score the lead (best-effort, never blocks).
  onLeadCreated(lead);

  /* Route the enquiry to the desk the visitor picked. Best-effort: the lead
     is already stored, so a mail failure never loses it.

     Goes through sendEmail rather than calling Resend directly — this used
     to bypass it, so the desk alert kept needing a RESEND_API_KEY even after
     SMTP was configured in the admin. */
  {
    const contactConfig = await getContactConfig();
    const to = process.env.CONTACT_TO_EMAIL ?? deskEmail(contactConfig, d.department);
    const mail = alertEmail({
      badge: `New enquiry · ${d.department ?? "CONTACT"}`,
      title: d.company ? `${lead.name} — ${d.company}` : lead.name,
      subtitle: "Came in through the website contact form.",
      rows: [
        { label: "WhatsApp", value: lead.whatsapp },
        { label: "Email", value: lead.email || "" },
        { label: "Website", value: lead.website || "" },
        { label: "Interested in", value: lead.services.join(", ") },
        { label: "Budget", value: lead.budget || "" },
        { label: "Timeline", value: lead.timeline || "" },
        { label: "Found us via", value: lead.heardFrom || "" },
      ],
      quote: lead.message || undefined,
      actionLabel: "Open in CMS",
      actionUrl: emailUrl("/admin/leads"),
      secondaryLabel: "Reply on WhatsApp",
      secondaryUrl: `https://wa.me/${lead.whatsapp.replace(/[^\d]/g, "")}`,
      footerNote: `Sent to the ${(d.department ?? "contact").toLowerCase()} desk.`,
    });

    void sendEmail({
      to: [to],
      subject: `${d.department ?? "CONTACT"} enquiry: ${lead.name}`,
      text: mail.text,
      html: mail.html,
      ...(d.email ? { replyTo: d.email } : {}),
    });

    /* Auto-reply to the enquirer. Only when they gave an email, only when the
       submission is not flagged as spam — confirming receipt to a spammer
       just turns this into a mail relay for them. */
    if (d.email && flags.length === 0) {
      const ack = thankYouEmail({
        name: lead.name,
        summary: [
          { label: "Interested in", value: lead.services.join(", ") },
          { label: "Budget", value: lead.budget || "" },
          { label: "Timeline", value: lead.timeline || "" },
        ],
        message: lead.message || undefined,
      });
      void sendEmail({
        to: [d.email],
        subject: "We've got your enquiry — DigiSutra Solutions",
        text: ack.text,
        html: ack.html,
      });
    }
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

const PAGE_SIZE = 25;
const PAGE_SIZES = [25, 50, 100];

/** Admin: list/filter/search leads (paginated); ?format=csv exports the match. */
export async function GET(req: Request) {
  const { user, error } = await requirePermission("leads.manage");
  if (error) return error;

  const url = new URL(req.url);
  const p = url.searchParams;
  const status = p.get("status");
  const source = p.get("source");
  const priority = p.get("priority");
  const assignedTo = p.get("assignedTo"); // user id, or "unassigned"
  const q = (p.get("q") ?? "").trim().slice(0, 100);
  const page = Math.max(1, parseInt(p.get("page") ?? "1", 10) || 1);
  const reqSize = parseInt(p.get("pageSize") ?? "", 10);
  const pageSize = PAGE_SIZES.includes(reqSize) ? reqSize : PAGE_SIZE;

  const where: Prisma.LeadWhereInput = { deletedAt: null };
  if (status && status !== "ALL") where.status = status as Prisma.LeadWhereInput["status"];
  if (source && source !== "ALL") where.source = source as Prisma.LeadWhereInput["source"];
  if (priority && priority !== "ALL")
    where.priority = priority as Prisma.LeadWhereInput["priority"];
  if (assignedTo === "unassigned") where.assignedToId = null;
  else if (assignedTo && assignedTo !== "ALL") where.assignedToId = assignedTo;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { company: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { whatsapp: { contains: q } },
    ];
  }
  // Score band filter → a score range from the current thresholds.
  const band = p.get("band");
  if (band === "HOT" || band === "WARM" || band === "COLD") {
    const cfg = await getScoringConfig();
    if (band === "HOT") where.score = { gte: cfg.hotMin };
    else if (band === "WARM") where.score = { gte: cfg.warmMin, lt: cfg.hotMin };
    else where.score = { lt: cfg.warmMin };
  }

  // Visibility scope: a user without leads.viewAll only ever sees their own
  // assigned leads — this overrides any assignee filter above.
  Object.assign(where, leadScopeWhere(user));

  const isCsv = p.get("format") === "csv";
  // Kanban needs the whole pipeline at once (not a 25-row page).
  const board = p.get("view") === "board";
  const [total, leads] = await Promise.all([
    db.lead.count({ where }),
    db.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: isCsv || board ? 0 : (page - 1) * pageSize,
      take: isCsv ? 5000 : board ? 300 : pageSize,
      include: { assignedTo: { select: { id: true, name: true } } },
    }),
  ]);

  if (isCsv) {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [
      ["Created", "Name", "Company", "WhatsApp", "Email", "Website", "Source", "Status", "Priority", "Score", "Assigned to", "Country", "City", "Services", "Budget", "Message", "Notes"].join(","),
      ...leads.map((l) =>
        [
          l.createdAt.toISOString(),
          l.name, l.company, l.whatsapp, l.email, l.website,
          l.source, l.status, l.priority, l.score, l.assignedTo?.name,
          l.country, l.city, l.services.join("; "), l.budget, l.message, l.notes,
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

  return NextResponse.json({
    ok: true,
    leads,
    total,
    page,
    pageSize,
    pages: Math.max(1, Math.ceil(total / pageSize)),
  });
}
