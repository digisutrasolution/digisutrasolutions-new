import { NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "@/lib/ai-provider";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { blogOutlineTemplate, chatbotFlowTemplate } from "@/lib/tool-templates";

export const runtime = "nodejs";

/* Public AI tools. Works with a Gemini key, an Anthropic key, or neither —
   with no key the deterministic template is returned and the response says
   so, rather than failing. */

const Schema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("blog-outline"),
    topic: z.string().trim().min(3).max(160),
    keyword: z.string().trim().max(80).optional(),
    audience: z.string().trim().max(80).optional(),
  }),
  z.object({
    kind: z.literal("chatbot-flow"),
    business: z.string().trim().min(2).max(120),
    goal: z.string().trim().max(160).optional(),
  }),
]);

const SYSTEM = `You write for Indian small businesses. Be concrete and practical.
Plain language, no buzzwords ("leverage", "seamless", "unlock", "empower"), no emoji.
Never invent statistics, prices or claims — if a number is needed, tell the reader to insert their own.
Return plain text only: no markdown bold, no code fences.`;

export async function POST(req: Request) {
  const ip = clientIp(req);
  const { allowed, retryAfterSec } = rateLimit(`tools-ai:${ip}`, 10, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: `That's a lot of generating — try again in ${retryAfterSec}s.` },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Fill in the fields first." }, { status: 400 });
  }
  const d = parsed.data;

  const prompt =
    d.kind === "blog-outline"
      ? `Write a blog article outline for Indian readers.

Topic: ${d.topic}
Target keyword: ${d.keyword || d.topic}
Audience: ${d.audience || "business owners"}

Format exactly like this:
# <article title, under 65 characters, includes the keyword naturally>
Then 6 to 8 sections, each as:
## <section heading phrased the way someone would search it>
<one or two sentences on what the section should cover and the first fact it should state>

Finish with a "## FAQ" section listing three real questions. Answer-first style throughout.`
      : `Design a website chatbot conversation flow.

Business: ${d.business}
Primary goal: ${d.goal || "capture qualified enquiries"}

Return numbered steps covering: greeting with 3 quick-reply buttons, two or three qualifying
questions asked one at a time, how to answer a pricing question honestly, how to capture the
lead (name and WhatsApp), when to hand off to a human, and a fallback after two failed matches.
Add a short "Edge cases" list at the end. Keep every message under 25 words.`;

  const { text, source } = await generateText({ system: SYSTEM, prompt, maxTokens: 1100 });

  const output =
    text ??
    (d.kind === "blog-outline"
      ? blogOutlineTemplate(d.topic, d.keyword ?? "", d.audience ?? "")
      : chatbotFlowTemplate(d.business, d.goal ?? ""));

  return NextResponse.json({ ok: true, output, source });
}
