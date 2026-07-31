import "server-only";
import { db } from "@/lib/db";
import { AI_PROVIDER_IDS, mergeAiConfig, type AiConfig, type AiProviderId } from "@/lib/ai-config";

const KEY = "ai";
const TTL_MS = 15_000;
let cached: AiConfig | null = null;
let loadedAt = 0;

export async function getAiConfig(force = false): Promise<AiConfig> {
  if (!force && cached && Date.now() - loadedAt < TTL_MS) return cached;
  try {
    const row = await db.siteSetting.findUnique({ where: { key: KEY } });
    cached = mergeAiConfig(row?.value);
  } catch {
    cached = mergeAiConfig(null);
  }
  loadedAt = Date.now();
  return cached;
}

export async function saveAiConfig(raw: unknown): Promise<AiConfig> {
  const clean = mergeAiConfig(raw);
  await db.siteSetting.upsert({ where: { key: KEY }, create: { key: KEY, value: clean }, update: { value: clean } });
  cached = clean;
  loadedAt = Date.now();
  return clean;
}

/** Whether each provider's credential is actually present (env key, or a URL
    from config/env for Ollama). Never returns the secret itself. */
export function providerAvailability(config: AiConfig): Record<AiProviderId, boolean> {
  return {
    claude: !!process.env.ANTHROPIC_API_KEY,
    ollama: !!(config.ollamaUrl || process.env.OLLAMA_URL),
    gemini: !!process.env.GEMINI_API_KEY,
  } as Record<AiProviderId, boolean>;
}

export const KNOWN_PROVIDERS = AI_PROVIDER_IDS;
