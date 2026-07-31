import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import { logLeadActivity } from "@/lib/crm-server";
import { getScoringConfig } from "@/lib/scoring-server";
import { computeScore } from "@/lib/scoring";

const RowSchema = z.object({
  name: z.string().trim().min(1).max(160),
  whatsapp: z.string().trim().max(40).default(""),
  email: z.string().trim().max(200).optional(),
  company: z.string().trim().max(160).optional(),
  city: z.string().trim().max(80).optional(),
  country: z.string().trim().max(80).optional(),
  budget: z.string().trim().max(60).optional(),
  services: z.string().trim().max(400).optional(),
  message: z.string().trim().max(2000).optional(),
});

const Schema = z.object({ rows: z.array(RowSchema).min(1).max(2000) });

const digits = (s: string) => s.replace(/[^\d]/g, "");

/** Bulk-import leads from a mapped CSV. Dedupes on WhatsApp/email against the
    existing pipeline and within the upload; new leads are scored on the way in
    (imported leads land unassigned — use bulk assign or the rules on next
    touch). Source is CSV_IMPORT. */
export async function POST(req: Request) {
  const { user, error } = await requirePermission("leads.manage");
  if (error) return error;

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const rows = parsed.data.rows;

  // Prefetch existing WhatsApp/email to dedupe in one query.
  const waList = [...new Set(rows.map((r) => digits(r.whatsapp)).filter(Boolean))];
  const emailList = [...new Set(rows.map((r) => (r.email ?? "").toLowerCase()).filter(Boolean))];
  const existing = await db.lead.findMany({
    where: {
      deletedAt: null,
      OR: [
        ...(waList.length ? [{ whatsapp: { in: waList } }] : []),
        ...(emailList.length ? [{ email: { in: emailList } }] : []),
      ],
    },
    select: { whatsapp: true, email: true },
  });
  const seenWa = new Set(existing.map((e) => digits(e.whatsapp)).filter(Boolean));
  const seenEmail = new Set(existing.map((e) => (e.email ?? "").toLowerCase()).filter(Boolean));

  const cfg = await getScoringConfig();
  let created = 0;
  let duplicates = 0;
  const skipped: { row: number; reason: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const wa = digits(r.whatsapp);
    const email = (r.email ?? "").toLowerCase();
    if (!wa && !email) { skipped.push({ row: i + 1, reason: "No phone or email" }); continue; }
    if ((wa && seenWa.has(wa)) || (email && seenEmail.has(email))) { duplicates++; continue; }
    if (wa) seenWa.add(wa);
    if (email) seenEmail.add(email);

    const services = r.services
      ? r.services.split(/[,;/|]/).map((s) => s.trim()).filter(Boolean).slice(0, 10)
      : [];
    const { score } = computeScore(
      { email: r.email, company: r.company, budget: r.budget, source: "CSV_IMPORT", services, message: r.message },
      cfg,
    );

    try {
      const lead = await db.lead.create({
        data: {
          name: r.name,
          whatsapp: wa || r.whatsapp || "—",
          email: r.email || null,
          company: r.company || null,
          city: r.city || null,
          country: r.country || null,
          budget: r.budget || null,
          message: r.message || null,
          services,
          source: "CSV_IMPORT",
          score,
          notes: "Imported from CSV",
        },
      });
      void logLeadActivity({ leadId: lead.id, userId: user.id, userName: user.name, type: "created", message: `Imported from CSV by ${user.name}` });
      created++;
    } catch {
      skipped.push({ row: i + 1, reason: "Could not save" });
    }
  }

  audit({ userId: user.id, action: "lead.import", entity: "lead", entityId: `${created} leads`, meta: { created, duplicates, skipped: skipped.length }, ip: clientIp(req) });
  return NextResponse.json({ ok: true, created, duplicates, skipped });
}
