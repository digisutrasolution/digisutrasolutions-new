import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { AI_KINDS, AI_MODEL, generate, isConfigured, type AiKind } from "@/lib/ai";
import { audit } from "@/lib/audit";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const GenerateSchema = z.object({
  kind: z.enum(Object.keys(AI_KINDS) as [AiKind, ...AiKind[]]),
  context: z.string().trim().min(3, "Give the assistant some context.").max(20000),
});

export async function POST(req: Request) {
  const { user, error } = await requirePermission("ai.use");
  if (error) return error;

  if (!isConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: "AI assistant is not configured — add ANTHROPIC_API_KEY to the environment.",
      },
      { status: 503 },
    );
  }

  const limited = rateLimit(`ai:${user.id}`, 20, 10 * 60 * 1000);
  if (!limited.allowed) {
    return NextResponse.json(
      { ok: false, error: "AI rate limit reached — try again in a few minutes." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  try {
    const text = await generate(parsed.data.kind, parsed.data.context);

    await db.aiGeneration.create({
      data: {
        userId: user.id,
        userName: user.name,
        kind: parsed.data.kind,
        model: AI_MODEL,
        inputChars: parsed.data.context.length,
        outputChars: text.length,
      },
    });
    audit({
      userId: user.id,
      action: "ai.generate",
      entity: "ai",
      meta: { kind: parsed.data.kind },
      ip: clientIp(req),
    });

    return NextResponse.json({ ok: true, text });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { ok: false, error: "AI provider rejected the API key — check ANTHROPIC_API_KEY." },
        { status: 503 },
      );
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { ok: false, error: "AI provider rate limit hit — try again shortly." },
        { status: 429 },
      );
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { ok: false, error: `AI provider error (${err.status ?? "?"}).` },
        { status: 502 },
      );
    }
    const message = err instanceof Error ? err.message : "Generation failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
