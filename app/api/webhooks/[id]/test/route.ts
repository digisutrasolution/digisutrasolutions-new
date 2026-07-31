import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { sendTestPing } from "@/lib/webhooks";

type Params = { params: Promise<{ id: string }> };

/** Send a one-off "ping" event to the webhook and report the delivery result. */
export async function POST(_req: Request, { params }: Params) {
  const { error } = await requirePermission("api.manage");
  if (error) return error;
  const { id } = await params;
  const result = await sendTestPing(id);
  return NextResponse.json({ ok: true, delivered: result.ok, status: result.status, error: result.error });
}
