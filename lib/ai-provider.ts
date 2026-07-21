import { generate as anthropicGenerate, isConfigured as anthropicConfigured } from "@/lib/ai";

/* Provider-agnostic text generation for the PUBLIC free tools.

   Order of preference:
     1. Google Gemini  — GEMINI_API_KEY (has a free tier, so the tools can
        run without spending anything)
     2. Anthropic      — ANTHROPIC_API_KEY (already used by the admin
        assistant and DigiSutra Bot; reused here if present)
     3. null           — the caller falls back to a deterministic template,
        so every tool still returns something useful with no keys at all.

   The admin content assistant (lib/ai.ts) deliberately stays Claude-only;
   this module exists so public tools are never blocked on a paid key. */

export type AiSource = "gemini" | "anthropic" | "template";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

export function aiProvider(): AiSource {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (anthropicConfigured()) return "anthropic";
  return "template";
}

async function viaGemini(system: string, prompt: string, maxTokens: number): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
        }),
        signal: AbortSignal.timeout(20000),
      },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("")
      .trim();
    return text || null;
  } catch {
    return null;
  }
}

async function viaAnthropic(prompt: string): Promise<string | null> {
  if (!anthropicConfigured()) return null;
  try {
    // Reuses the existing brand-voice system prompt from lib/ai.ts.
    return await anthropicGenerate("blog_outline", prompt);
  } catch {
    return null;
  }
}

/** Returns generated text plus which engine produced it. Never throws. */
export async function generateText(opts: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<{ text: string | null; source: AiSource }> {
  const maxTokens = opts.maxTokens ?? 900;

  const gemini = await viaGemini(opts.system, opts.prompt, maxTokens);
  if (gemini) return { text: gemini, source: "gemini" };

  const claude = await viaAnthropic(`${opts.system}\n\n${opts.prompt}`);
  if (claude) return { text: claude, source: "anthropic" };

  return { text: null, source: "template" };
}
