/* Client-safe CRM vocabulary — status/priority/source labels and badge styles,
   shared by the admin list, the detail page and API validation. No server
   imports so client components can use it. The activity-logging helper lives
   in lib/crm-server.ts. */

export const LEAD_STATUSES = [
  "NEW",
  "ATTEMPTED",
  "CONTACTED",
  "VERIFIED",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "FOLLOW_UP",
  "MEETING",
  "WON",
  "LOST",
  "SPAM",
  "DUPLICATE",
  "HOLD",
] as const;
export type LeadStatusKey = (typeof LEAD_STATUSES)[number];

export const STATUS_LABEL: Record<LeadStatusKey, string> = {
  NEW: "New",
  ATTEMPTED: "Attempted",
  CONTACTED: "Contacted",
  VERIFIED: "Verified",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal sent",
  NEGOTIATION: "Negotiation",
  FOLLOW_UP: "Follow-up",
  MEETING: "Meeting",
  WON: "Won",
  LOST: "Lost",
  SPAM: "Spam",
  DUPLICATE: "Duplicate",
  HOLD: "Hold",
};

export const STATUS_STYLE: Record<LeadStatusKey, string> = {
  NEW: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  ATTEMPTED: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  CONTACTED: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
  VERIFIED: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
  QUALIFIED: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  PROPOSAL: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  NEGOTIATION: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  FOLLOW_UP: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  MEETING: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  WON: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  LOST: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  SPAM: "bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
  DUPLICATE: "bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
  HOLD: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
};

/** Pipeline stages a lead can move through in the UI (excludes spam/dup/hold,
    which are dispositions set explicitly). */
export const PIPELINE_STATUSES: LeadStatusKey[] = [
  "NEW",
  "ATTEMPTED",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "FOLLOW_UP",
  "MEETING",
  "WON",
  "LOST",
];

export const LEAD_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type LeadPriorityKey = (typeof LEAD_PRIORITIES)[number];

export const PRIORITY_LABEL: Record<LeadPriorityKey, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const PRIORITY_STYLE: Record<LeadPriorityKey, string> = {
  LOW: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
  MEDIUM: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  HIGH: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  URGENT: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export const LEAD_SOURCES = [
  "CONTACT",
  "AUDIT",
  "ESTIMATOR",
  "SUTRABOT",
  "FORM",
  "WEBSITE",
  "SEO_AUDIT",
  "PPC",
  "LANDING",
  "WHATSAPP",
  "FACEBOOK",
  "INSTAGRAM",
  "GOOGLE_ADS",
  "LINKEDIN",
  "REFERRAL",
  "ORGANIC",
  "EMAIL_CAMPAIGN",
  "COLD_CALL",
  "WALK_IN",
  "TRADE_SHOW",
  "MANUAL",
  "API",
  "CSV_IMPORT",
] as const;
export type LeadSourceKey = (typeof LEAD_SOURCES)[number];

export const SOURCE_LABEL: Record<LeadSourceKey, string> = {
  CONTACT: "Contact form",
  AUDIT: "Free audit",
  ESTIMATOR: "Estimator",
  SUTRABOT: "Chatbot",
  FORM: "Dynamic form",
  WEBSITE: "Website",
  SEO_AUDIT: "SEO audit",
  PPC: "PPC",
  LANDING: "Landing page",
  WHATSAPP: "WhatsApp",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  GOOGLE_ADS: "Google Ads",
  LINKEDIN: "LinkedIn",
  REFERRAL: "Referral",
  ORGANIC: "Organic search",
  EMAIL_CAMPAIGN: "Email campaign",
  COLD_CALL: "Cold calling",
  WALK_IN: "Walk-in",
  TRADE_SHOW: "Trade show",
  MANUAL: "Manual entry",
  API: "API",
  CSV_IMPORT: "CSV import",
};

export const statusLabel = (s: string) => STATUS_LABEL[s as LeadStatusKey] ?? s;
export const sourceLabel = (s: string) => SOURCE_LABEL[s as LeadSourceKey] ?? s;
export const priorityLabel = (p: string) => PRIORITY_LABEL[p as LeadPriorityKey] ?? p;

/* ---- Activity timeline types (for the global Activity History) ---- */

export const ACTIVITY_TYPE_META: Record<string, { label: string; style: string }> = {
  created: { label: "Created", style: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" },
  status: { label: "Status", style: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300" },
  priority: { label: "Priority", style: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  assigned: { label: "Assigned", style: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300" },
  updated: { label: "Updated", style: "bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-300" },
  note: { label: "Note", style: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300" },
  call: { label: "Call", style: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" },
  email: { label: "Email", style: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" },
  whatsapp: { label: "WhatsApp", style: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" },
  meeting: { label: "Meeting", style: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300" },
  followup: { label: "Follow-up", style: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  score: { label: "Score", style: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300" },
  "ai-score": { label: "AI score", style: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300" },
  file: { label: "File", style: "bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-300" },
  quotation: { label: "Quotation", style: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300" },
};

/** Filterable activity types, in a sensible display order. */
export const ACTIVITY_TYPES = [
  "created", "status", "priority", "assigned", "updated",
  "note", "call", "email", "whatsapp", "meeting",
  "followup", "score", "ai-score", "file", "quotation",
] as const;

export const activityLabel = (t: string) => ACTIVITY_TYPE_META[t]?.label ?? t;
export const activityStyle = (t: string) =>
  ACTIVITY_TYPE_META[t]?.style ?? "bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-300";

/* ---- Follow-ups (Phase 3) ---- */

export const FOLLOWUP_TYPES = [
  "call",
  "whatsapp",
  "email",
  "meeting",
  "task",
] as const;
export type FollowUpTypeKey = (typeof FOLLOWUP_TYPES)[number];

export const FOLLOWUP_TYPE_LABEL: Record<FollowUpTypeKey, string> = {
  call: "Call",
  whatsapp: "WhatsApp",
  email: "Email",
  meeting: "Meeting",
  task: "Task",
};

export const FOLLOWUP_STATUSES = ["PENDING", "DONE", "CANCELLED"] as const;
export type FollowUpStatusKey = (typeof FOLLOWUP_STATUSES)[number];

export const FOLLOWUP_STATUS_LABEL: Record<FollowUpStatusKey, string> = {
  PENDING: "Pending",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

export const FOLLOWUP_STATUS_STYLE: Record<FollowUpStatusKey, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  DONE: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  CANCELLED: "bg-stone-200 text-stone-500 dark:bg-stone-800 dark:text-stone-400",
};

export const followUpTypeLabel = (t: string) =>
  FOLLOWUP_TYPE_LABEL[t as FollowUpTypeKey] ?? t;

/** How overdue a pending follow-up is, for at-a-glance urgency in the UI. */
export type DueBucket = "overdue" | "today" | "soon" | "later";

export function dueBucket(dueAtIso: string | Date, now = new Date()): DueBucket {
  const due = new Date(dueAtIso);
  const startOfTomorrow = new Date(now);
  startOfTomorrow.setHours(24, 0, 0, 0);
  if (due.getTime() < now.getTime()) return "overdue";
  if (due.getTime() < startOfTomorrow.getTime()) return "today";
  const soon = new Date(now);
  soon.setDate(soon.getDate() + 3);
  if (due.getTime() < soon.getTime()) return "soon";
  return "later";
}

export const DUE_STYLE: Record<DueBucket, string> = {
  overdue: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  today: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  soon: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  later: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
};

export const DUE_LABEL: Record<DueBucket, string> = {
  overdue: "Overdue",
  today: "Today",
  soon: "Soon",
  later: "Upcoming",
};
