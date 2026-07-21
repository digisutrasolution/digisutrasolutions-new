import { z } from "zod";
import { db } from "@/lib/db";

/* Proactive DigiSutra Bot greeting ("nudge"). A small bubble appears beside
   the launcher after a delay or a scroll depth, carrying a message matched
   to the page. Everything here is admin-editable in /admin/settings, so
   copy and timing can change without a deploy. */

export const NudgeRuleSchema = z.object({
  /** Path prefix; "/" is the fallback for every page. */
  path: z.string().trim().min(1).max(120),
  text: z.string().trim().min(4).max(160),
});

export const BotNudgeSchema = z.object({
  enabled: z.boolean(),
  delaySeconds: z.number().int().min(5).max(180),
  scrollPercent: z.number().int().min(0).max(100),
  rules: z.array(NudgeRuleSchema).max(12),
});

export type NudgeRule = z.infer<typeof NudgeRuleSchema>;
export type BotNudge = z.infer<typeof BotNudgeSchema>;

/** Pages where a nudge would interrupt someone already converting. */
export const NUDGE_EXCLUDED_PATHS = ["/contact"];

/** Dismissals are remembered for a week. */
export const NUDGE_COOLDOWN_DAYS = 7;

export const DEFAULT_BOT_NUDGE: BotNudge = {
  enabled: true,
  delaySeconds: 15,
  scrollPercent: 40,
  rules: [
    { path: "/pricing", text: "Not sure which plan fits? Tell me your budget and I'll pick one." },
    { path: "/services", text: "Want to know what this would cost for your business?" },
    { path: "/work", text: "Want results like these? I can set up your free audit." },
    { path: "/blog", text: "Want this done for you? Free 15-page audit, in 48 hours." },
    { path: "/payment", text: "Questions about payment, invoices or GST? Ask me." },
    { path: "/free-tools", text: "Want a human to read these numbers with you?" },
    { path: "/", text: "Want the free 15-page audit? I can set it up in 30 seconds." },
  ],
};

export async function getBotNudge(): Promise<BotNudge> {
  try {
    const row = await db.siteSetting.findUnique({ where: { key: "botNudge" } });
    const parsed = BotNudgeSchema.safeParse(row?.value);
    if (parsed.success) return parsed.data;
  } catch {
    /* DB down → defaults keep the bot behaving predictably */
  }
  return DEFAULT_BOT_NUDGE;
}

/** Longest matching path prefix wins; returns null when nothing matches. */
export function nudgeTextFor(nudge: BotNudge, pathname: string): string | null {
  const matches = nudge.rules
    .filter((r) => pathname === r.path || pathname.startsWith(r.path === "/" ? "/" : `${r.path}`))
    .sort((a, b) => b.path.length - a.path.length);
  return matches[0]?.text ?? null;
}
