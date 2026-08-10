import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { resolveOutreachToken } from "@/lib/outreach-server";
import { notifyRoles } from "@/lib/notify";

/* A client submitting their own testimonial through a review link.

   No session: the token is the authentication. It is scoped to one lead, so
   whoever holds it can only ever post as that client, and the row records
   which lead it came from. */

const SubmitSchema = z.object({
  quote: z.string().trim().min(20).max(1200),
  name: z.string().trim().min(2).max(90),
  role: z.string().trim().max(90).optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

type Params = { params: Promise<{ token: string }> };

export async function POST(req: Request, { params }: Params) {
  const ip = clientIp(req);
  if (!rateLimit(`review:${ip}`, 5, 10 * 60 * 1000).allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Try again in a few minutes." },
      { status: 429 },
    );
  }

  const { token } = await params;
  const link = await resolveOutreachToken(token, "REVIEW");
  if (!link) {
    // Deliberately vague: a probe should not learn whether a token exists.
    return NextResponse.json({ ok: false, error: "This link is no longer valid." }, { status: 404 });
  }
  if (link.completedAt) {
    return NextResponse.json(
      { ok: false, error: "You have already left a review through this link. Thank you!" },
      { status: 409 },
    );
  }

  const parsed = SubmitSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." },
      { status: 400 },
    );
  }

  /* visible: false is the important bit. Testimonial defaults to visible, so
     a submission would otherwise publish itself straight onto the site with
     nobody having read it. */
  const created = await db.testimonial
    .create({
      data: {
        quote: parsed.data.quote,
        name: parsed.data.name,
        role: parsed.data.role ?? "",
        rating: parsed.data.rating ?? 5,
        visible: false,
        leadId: link.leadId,
      },
      select: { id: true },
    })
    .catch(() => null);

  if (!created) {
    return NextResponse.json(
      { ok: false, error: "Could not save that. Please try again." },
      { status: 500 },
    );
  }

  await db.outreachLink
    .update({ where: { id: link.id }, data: { completedAt: new Date() } })
    .catch(() => {});

  void notifyRoles(
    ["SUPER_ADMIN"],
    {
      type: "testimonial",
      title: `New testimonial from ${parsed.data.name}`,
      body: parsed.data.quote.slice(0, 140),
      link: "/admin/proof",
    },
    {},
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}
