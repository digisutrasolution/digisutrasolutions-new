/* AI provider config — client-safe (no secrets, no server imports). The admin
   edits provider order / enable / model here; the actual API keys never live in
   this config, only in env. */

export const AI_PROVIDER_IDS = ["claude", "ollama", "gemini"] as const;
export type AiProviderId = (typeof AI_PROVIDER_IDS)[number];

export const AI_PROVIDER_META: Record<
  AiProviderId,
  { label: string; sub: string; cred: "key" | "url"; envVar?: string }
> = {
  claude: { label: "Claude", sub: "Anthropic — best quality", cred: "key", envVar: "ANTHROPIC_API_KEY" },
  ollama: { label: "Ollama", sub: "Self-hosted — free & private", cred: "url" },
  gemini: { label: "Gemini", sub: "Google — free tier", cred: "key", envVar: "GEMINI_API_KEY" },
};

export type AiProvider = { id: AiProviderId; enabled: boolean; model: string };
export type AiConfig = {
  /** Fallback order = array order. */
  providers: AiProvider[];
  ollamaUrl: string;
};

const DEFAULT_MODEL: Record<AiProviderId, string> = {
  claude: "claude-opus-4-8",
  ollama: "llama3.1",
  gemini: "gemini-2.0-flash",
};

export const DEFAULT_AI_CONFIG: AiConfig = {
  providers: AI_PROVIDER_IDS.map((id) => ({ id, enabled: true, model: DEFAULT_MODEL[id] })),
  ollamaUrl: "",
};

export const defaultModel = (id: AiProviderId) => DEFAULT_MODEL[id];

/** Sanitise stored/posted config: keep the 3 known providers in the given
    order, fill any missing, coerce fields. */
export function mergeAiConfig(raw: unknown): AiConfig {
  const r = (raw ?? {}) as Partial<AiConfig>;
  const seen = new Set<AiProviderId>();
  const providers: AiProvider[] = [];
  for (const p of Array.isArray(r.providers) ? r.providers : []) {
    const id = p?.id as AiProviderId;
    if (!AI_PROVIDER_IDS.includes(id) || seen.has(id)) continue;
    seen.add(id);
    providers.push({
      id,
      enabled: p?.enabled !== false,
      model: (typeof p?.model === "string" && p.model.trim()) || DEFAULT_MODEL[id],
    });
  }
  // Append any provider the stored config didn't mention (e.g. a new one).
  for (const id of AI_PROVIDER_IDS) {
    if (!seen.has(id)) providers.push({ id, enabled: true, model: DEFAULT_MODEL[id] });
  }
  return { providers, ollamaUrl: typeof r.ollamaUrl === "string" ? r.ollamaUrl.trim() : "" };
}
