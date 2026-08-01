/* Client-safe help content for the admin panel. One registry powers both the
   context-aware Help drawer (matched by pathname) and any inline HelpTip that
   wants to reuse the same copy. Keep entries short and task-focused — the full
   walk-through lives in the published Team Guide (GUIDE_URL). */

/** The Team Guide now lives on-domain at /admin/guide (CMS-editable). Callers
    wrap this in withBase() so it resolves on subpath deployments. */
export const GUIDE_URL = "/admin/guide";

/** Optional in-page anchor appended when supplied. */
export const guideUrl = (anchor?: string) =>
  anchor ? `${GUIDE_URL}#${anchor}` : GUIDE_URL;

export type HelpTopic = {
  /** Pathname prefix this entry covers. Longest match wins. */
  match: string;
  title: string;
  summary: string;
  points: string[];
  /** Optional section anchor in the Team Guide. */
  guideAnchor?: string;
};

/* Ordered loosely; helpForPath() picks the longest-matching prefix, so more
   specific routes (e.g. /admin/leads/import) correctly beat /admin/leads. */
export const HELP_TOPICS: HelpTopic[] = [
  {
    match: "/admin/leads/activity",
    title: "Activity History",
    summary: "A single timeline of everything that has happened across your leads.",
    points: [
      "Every event is here — status changes, assignments, notes, calls, emails, WhatsApp, meetings, follow-ups, scoring, files and quotations.",
      "Filter by type, by team member (or “System” for automated events), by date range, or search the text.",
      "You only see activity on leads you're allowed to see; managers and admins see everything.",
      "Click a lead name to jump straight to that lead.",
    ],
  },
  {
    match: "/admin/leads/reports",
    title: "Reports",
    summary: "Charts and numbers on how the pipeline is performing.",
    points: [
      "Track leads by status, source, owner and score band over your chosen date range.",
      "Use it to spot where leads stall and which sources convert best.",
    ],
  },
  {
    match: "/admin/leads/scoring",
    title: "Lead scoring",
    summary: "Decide what makes a lead Hot, Warm or Cold.",
    points: [
      "Scores are built from signals (source, budget, engagement, and more) — turn signals on/off and set their weight.",
      "Set the thresholds for Hot and Warm; everything below is Cold.",
      "Optionally let AI suggest a score with a short rationale.",
      "Changes apply going forward; existing leads re-score as they're updated.",
    ],
  },
  {
    match: "/admin/leads/assignment",
    title: "Assignment rules",
    summary: "Auto-route new leads to the right person.",
    points: [
      "Rules run top-to-bottom — the first match wins, so order matters.",
      "Match on source, service, region or score, then assign to a person or round-robin a team.",
      "Leave a catch-all rule at the bottom so nothing lands unassigned.",
    ],
  },
  {
    match: "/admin/leads/import",
    title: "Import leads",
    summary: "Bring leads in from a spreadsheet.",
    points: [
      "Upload a CSV and map its columns to lead fields.",
      "Duplicates are detected on phone/email so you don't create the same lead twice.",
      "Review the preview before confirming — the import is logged in Activity.",
    ],
  },
  {
    match: "/admin/leads",
    title: "Leads",
    summary: "Your working list of every enquiry.",
    points: [
      "Search and filter by status, priority, source, owner or score, then open a lead to work it.",
      "Inside a lead: update status/priority, add notes, log calls, send email/WhatsApp, schedule follow-ups, attach files and build quotations.",
      "The score band (Hot/Warm/Cold) and owner show at a glance in the list.",
      "Switch to the board view to drag leads through the pipeline.",
    ],
  },
  {
    match: "/admin/crm",
    title: "Sales overview",
    summary: "Your daily starting point for sales.",
    points: [
      "See new leads, what's due today, and how the pipeline is spread across stages.",
      "Jump into any lead or follow-up directly from here.",
    ],
  },
  {
    match: "/admin/followups",
    title: "Follow-ups",
    summary: "Every scheduled next step, in one calendar.",
    points: [
      "Overdue, today and upcoming are colour-coded so nothing slips.",
      "Mark a follow-up done (or reschedule) right from the list.",
      "Reminders and manager escalation run automatically for overdue items.",
    ],
  },
  {
    match: "/admin/quotations",
    title: "Quotations",
    summary: "Build, approve and send priced proposals.",
    points: [
      "Add line items, apply GST and discounts, and the totals calculate for you.",
      "Send for approval when required; approved quotes can be shared as a PDF.",
      "Editing an approved quote creates a new version so history is kept.",
    ],
  },
  {
    match: "/admin/comms",
    title: "Message templates",
    summary: "Reusable email and WhatsApp messages.",
    points: [
      "Use placeholders like the lead's name so each message is personalised on send.",
      "Templates picked when messaging a lead keep your team on-brand and fast.",
    ],
  },
  {
    match: "/admin/channels",
    title: "Contact channels",
    summary: "Reach leads by SMS and Telegram, not just email/WhatsApp.",
    points: [
      "SMS uses your own gateway — the same one set up for OTP under Verification. Turn on “SMS messaging” to send from the lead composer.",
      "Telegram “lead outreach” shows a composer that opens t.me/@username and copies your message to paste (Telegram links can't prefill text).",
      "Telegram “team alerts” posts every new lead to your team chat via a bot — set TELEGRAM_BOT_TOKEN in .env and the chat id here, then Send test.",
      "All sends are logged on the lead's message history and Activity.",
    ],
  },
  {
    match: "/admin/developers",
    title: "Developers (API & webhooks)",
    summary: "Connect other tools to the CRM.",
    points: [
      "Create API keys to push leads in or read data out via the REST API.",
      "Add webhooks to get notified elsewhere when leads are created or change.",
      "Treat API keys like passwords — anyone with one can act as the CRM.",
    ],
  },
  {
    match: "/admin/ai",
    title: "AI providers",
    summary: "Which AI answers the CRM's AI helpers, and in what order.",
    points: [
      "The chain tries providers top-to-bottom; a provider is only used if it's enabled and its key/URL is set.",
      "Keep a free provider (Ollama) as a backup below your paid one so AI keeps working if credits run out.",
      "Use Test to confirm a provider responds before relying on it.",
      "Keys live in server settings (.env), never in the database.",
    ],
  },
  {
    match: "/admin/verification",
    title: "Lead verification",
    summary: "Confirm a lead's email or phone with a one-time code.",
    points: [
      "Turn it on to ask visitors for a 6-digit code on the public forms; leave it off and forms behave exactly as before.",
      "Auto picks SMS when a phone is given, else email. Verification is soft — the lead is always saved, verified or not.",
      "SMS goes through your own platform (HTTP now, SMPP coming) — passwords live in .env, endpoint details here.",
      "Use “Send a test code” to confirm delivery before switching it on.",
      "Verified leads get a green badge and a score boost so real enquiries rise to the top.",
    ],
  },
  {
    match: "/admin/roles",
    title: "Roles & permissions",
    summary: "Control what each person can see and do.",
    points: [
      "Pick a role on the left, then toggle its permissions on the right.",
      "Create custom roles (e.g. Sales Member) for exactly the access you want.",
      "“Lead visibility” decides whether a role sees all leads or only their own.",
      "Super Admin always has full access and can't be locked out.",
    ],
  },
  {
    match: "/admin/users",
    title: "Users",
    summary: "The people who can log in.",
    points: [
      "Add a team member, set their role, and activate/deactivate access.",
      "Assign leads to active users; deactivating someone keeps their history.",
    ],
  },
  {
    match: "/admin/settings",
    title: "Settings",
    summary: "Site-wide configuration.",
    points: ["Business details, integrations and defaults used across the panel live here."],
  },
  {
    match: "/admin/audit",
    title: "Audit log",
    summary: "A tamper-evident record of admin actions.",
    points: [
      "See who changed what and when across the whole panel.",
      "Use it to investigate unexpected changes or review access.",
    ],
  },
  {
    match: "/admin",
    title: "Admin dashboard",
    summary: "Your home base for the whole panel.",
    points: [
      "Use the sidebar to reach Lead Management, Content, Site setup, Audience and System tools.",
      "The Help button (top-right) always explains the page you're on.",
    ],
  },
];

/** Longest-prefix match for the current pathname. */
export function helpForPath(pathname: string): HelpTopic {
  let best = HELP_TOPICS[HELP_TOPICS.length - 1]; // the /admin fallback
  for (const t of HELP_TOPICS) {
    if (pathname.startsWith(t.match) && t.match.length > best.match.length) best = t;
  }
  return best;
}
