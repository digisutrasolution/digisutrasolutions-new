import { NextResponse } from "next/server";
import { pushConfigured, vapidPublicKey } from "@/lib/push";

/** The VAPID public key the browser needs to create a push subscription. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    configured: pushConfigured(),
    key: pushConfigured() ? vapidPublicKey() : "",
  });
}
