import { NextResponse } from "next/server";
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
    return NextResponse.redirect(new URL("/", req.url), 302);
  }
  await db.adBanner
    .update({ where: { id }, data: { clicks: { increment: 1 } } })
    .catch(() => {});
  const target = ad.targetUrl.startsWith("/")
    ? new URL(ad.targetUrl, req.url)
    : ad.targetUrl;
  return NextResponse.redirect(target, 302);
}
