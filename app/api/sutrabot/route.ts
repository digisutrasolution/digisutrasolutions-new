import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { MAX_TURNS, botReply } from "@/lib/sutrabot";

const TurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(1200),
});

const ChatSchema = z.object({
  turns: z.array(TurnSchema).min(1).max(MAX_TURNS),
  hp: z.string().optional(), // honeypot — must stay empty
});

/** Public: one turn of the DigiSutra Bot conversation. The conversation
    lives in the client; the server stays stateless and re-grounds every
    reply in live CMS data. */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const { allowed, retryAfterSec } = rateLimit(`sutrabot:${ip}`, 25, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: `You're sending messages quickly — try again in ${retryAfterSec}s, or WhatsApp us.` },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = ChatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid message." }, { status: 400 });
  }
  if (parsed.data.hp) {
    return NextResponse.json({ ok: true, reply: "Thanks!", mode: "scripted" });
  }

  try {
    const { reply, mode } = await botReply(parsed.data.turns);
    return NextResponse.json({ ok: true, reply, mode });
  } catch {
    return NextResponse.json(
      { ok: false, error: "The assistant is unavailable right now — WhatsApp us and a human will reply." },
      { status: 503 },
    );
  }
}
