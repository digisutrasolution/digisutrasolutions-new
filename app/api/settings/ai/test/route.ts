import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/guards";
import { testProvider } from "@/lib/ai";
import { AI_PROVIDER_IDS } from "@/lib/ai-config";

const Schema = z.object({ provider: z.enum(AI_PROVIDER_IDS) });

/** Live one-shot test of a single provider. */
export async function POST(req: Request) {
  const { error } = await requirePermission("settings.manage");
  if (error) return error;
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid provider." }, { status: 400 });
  const result = await testProvider(parsed.data.provider);
  return NextResponse.json(result);
}
