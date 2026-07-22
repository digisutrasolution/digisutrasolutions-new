import { Briefcase, LifeBuoy, MessageCircle } from "lucide-react";

/**
 * The three enquiry desks. `email` decides where an enquiry is routed, so
 * picking a department in the form changes the inbox it lands in — a
 * selector that does not change the destination is decoration.
 */
export const DEPARTMENTS = [
  {
    key: "SALES",
    label: "Sales enquiries",
    short: "Sales",
    blurb: "New projects, quotations, partnerships and business consultations.",
    email: "sales@digisutrasolutions.com",
    phone: "+91-120-475-1439",
    phoneHref: "tel:+911204751439",
    icon: Briefcase,
  },
  {
    key: "SUPPORT",
    label: "Technical support",
    short: "Support",
    blurb: "Existing clients needing technical assistance, maintenance or support.",
    email: "support@digisutrasolutions.com",
    phone: "+91-120-475-1447",
    phoneHref: "tel:+911204751447",
    icon: LifeBuoy,
  },
  {
    key: "GENERAL",
    label: "General enquiries",
    short: "General",
    blurb: "Anything else — we will point you to the right person.",
    email: "Info@digisutrasolutions.com",
    phone: "+91-120-475-1400",
    phoneHref: "tel:+911204751400",
    icon: MessageCircle,
  },
] as const;

export type DepartmentKey = (typeof DEPARTMENTS)[number]["key"];

export const DEPARTMENT_KEYS = DEPARTMENTS.map((d) => d.key) as [
  DepartmentKey,
  ...DepartmentKey[],
];

export function departmentEmail(key?: string | null) {
  return (
    DEPARTMENTS.find((d) => d.key === key)?.email ??
    "Info@digisutrasolutions.com"
  );
}

/** Attribution options. "Other" is last so the common answers come first. */
export const HEARD_FROM = [
  "Google search",
  "AI assistant (ChatGPT, Gemini…)",
  "Referral from a client",
  "LinkedIn",
  "Instagram or Facebook",
  "WhatsApp",
  "YouTube",
  "Event or webinar",
  "Other",
];
