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
  // Internal targets need the deployment base path re-applied.
  const target = ad.targetUrl.startsWith("/")
    ? new URL(withBase(ad.targetUrl), req.url)
    : ad.targetUrl;
  return NextResponse.redirect(target, 302);
}
