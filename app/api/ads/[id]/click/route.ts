import { NextResponse } from "next/server";
import { withBase } from "@/lib/base-path";
import { db } from "@/lib/db";

/** Click-through tracker: count, then bounce to the banner's target URL. */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ad = await db.adBanner
    .findUnique({ where: { id }, select: { targetUrl: true, active: true } })
    .catch(() => null);
  if (!ad || !ad.active) {
    return NextResponse.redirect(new URL(withBase("/"), req.url), 302);
  }
  await db.adBanner
    .update({ where: { id }, data: { clicks: { increment: 1 } } })
    .catch(() => {});
  // Internal targets need the deployment base path re-applied. The scheme
  // is re-checked here rather than trusted from the row: validation at
  // write time does not cover rows edited directly in the database, and an
  // unchecked redirect on our domain is a phishing primitive.
  if (ad.targetUrl.startsWith("/")) {
    return NextResponse.redirect(new URL(withBase(ad.targetUrl), req.url), 302);
  }
  if (/^https?:\/\//i.test(ad.targetUrl)) {
    return NextResponse.redirect(ad.targetUrl, 302);
  }
  return NextResponse.redirect(new URL(withBase("/"), req.url), 302);
}
