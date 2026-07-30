import { z } from "zod";

/* Admin-managed contact page content. Client-safe (no server imports) so the
   public LeadForm and the admin editor can both use it. The server loader is
   lib/contact-config-server.ts. Icons are stored by name (see DESK_ICONS) and
   mapped to components in the form. */

export const DESK_ICONS = [
  "briefcase",
  "lifebuoy",
  "message",
  "phone",
  "mail",
  "headset",
] as const;
export type DeskIcon = (typeof DESK_ICONS)[number];

export const DeskSchema = z.object({
  key: z.string().trim().min(1).max(24).regex(/^[A-Z0-9_]+$/, "Keys are UPPER_SNAKE_CASE."),
  label: z.string().trim().min(1).max(60),
  short: z.string().trim().min(1).max(24),
  cta: z.string().trim().min(1).max(40).default("Send message"),
  blurb: z.string().trim().max(200).default(""),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).default(""),
  icon: z.enum(DESK_ICONS).default("message"),
});
export type Desk = z.infer<typeof DeskSchema>;

const s = (max: number, def = "") => z.string().trim().max(max).default(def);

export const ContactSchema = z.object({
  // Left-panel copy
  eyebrow: s(60, "Contact us"),
  heading: s(80, "We're here to"),
  headingAccent: s(40, "help"),
  subheading: s(300, "Digital marketing, web development, AI automation and technical support — reach the right desk directly."),
  responsePromise: s(60, "under 2 hours"),
  responseNote: s(80, "Mon–Fri, 24-hour desk"),
  auditPromise: s(60, "15-page audit"),
  auditNote: s(60, "in 48 hours"),
  addressLine: s(160, "B-521, iThum Tower B, Sector 62, Noida — serving 12 countries"),
  hours: s(80, "Monday – Friday, 24 hours"),
  whatsappNumber: s(20, "919953900123"),
  whatsappDisplay: s(30, "+91-9953-900123"),
  usaTollFree: s(30, "+1-888-644-5402"),
  mapEmbedUrl: s(600, ""),
  // JSON-LD / SEO
  street: s(160, "B-521, iThum Tower B, Sector 62"),
  locality: s(80, "Noida"),
  region: s(80, "Uttar Pradesh"),
  country: s(4, "IN"),
  mainPhone: s(40, "+91-120-475-1400"),
  mainEmail: z.string().trim().max(200).default("Info@digisutrasolutions.com"),
  seoTitle: s(120, "Contact Us: Free 15-Page Growth Audit in 48 Hours"),
  seoDescription: s(320, "Talk to DigiSutra Solutions in Noida — reply within 2 business hours on WhatsApp, free 15-page website audit with every enquiry. +91-9953-900123."),
  desks: z.array(DeskSchema).min(1).max(6).default([
    { key: "SALES", label: "Sales enquiries", short: "Sales", cta: "Send my enquiry", blurb: "New projects, quotations, partnerships and business consultations.", email: "sales@digisutrasolutions.com", phone: "+91-120-475-1439", icon: "briefcase" },
    { key: "SUPPORT", label: "Technical support", short: "Support", cta: "Send support request", blurb: "Existing clients needing technical assistance, maintenance or support.", email: "support@digisutrasolutions.com", phone: "+91-120-475-1447", icon: "lifebuoy" },
    { key: "GENERAL", label: "General enquiries", short: "General", cta: "Send message", blurb: "Anything else — we will point you to the right person.", email: "Info@digisutrasolutions.com", phone: "+91-120-475-1400", icon: "message" },
  ]),
});

export type ContactConfig = z.infer<typeof ContactSchema>;

export const DEFAULT_CONTACT: ContactConfig = ContactSchema.parse({});

/** Routing: which inbox an enquiry with this department key goes to. No key
    (the contact form doesn't ask) routes to the main inbox, as before. */
export function deskEmail(config: ContactConfig, key?: string | null): string {
  if (!key) return config.mainEmail;
  return config.desks.find((d) => d.key === key)?.email ?? config.mainEmail;
}
