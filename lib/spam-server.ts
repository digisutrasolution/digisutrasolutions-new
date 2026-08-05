import "server-only";
import { scoreSpam, type SpamAssessment, type SpamInput } from "@/lib/spam";

/* Server-only half of the anti-spam pass: IP velocity plus the one helper the
   capture routes call. Velocity is tracked separately from lib/rate-limit so
   scoring never consumes a visitor's rate-limit budget — the two answer
   different questions ("too many requests?" vs "does this look automated?"). */

const VELOCITY_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

/** Record this submission and return how many came from the same IP *before*
    it, so a first-time visitor is never scored against their own request. */
function noteAndCount(ip: string): number {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < VELOCITY_WINDOW_MS);
  const before = recent.length;
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 10_000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= VELOCITY_WINDOW_MS)) hits.delete(k);
    }
  }
  return before;
}

/** Score one public submission. Never throws — a scoring failure must not cost
    a lead, so anything unexpected degrades to "clean". */
export function assessSubmission(
  input: Omit<SpamInput, "recentFromIp">,
  ip: string,
): SpamAssessment {
  try {
    return scoreSpam({ ...input, recentFromIp: noteAndCount(ip) });
  } catch {
    return { score: 0, flags: [], verdict: "clean" };
  }
}
