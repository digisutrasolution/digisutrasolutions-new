import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { error } = await requirePermission("newsletter.manage");
  if (error) return error;

  const subscribers = await db.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
  });

  const url = new URL(req.url);
  if (url.searchParams.get("format") === "csv") {
    const rows = [
      "email,source,subscribed_at",
      ...subscribers.map(
        (s) => `${s.email},${s.source},${s.createdAt.toISOString()}`,
      ),
    ];
    return new Response(rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="newsletter-subscribers.csv"`,
      },
    });
  }

  return NextResponse.json({ ok: true, subscribers });
}
