import Anthropic from "@anthropic-ai/sdk";
import { AI_KINDS, type AiKind } from "@/lib/ai-kinds";

export { AI_KINDS, type AiKind };

/**
 * AI layer with a provider fallback chain. Each request tries providers in
 * order until one succeeds, so the features degrade instead of breaking:
 *   Anthropic (best quality) → Ollama (self-hosted, free, private) → Gemini.
 * Which providers are in the chain is decided purely by which keys/URLs are
 * set, so ops can turn any of them on/off from .env with no code change.
 */
export const AI_MODEL = "claude-opus-4-8";

const BRAND_CONTEXT = `You write for DigiSutra Solutions, a digital marketing and
software development agency in India serving 12 countries. Tagline: "Your growth,
our sutra." Services: SEO, PPC (Google/Meta), social media, web & e-commerce
development, AI automation agents, UI/UX, email/SMS marketing, lead generation, AI chatbots and automation.
Voice: confident, direct, measurable-results-focused, warm but not fluffy.
Avoid buzzwords like "leverage", "seamless", "unlock", "empower".`;

type Msg = { system: string; prompt: string; maxTokens: number };

async function viaAnthropic({ system, prompt, maxTokens }: Msg): Promise<string> {
  const client = new Anthropic();
  const res = await client.messages.create({
    model: AI_MODEL,
    max_tokens: maxTokens,
    thinking: { type: "adaptive" },
    system,
    messages: [{ role: "user", content: prompt }],
  });
  if (res.stop_reason === "refusal") throw new Error("The model declined this request.");
  const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
  if (!text) throw new Error("Empty response.");
  return text;
}

async function viaOllama({ system, prompt, maxTokens }: Msg): Promise<string> {
  const base = (process.env.OLLAMA_URL ?? "").replace(/\/+$/, "");
  const model = process.env.OLLAMA_MODEL || "llama3.1";
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      options: { num_predict: maxTokens },
      messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
  const j = await res.json();
  const text = (j?.message?.content ?? "").trim();
  if (!text) throw new Error("Empty response.");
  return text;
}

async function viaGemini({ system, prompt, maxTokens }: Msg): Promise<string> {
  const key = process.env.GEMINI_API_KEY ?? "";
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens },
      }),
      signal: AbortSignal.timeout(45_000),
    },
  );
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const j = await res.json();
  const text = (j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "").trim();
  if (!text) throw new Error("Empty response.");
  return text;
}

type Provider = { name: string; label: string; enabled: () => boolean; run: (m: Msg) => Promise<string> };
const PROVIDERS: Provider[] = [
  { name: "claude", label: "Claude", enabled: () => !!process.env.ANTHROPIC_API_KEY, run: viaAnthropic },
  { name: "ollama", label: "Ollama", enabled: () => !!process.env.OLLAMA_URL, run: viaOllama },
  { name: "gemini", label: "Gemini", enabled: () => !!process.env.GEMINI_API_KEY, run: viaGemini },
];

export function isConfigured(): boolean {
  return PROVIDERS.some((p) => p.enabled());
}

/** Run a completion through the fallback chain. Returns the text + which
    provider actually answered. Throws only if every enabled provider fails. */
export async function complete(m: Msg): Promise<{ text: string; provider: string }> {
  const chain = PROVIDERS.filter((p) => p.enabled());
  if (chain.length === 0) throw new Error("AI is not configured.");
  let lastErr: unknown = null;
  for (const p of chain) {
    try {
      const text = await p.run(m);
      return { text, provider: p.label };
    } catch (err) {
      lastErr = err;
      console.error(`AI provider ${p.name} failed:`, err instanceof Error ? err.message : err);
    }
  }
  throw new Error(lastErr instanceof Error ? lastErr.message : "All AI providers failed.");
}

/** Content generation (blog/SEO/etc.) — now resilient via the chain. */
export async function generate(kind: AiKind, context: string): Promise<string> {
  const def = AI_KINDS[kind];
  const { text } = await complete({ system: BRAND_CONTEXT, prompt: def.prompt(context), maxTokens: def.maxTokens });
  return text;
}

/** Advisory AI conversion score 0–100 with a short rationale. */
export async function scoreLeadAI(context: string): Promise<{ score: number; reason: string; provider: string }> {
  const { text, provider } = await complete({
    system: `${BRAND_CONTEXT}\n\nYou are a sales qualification assistant. Judge how likely a lead is to become a paying client and score it 0–100 (100 = extremely hot, ready to buy now; 0 = spam or irrelevant). Weigh budget, urgency, fit with our services, seniority/company signals, and message intent.`,
    prompt: `Score this lead's conversion likelihood. Respond in EXACTLY this format and nothing else:\nSCORE: <integer 0-100>\nREASON: <one or two concise sentences>\n\nLead:\n${context}`,
    maxTokens: 600,
  });
  const scoreMatch = text.match(/SCORE:\s*(\d{1,3})/i);
  const reasonMatch = text.match(/REASON:\s*([\s\S]+)/i);
  const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10))) : NaN;
  if (Number.isNaN(score)) throw new Error("Could not read an AI score from the response.");
  return { score, reason: (reasonMatch?.[1] ?? "").trim().slice(0, 500), provider };
}

/** One-shot lead brief: a short summary + the single best next action. */
export async function aiLeadBrief(context: string): Promise<{ summary: string; nextAction: string; provider: string }> {
  const { text, provider } = await complete({
    system: `${BRAND_CONTEXT}\n\nYou are an assistant to the sales team. Be concise and practical.`,
    prompt: `From the lead record below, produce a briefing. Respond in EXACTLY this format:\nSUMMARY: <2-3 sentences: who they are, what they want, how warm they are>\nNEXT: <the single best next action the rep should take, one sentence, specific>\n\nLead:\n${context}`,
    maxTokens: 700,
  });
  const s = text.match(/SUMMARY:\s*([\s\S]*?)(?:\nNEXT:|$)/i);
  const n = text.match(/NEXT:\s*([\s\S]+)/i);
  return {
    summary: (s?.[1] ?? text).trim().slice(0, 1200),
    nextAction: (n?.[1] ?? "").trim().slice(0, 400),
    provider,
  };
}
