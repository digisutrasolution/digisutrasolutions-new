import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { getSmsGateway } from "@/lib/sms-config-server";
import { sendSms } from "@/lib/sms";

/** Send a live test SMS through the gateway so the owner can confirm it works. */
export async function POST(req: Request) {
  const { error } = await requirePermission("settings.manage");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const to = typeof body?.to === "string" ? body.to.trim() : "";
  if (!to) return NextResponse.json({ ok: false, reason: "Enter a test number." }, { status: 400 });

  const res = await sendSms(
    { to, text: "DigiSutra SMS gateway test — it works. You can ignore this message." },
    await getSmsGateway(true),
  );
  return res.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ ok: false, reason: res.error });
}
