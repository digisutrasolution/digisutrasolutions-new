import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { parseFormFields } from "@/lib/cms/forms";

type Params = { params: Promise<{ id: string }> };

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(req: Request, { params }: Params) {
  const { error } = await requirePermission("forms.manage");
  if (error) return error;
  const { id } = await params;

  const form = await db.form.findUnique({ where: { id } });
  if (!form) {
    return NextResponse.json(
      { ok: false, error: "Form not found." },
      { status: 404 },
    );
  }

  const submissions = await db.formSubmission.findMany({
    where: { formId: id },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  const url = new URL(req.url);
  if (url.searchParams.get("format") === "csv") {
    const fields = parseFormFields(form.fields);
    const header = ["submitted_at", ...fields.map((f) => f.key)];
    const rows = submissions.map((s) => {
      const data = (s.data ?? {}) as Record<string, string>;
      return [
        s.createdAt.toISOString(),
        ...fields.map((f) => csvEscape(String(data[f.key] ?? ""))),
      ].join(",");
    });
    const csv = [header.join(","), ...rows].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${form.slug}-submissions.csv"`,
      },
    });
  }

  return NextResponse.json({ ok: true, submissions });
}
