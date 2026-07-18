import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { FaqSchema, bootstrapFaqsIfEmpty } from "@/lib/faq-admin";
import { clientIp } from "@/lib/rate-limit";

export async function GET() {
  const { error } = await requirePermission("faq.manage");
  if (error) return error;
  await bootstrapFaqsIfEmpty();
  const faqs = await db.faqItem.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ ok: true, faqs });
}

export async function POST(req: Request) {
  const { user, error } = await requirePermission("faq.manage");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = FaqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const last = await db.faqItem.findFirst({ orderBy: { order: "desc" } });
  const faq = await db.faqItem.create({
    data: {
      question: d.question,
      lead: d.lead ?? "",
      rest: d.rest ?? "",
      category: d.category ?? "General",
      icon: d.icon ?? null,
      featured: d.featured ?? false,
      visible: d.visible ?? true,
      order: (last?.order ?? -1) + 1,
    },
  });

  audit({
    userId: user.id,
    action: "faq.create",
    entity: "faqItem",
    entityId: faq.id,
    meta: { question: faq.question },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, faq }, { status: 201 });
}
