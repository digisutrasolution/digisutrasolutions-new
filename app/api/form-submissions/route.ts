import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { parseFormFields, validateSubmission } from "@/lib/cms/forms";
import { notifyRoles } from "@/lib/notify";
import { sendEmail } from "@/lib/email";
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
  void notifyRoles(["SUPER_ADMIN"], {
    type: "form",
    title: `New "${form.name}" submission`,
    body: summary.slice(0, 140),
    link: "/admin/forms",
  });
  if (form.notifyEmail) {
    void sendEmail({
      to: [form.notifyEmail],
      subject: `New "${form.name}" submission`,
      text: summary,
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
