/* Deterministic fallbacks for the AI tools.

   These run when no AI key is configured, so the tools are useful for
   free, forever. They are honest scaffolds — structure and prompts a
   human fills in — not pretend-AI prose. */

const titleCase = (s: string) =>
  s.trim().replace(/\s+/g, " ").replace(/^./, (c) => c.toUpperCase());

/* ---------------- blog outline ---------------- */

export function blogOutlineTemplate(topic: string, keyword: string, audience: string): string {
  const t = titleCase(topic || "your topic");
  const kw = (keyword || topic).trim().toLowerCase();
  const who = audience.trim() || "business owners";

  return [
    `# ${t}: a practical guide for ${who}`,
    ``,
    `## What ${kw} actually means`,
    `Open with the plain-English answer in the first two sentences — this is the passage AI Overviews and featured snippets lift. Define the term, then say who it matters to.`,
    ``,
    `## Why it matters right now`,
    `One concrete cost of getting it wrong and one benefit of getting it right. Use a number you can defend.`,
    ``,
    `## How it works, step by step`,
    `Three to five numbered steps a reader could follow this week. Keep each step to two sentences.`,
    ``,
    `## What it costs in India`,
    `Give a realistic range and what moves the price. Concrete figures build more trust than "affordable".`,
    ``,
    `## Common mistakes to avoid`,
    `Three mistakes you genuinely see. Each one gets the fix in the same breath.`,
    ``,
    `## How to know it's working`,
    `The two or three metrics that prove progress, and roughly when to expect movement.`,
    ``,
    `## FAQ`,
    `Answer three real questions people type — each answer first, detail second.`,
    ``,
    `---`,
    `Close with one clear next step for the reader (an audit, a call, a checklist).`,
    ``,
    `Target keyword: ${kw} · Audience: ${who}`,
  ].join("\n");
}

/* ---------------- chatbot flow ---------------- */

export function chatbotFlowTemplate(business: string, goal: string): string {
  const b = business.trim() || "your business";
  const g = goal.trim() || "capture qualified enquiries";

  return [
    `CHATBOT FLOW — ${titleCase(b)}`,
    `Goal: ${g}`,
    ``,
    `1. GREETING`,
    `   "Hi! I'm the ${titleCase(b)} assistant. What can I help you with?"`,
    `   Quick replies: [Prices] [What you offer] [Talk to a human]`,
    ``,
    `2. QUALIFY (ask one at a time — never a form wall)`,
    `   Q1. "What are you looking for?"  → service list as buttons`,
    `   Q2. "Roughly what budget are you working with?" → 3 ranges`,
    `   Q3. "When do you want to start?" → This week / This month / Just exploring`,
    ``,
    `3. ANSWER`,
    `   Give the real starting price and one line on what's included.`,
    `   Never invent numbers — pull them from your live price list.`,
    ``,
    `4. CAPTURE`,
    `   "Want a human to take it from here? Name and WhatsApp number is all I need."`,
    `   Store: name, WhatsApp, chosen service, budget, timeline, full transcript.`,
    ``,
    `5. HANDOFF`,
    `   Hot lead (budget + timeline this month) → notify sales immediately.`,
    `   Everyone else → confirmation message + follow-up within 24 hours.`,
    ``,
    `6. FALLBACK (after two failed matches)`,
    `   "I'll get a human on this — WhatsApp us and we'll reply today."`,
    ``,
    `EDGE CASES TO HANDLE`,
    `   · Existing customer with a support question → route away from sales`,
    `   · Out-of-scope request → say so plainly and offer the human route`,
    `   · Out-of-hours → same flow; promise a reply time you can keep`,
  ].join("\n");
}

/* ---------------- keyword ideas (no AI needed) ---------------- */

const MODIFIERS = {
  Commercial: ["best", "top", "cheap", "affordable", "professional", "trusted"],
  "Cost & pricing": ["cost", "price", "pricing", "charges", "fees", "how much does {s} cost"],
  Local: ["in {city}", "near me", "{city} agency", "best in {city}", "services in {city}"],
  Comparison: ["vs", "alternatives", "or", "comparison", "which is better"],
  Questions: ["what is {s}", "how does {s} work", "is {s} worth it", "how to do {s}", "why {s}"],
  "Buyer intent": ["services", "agency", "company", "consultant", "for small business", "packages"],
};

export type KeywordGroup = { group: string; ideas: string[] };

export function keywordIdeas(seed: string, city: string): KeywordGroup[] {
  const s = seed.trim().toLowerCase();
  if (!s) return [];
  const c = city.trim() || "your city";
  return Object.entries(MODIFIERS).map(([group, mods]) => ({
    group,
    ideas: mods.map((m) =>
      m.includes("{s}")
        ? m.replace("{s}", s).replace("{city}", c)
        : m.includes("{city}")
          ? `${s} ${m.replace("{city}", c)}`
          : ["vs", "or"].includes(m)
            ? `${s} ${m} …`
            : `${m} ${s}`,
    ),
  }));
}
