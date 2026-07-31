import { db } from "@/lib/db";

// 1x1 transparent GIF.
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

/** Open-tracking beacon for sent emails. Public (the recipient's mail client
    fetches it); marks the CommLog opened once, then always returns the pixel. */
export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get("t");
  if (t) {
    try {
      await db.commLog.updateMany({
        where: { trackId: t, openedAt: null },
        data: { openedAt: new Date(), status: "OPENED" },
      });
    } catch {
      /* never let tracking break the pixel response */
    }
  }
  return new Response(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Content-Length": String(PIXEL.length),
    },
  });
}
