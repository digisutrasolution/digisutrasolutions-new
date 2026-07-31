/* Communications — client-safe core. Channel vocabulary and the placeholder
   engine shared by the template editor, the lead composer and the server
   sender. No db/server imports. */

export const COMM_CHANNELS = ["EMAIL", "WHATSAPP"] as const;
export type CommChannel = (typeof COMM_CHANNELS)[number];

export const CHANNEL_LABEL: Record<CommChannel, string> = {
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
};

/** Placeholders offered in the editor, filled from the lead + sender at send. */
export const PLACEHOLDERS: { key: string; label: string }[] = [
  { key: "name", label: "Lead full name" },
  { key: "firstName", label: "Lead first name" },
  { key: "company", label: "Company" },
  { key: "email", label: "Email" },
  { key: "whatsapp", label: "WhatsApp number" },
  { key: "city", label: "City" },
  { key: "country", label: "Country" },
  { key: "services", label: "Services of interest" },
  { key: "budget", label: "Budget" },
  { key: "senderName", label: "Your name" },
  { key: "company_us", label: "Our company (DigiSutra Solutions)" },
];

export type CommVars = Record<string, string>;

/** Build the substitution map from a lead + the sending user. */
export function leadVars(
  lead: {
    name?: string | null;
    company?: string | null;
    email?: string | null;
    whatsapp?: string | null;
    city?: string | null;
    country?: string | null;
    services?: string[] | null;
    budget?: string | null;
  },
  senderName = "",
): CommVars {
  const name = (lead.name ?? "").trim();
  return {
    name,
    firstName: name.split(/\s+/)[0] ?? "",
    company: lead.company ?? "",
    email: lead.email ?? "",
    whatsapp: lead.whatsapp ?? "",
    city: lead.city ?? "",
    country: lead.country ?? "",
    services: (lead.services ?? []).join(", "),
    budget: lead.budget ?? "",
    senderName,
    company_us: "DigiSutra Solutions",
  };
}

/** Replace {{placeholders}} (whitespace-tolerant) with their values; unknown
    placeholders collapse to an empty string so nothing leaks raw braces. */
export function renderTemplate(text: string, vars: CommVars): string {
  return (text ?? "").replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : "",
  );
}

/** Digits-only phone for a wa.me link. */
export function waLink(phone: string, text: string): string {
  const num = (phone ?? "").replace(/[^\d]/g, "");
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}
