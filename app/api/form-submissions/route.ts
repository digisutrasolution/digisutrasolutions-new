import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { leadFromSubmission, parseFormFields, validateSubmission } from "@/lib/cms/forms";
import { onLeadCreated } from "@/lib/lead-intake";
import { notifyRoles } from "@/lib/notify";
import { sendEmail } from "@/lib/email";
import { alertEmail, emailUrl } from "@/lib/email-templates";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const SubmitSchema = z.object({
  slug: z.string().trim().min(1).max(80),
  data: z.record(z.string(), z.unknown()),
  website: z.string().optional(), // honeypot
});

/** Public endpoint used by embedded form sections on the site. */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = rateLimit(`form:${ip}`, 8, 10 * 60 * 1000);
  if (!limited.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Try again later." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = SubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid submission." },
      { status: 400 },
    );
  }
  if (parsed.data.website) {
    return NextResponse.json({ ok: true }); // honeypot: pretend success
  }

  const form = await db.form.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (!form || !form.isActive) {
    return NextResponse.json(
      { ok: false, error: "This form is not accepting submissions." },
      { status: 404 },
    );
  }

  const fields = parseFormFields(form.fields);
  const result = validateSubmission(fields, parsed.data.data);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  await db.formSubmission.create({
    data: {
      formId: form.id,
      data: result.clean as Prisma.InputJsonValue,
      ip,
    },
  });

  const summary = fields
    .map((f) => `${f.label}: ${result.clean[f.key] || "—"}`)
    .join("\n");

  // "lead" forms also drop a real Lead into the pipeline so the leads desk
  // works them like any contact enquiry; "submission" forms just notify.
  if (form.destination === "lead") {
    const lead = leadFromSubmission(result.clean);
    const created = await db.lead
      .create({
        data: {
          name: lead.name,
          whatsapp: lead.whatsapp,
          email: lead.email || null,
          message: lead.message || null,
          budget: lead.budget || null,
          timeline: lead.timeline || null,
          heardFrom: lead.heardFrom || null,
          source: "FORM",
          notes: `Via form: ${form.name}`,
        },
      })
      .catch(() => null);
    // Auto-route + score (best-effort, never blocks).
    if (created) onLeadCreated(created);
    void notifyRoles(["SUPER_ADMIN", "SEO_MANAGER"], {
      type: "lead",
      title: `New lead from "${form.name}"`,
      body: `${lead.name}${lead.whatsapp ? ` · ${lead.whatsapp}` : ""}`.slice(0, 140),
      link: "/admin/leads",
    });
  } else {
    void notifyRoles(["SUPER_ADMIN"], {
      type: "form",
      title: `New "${form.name}" submission`,
      body: summary.slice(0, 140),
      link: "/admin/forms",
    });
  }
  if (form.notifyEmail) {
    const mail = alertEmail({
      badge: "New form submission",
      title: form.name,
      subtitle: "Submitted from the website.",
      rows: fields.map((f) => ({
        label: f.label,
        value: String(result.clean[f.key] ?? ""),
      })),
      actionLabel: "Open in CMS",
      actionUrl: emailUrl("/admin/forms"),
    });
    void sendEmail({
      to: [form.notifyEmail],
      subject: `New "${form.name}" submission`,
      text: mail.text,
      html: mail.html,
    });
  }

  return NextResponse.json({ ok: true });
}

/** Public form definition for embedding (active forms only). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug") ?? "";
  const form = await db.form.findUnique({ where: { slug } });
  if (!form || !form.isActive) {
    return NextResponse.json(
      { ok: false, error: "Form not found." },
      { status: 404 },
    );
  }
  return NextResponse.json({
    ok: true,
    form: { name: form.name, slug: form.slug, fields: parseFormFields(form.fields) },
  });
}
