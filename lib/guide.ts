/* Client-safe Team Guide document. Stored in SiteSetting "guide" and edited
   from /admin/guide; rendered with the shared BlogBody markdown renderer
   (## / ### headings, **bold**, *italic*, - bullets, [links]). */

export type GuideDoc = {
  title: string;
  body: string;
};

export const DEFAULT_GUIDE: GuideDoc = {
  title: "DigiSutra CRM — Team Guide",
  body: `Welcome! This is the how-to for the DigiSutra admin + CRM. It's editable — anyone with settings access can hit **Edit** at the top and update it, no developer needed.

## Getting started

- **Sign in** at /admin with your email and password. Sessions keep you logged in and refresh silently.
- The **left sidebar** groups everything: Lead Management, Content, Site setup, Audience and System.
- Top-right: the **🔔 bell** (new leads, comments), the **?** help button (explains the page you're on), a **light/dark** toggle, and **View site**.
- Stuck on any page? Click the **?** — it shows help for exactly that screen and links back here.

## Lead Management

Everything sales lives under **Lead Management**.

### Overview
Your daily start: new leads, what's due today, and how the pipeline is spread across stages. Jump into any lead or follow-up from here.

### Leads
Your working list of every enquiry. Search and filter by status, priority, source, owner or score, then open a lead to work it. Switch to the **board** to drag leads through the pipeline.

### Follow-ups
Every scheduled next step in one calendar — overdue, today and upcoming are colour-coded. Mark done or reschedule in a click. Overdue items auto-remind and escalate to managers.

### Quotations
Build priced proposals: add line items, apply GST and discounts, send for approval, and share as a PDF. Editing an approved quote makes a new version so history is kept.

### Activity
A single timeline of everything that happened across your leads — status changes, notes, calls, emails, messages, follow-ups, scoring and files. Filter by type, teammate or date.

## Working a lead

Open a lead to see and change:

- **Status** — where it is in the pipeline (New → Contacted → Qualified → Won/Lost…).
- **Priority** — Low / Medium / High / Urgent.
- **Score & band** — auto-scored 0–100 into **Hot / Warm / Cold** from signals like source, budget and engagement.
- **Owner** — who's responsible. Assignment rules can route new leads automatically.
- **Verified** — a green badge shows when the lead confirmed their email or phone by one-time code. Verified leads are more trustworthy and score higher.
- **Notes & Activity** — log calls and notes; everything is timestamped on the timeline.

## Messaging a lead

From a lead, use **Send a message**. The tabs you see depend on which channels are switched on:

- **Email** — sent from your CRM using your SMTP, open-tracked.
- **WhatsApp** — opens wa.me with your message pre-filled.
- **SMS** — sent through your own SMS gateway.
- **Telegram** — opens t.me and copies your message to paste.

Start from a **template** to stay fast and on-brand (Templates live under System → Templates).

## Verifying leads

**Verification** (System) asks visitors to confirm their email or phone with a one-time code on the public forms. It's soft — the lead is always captured; verifying just adds a badge and a score boost. Auto-picks SMS when a phone is given, else email. Send a test code before switching it on.

## Contact channels

**Channels** (System) turns each channel on/off and previews what your team will see in the composer. SMS and Telegram need a bit of setup (gateway / bot token); Email and WhatsApp work out of the box.

## AI helpers

Where you see a **✨ sparkle**, the CRM can help — draft a reply, summarise a lead, score it, or flag likely duplicates. The **AI providers** page (System) sets which AI answers and in what order, with a free fallback so it keeps working.

## Roles & users

- **Users** (System) — add team members, set their role, activate/deactivate access.
- **Roles** (System) — control exactly what each role can see and do; create custom roles like *Sales Member*. "Lead visibility" decides whether a role sees all leads or only their own. Super Admin always has full access.

## Settings

**Settings** (System) holds site-wide config — business details, email (SMTP), the SMS gateway, contact page, payments and more. Each section has its own tab.

## Tips & FAQ

- **A lead's missing?** Check your filters, and remember scoped roles only see their own assigned leads.
- **Email/SMS not sending?** Check the provider is configured (Settings → email / SMS) and shows *ready*.
- **Change is not showing?** Hard-refresh (Ctrl+Shift+R) — the browser caches aggressively.
- **Need more help?** Use the **?** button on any page, or ask your admin.`,
};

const str = (v: unknown, fallback: string) => (typeof v === "string" && v.trim() ? v : fallback);

export function mergeGuide(raw: unknown): GuideDoc {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    title: str(r.title, DEFAULT_GUIDE.title).slice(0, 160),
    body: str(r.body, DEFAULT_GUIDE.body).slice(0, 100_000),
  };
}
