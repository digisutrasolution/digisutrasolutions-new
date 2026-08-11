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
import { spamNote } from "@/lib/spam";
import { assessSubmission } from "@/lib/spam-server";
import { AttributionSchema, resolveAttribution } from "@/lib/attribution-server";
import { deriveChannel, sourceFromChannel } from "@/lib/lead-channel";
import { issueChallenge, type IssueChallenge } from "@/lib/otp";

const SubmitSchema = z.object({
  slug: z.string().trim().min(1).max(80),
  data: z.record(z.string(), z.unknown()),
  website: z.string().optional(), // honeypot
  jsToken: z.string().max(40).optional(), // proof the page script ran
  startedAt: z.number().optional(), // time-trap — form render timestamp
  attribution: AttributionSchema.optional(),
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

  /* Dynamic forms have no fixed field names, so score the mapped lead fields
     plus the whole answer set as the message body. Stored either way — a
     quarantined submission is kept but routed to SPAM and never notified. */
  const mapped = leadFromSubmission(result.clean);
  const spam = assessSubmission(
    {
      name: mapped.name,
      email: mapped.email,
      message: Object.values(result.clean)
        .filter((v) => typeof v === "string")
        .join("\n")
        .slice(0, 4000),
      honeypot: Boolean(parsed.data.website),
      elapsedMs: parsed.data.startedAt ? Date.now() - parsed.data.startedAt : null,
      token: parsed.data.jsToken,
    },
    ip,
  );
  const quarantined = spam.verdict === "spam";

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
  let verify: IssueChallenge | null = null;

  if (form.destination === "lead") {
    const lead = mapped;
    const attribution = await resolveAttribution(parsed.data.attribution);
    const created = await db.lead
      .create({
        data: {
          ...attribution,
          name: lead.name,
          whatsapp: lead.whatsapp,
          email: lead.email || null,
          message: lead.message || null,
          budget: lead.budget || null,
          timeline: lead.timeline || null,
          heardFrom: lead.heardFrom || null,
          // Paid traffic overrides the intake label — see /api/leads for why.
          source: sourceFromChannel(deriveChannel(attribution)) ?? "FORM",
          ...(quarantined ? { status: "SPAM" as const } : {}),
          notes: [`Via form: ${form.name}`, spamNote(spam)].filter(Boolean).join(" "),
        },
      })
      .catch(() => null);
    // Auto-route + score (best-effort, never blocks). Junk stays unassigned.
    if (created && !quarantined) onLeadCreated(created);
    if (!quarantined) {
      void notifyRoles(["SUPER_ADMIN", "SEO_MANAGER"], {
        type: "lead",
        title: `New lead from "${form.name}"`,
        body: `${lead.name}${lead.whatsapp ? ` · ${lead.whatsapp}` : ""}`.slice(0, 140),
        link: "/admin/leads",
      });

      /* Soft verification — the submission is already stored, so the code is
         only an optional way to prove the contact. Skipped for quarantined
         junk so the channel can't be used as a relay. */
      if (created) {
        try {
          const otp = await issueChallenge({
            leadId: created.id,
            email: lead.email || "",
            phone: lead.whatsapp && lead.whatsapp !== "—" ? lead.whatsapp : "",
          });
          if (otp.sent) verify = otp.challenge;
        } catch {
          /* best-effort — never costs a captured submission */
        }
      }
    }
  } else if (!quarantined) {
    void notifyRoles(["SUPER_ADMIN"], {
      type: "form",
      title: `New "${form.name}" submission`,
      body: summary.slice(0, 140),
      link: "/admin/forms",
    });
  }
  if (form.notifyEmail && !quarantined) {
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

  return NextResponse.json({ ok: true, ...(verify ? { verify } : {}) });
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
