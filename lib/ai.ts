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
