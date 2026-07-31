import Anthropic from "@anthropic-ai/sdk";
import { AI_KINDS, type AiKind } from "@/lib/ai-kinds";
import { AI_PROVIDER_META, type AiProviderId } from "@/lib/ai-config";
import { getAiConfig, providerAvailability } from "@/lib/ai-config-server";

export { AI_KINDS, type AiKind };

/**
 * AI layer with a provider fallback chain. Each request tries providers in the
 * admin-configured order until one succeeds, so the features degrade instead of
 * breaking. Order / enable / model live in the DB (admin); the API keys stay in
 * env. A provider runs only when enabled AND its credential is present.
 */
export const AI_MODEL = "claude-opus-4-8";

const BRAND_CONTEXT = `You write for DigiSutra Solutions, a digital marketing and
software development agency in India serving 12 countries. Tagline: "Your growth,
our sutra." Services: SEO, PPC (Google/Meta), social media, web & e-commerce
development, AI automation agents, UI/UX, email/SMS marketing, lead generation, AI chatbots and automation.
Voice: confident, direct, measurable-results-focused, warm but not fluffy.
Avoid buzzwords like "leverage", "seamless", "unlock", "empower".`;

type Msg = { system: string; prompt: string; maxTokens: number };
type RunOpts = { model: string; baseUrl?: string };

async function viaAnthropic({ system, prompt, maxTokens }: Msg, { model }: RunOpts): Promise<string> {
  const client = new Anthropic();
  const res = await client.messages.create({
    model: model || AI_MODEL,
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

async function viaOllama({ system, prompt, maxTokens }: Msg, { model, baseUrl }: RunOpts): Promise<string> {
  const base = (baseUrl ?? "").replace(/\/+$/, "");
  if (!base) throw new Error("No Ollama URL set.");
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model || "llama3.1",
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

async function viaGemini({ system, prompt, maxTokens }: Msg, { model }: RunOpts): Promise<string> {
  const key = process.env.GEMINI_API_KEY ?? "";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-2.0-flash"}:generateContent?key=${key}`,
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

const RUNNERS: Record<AiProviderId, (m: Msg, o: RunOpts) => Promise<string>> = {
  claude: viaAnthropic,
  ollama: viaOllama,
  gemini: viaGemini,
};

/** Best-effort sync check: is any provider credential present in the
    environment? The real per-request filtering (admin order/enable/model) runs
    inside complete(); this only gates the "AI not configured" 503. */
export function isConfigured(): boolean {
  return !!(process.env.ANTHROPIC_API_KEY || process.env.OLLAMA_URL || process.env.GEMINI_API_KEY);
}

/** Run a completion through the admin-configured fallback chain. Returns the
    text + which provider answered. Throws only if every provider in the chain
    fails or none is usable. */
export async function complete(m: Msg): Promise<{ text: string; provider: string }> {
  const config = await getAiConfig();
  const avail = providerAvailability(config);
  const ollamaUrl = config.ollamaUrl || process.env.OLLAMA_URL || "";
  const chain = config.providers.filter((p) => p.enabled && avail[p.id]);
  if (chain.length === 0) throw new Error("AI is not configured.");
  let lastErr: unknown = null;
  for (const p of chain) {
    try {
      const text = await RUNNERS[p.id](m, { model: p.model, baseUrl: ollamaUrl });
      return { text, provider: AI_PROVIDER_META[p.id].label };
    } catch (err) {
      lastErr = err;
      console.error(`AI provider ${p.id} failed:`, err instanceof Error ? err.message : err);
    }
  }
  throw new Error(lastErr instanceof Error ? lastErr.message : "All AI providers failed.");
}

/** Run a single provider (for the admin "Test" button). */
export async function testProvider(id: AiProviderId): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const config = await getAiConfig();
  const avail = providerAvailability(config);
  if (!avail[id]) return { ok: false, latencyMs: 0, error: AI_PROVIDER_META[id].cred === "url" ? "No Ollama URL set." : "No API key in env." };
  const model = config.providers.find((p) => p.id === id)?.model ?? "";
  const ollamaUrl = config.ollamaUrl || process.env.OLLAMA_URL || "";
  const t0 = Date.now();
  try {
    await RUNNERS[id]({ system: "You are a connection test.", prompt: "Reply with the single word: ok", maxTokens: 16 }, { model, baseUrl: ollamaUrl });
    return { ok: true, latencyMs: Date.now() - t0 };
  } catch (err) {
    return { ok: false, latencyMs: Date.now() - t0, error: err instanceof Error ? err.message : "failed" };
  }
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
