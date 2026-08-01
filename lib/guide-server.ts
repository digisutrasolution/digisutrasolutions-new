import "server-only";
import { db } from "@/lib/db";
import { mergeGuide, type GuideDoc } from "@/lib/guide";

const KEY = "guide";
const TTL_MS = 15_000;
let cached: GuideDoc | null = null;
let loadedAt = 0;

export async function getGuide(force = false): Promise<GuideDoc> {
  if (!force && cached && Date.now() - loadedAt < TTL_MS) return cached;
  try {
    const row = await db.siteSetting.findUnique({ where: { key: KEY } });
    cached = mergeGuide(row?.value);
  } catch {
    cached = mergeGuide(null);
  }
  loadedAt = Date.now();
  return cached;
}

export async function saveGuide(raw: unknown): Promise<GuideDoc> {
  const clean = mergeGuide(raw);
  await db.siteSetting.upsert({ where: { key: KEY }, create: { key: KEY, value: clean }, update: { value: clean } });
  cached = clean;
  loadedAt = Date.now();
  return clean;
}
