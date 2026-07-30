import Anthropic from "@anthropic-ai/sdk";
import { AI_KINDS, type AiKind } from "@/lib/ai-kinds";

export { AI_KINDS, type AiKind };

/**
 * AI content assistant. Uses the official Anthropic SDK against
 * claude-opus-4-8 with adaptive thinking. Requires ANTHROPIC_API_KEY;
 * callers get a clear "not configured" error without it.
 */
export const AI_MODEL = "claude-opus-4-8";

const BRAND_CONTEXT = `You write for DigiSutra Solutions, a digital marketing and
software development agency in India serving 12 countries. Tagline: "Your growth,
our sutra." Services: SEO, PPC (Google/Meta), social media, web & e-commerce
development, AI automation agents, UI/UX, email/SMS marketing, lead generation, AI chatbots and automation.
Voice: confident, direct, measurable-results-focused, warm but not fluffy.
Avoid buzzwords like "leverage", "seamless", "unlock", "empower".`;

export function isConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function generate(kind: AiKind, context: string): Promise<string> {
  const def = AI_KINDS[kind];
  const client = new Anthropic();

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: def.maxTokens,
    thinking: { type: "adaptive" },
    system: BRAND_CONTEXT,
    messages: [{ role: "user", content: def.prompt(context) }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("The model declined this request.");
  }
  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
  if (!text) throw new Error("The model returned no text.");
  return text;
}

/**
 * AI lead qualification: score conversion likelihood 0–100 with a short
 * rationale. Advisory — the rule-based score stays the system score; this is a
 * second opinion the sales team can apply if they agree.
 */
export async function scoreLeadAI(context: string): Promise<{ score: number; reason: string }> {
  if (!isConfigured()) throw new Error("AI is not configured.");
  const client = new Anthropic();
  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 600,
    thinking: { type: "adaptive" },
    system: `${BRAND_CONTEXT}\n\nYou are a sales qualification assistant. Judge how likely a lead is to become a paying client and score it 0–100 (100 = extremely hot, ready to buy now; 0 = spam or irrelevant). Weigh budget, urgency, fit with our services, seniority/company signals, and message intent.`,
    messages: [
      {
        role: "user",
        content: `Score this lead's conversion likelihood. Respond in EXACTLY this format and nothing else:\nSCORE: <integer 0-100>\nREASON: <one or two concise sentences>\n\nLead:\n${context}`,
      },
    ],
  });
  if (response.stop_reason === "refusal") {
    throw new Error("The model declined this request.");
  }
  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");
  const scoreMatch = text.match(/SCORE:\s*(\d{1,3})/i);
  const reasonMatch = text.match(/REASON:\s*([\s\S]+)/i);
  const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10))) : NaN;
  if (Number.isNaN(score)) throw new Error("Could not read an AI score from the response.");
  return { score, reason: (reasonMatch?.[1] ?? "").trim().slice(0, 500) };
}
