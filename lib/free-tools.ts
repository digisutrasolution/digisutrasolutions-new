/* Free-tools catalog. Every slug here is already linked from the Resources
   menu, so each one must resolve to a real page: "live" tools have their
   own route, everything else renders the shared "in the works" page (and
   is noindexed) instead of a 404. Flip a tool to live when its route
   ships. */

export type ToolStatus = "live" | "soon";

export type Tool = {
  slug: string;
  name: string;
  blurb: string;
  icon: string;
  group: string;
  status: ToolStatus;
};

export const TOOLS: Tool[] = [
  {
    slug: "roi-calculator",
    name: "Marketing ROI Calculator",
    blurb: "See the enquiries, orders and revenue a monthly budget could return.",
    icon: "trendingUp",
    group: "Growth & SEO",
    status: "live",
  },
  {
    slug: "seo-audit",
    name: "SEO Audit",
    blurb: "A 15-page report on SEO, speed, UX and conversion — in 48 hours.",
    icon: "fileSearch",
    group: "Growth & SEO",
    status: "live",
  },
  {
    slug: "keyword-ideas",
    name: "Keyword Research",
    blurb: "Find the searches your buyers actually type.",
    icon: "search",
    group: "Growth & SEO",
    status: "live",
  },
  {
    slug: "domain-authority-checker",
    name: "Domain Authority Checker",
    blurb: "Check how much authority a domain carries.",
    icon: "award",
    group: "Growth & SEO",
    status: "live",
  },
  {
    slug: "google-business-profile-audit",
    name: "Google Business Profile Audit",
    blurb: "Score your local listing and find what's missing.",
    icon: "mapPin",
    group: "Growth & SEO",
    status: "live",
  },
  {
    slug: "google-review-link",
    name: "Google Review Link Generator",
    blurb: "Turn your listing into a one-tap review link.",
    icon: "star",
    group: "Growth & SEO",
    status: "live",
  },
  {
    slug: "gst-calculator",
    name: "GST Calculator",
    blurb: "Add or strip GST at any slab, with the split shown.",
    icon: "calculator",
    group: "Business admin",
    status: "live",
  },
  {
    slug: "invoice-generator",
    name: "Invoice Generator",
    blurb: "Create a clean GST invoice and download it.",
    icon: "fileText",
    group: "Business admin",
    status: "live",
  },
  {
    slug: "privacy-policy-generator",
    name: "Privacy Policy Generator",
    blurb: "Draft a policy for your site in a few clicks.",
    icon: "scrollText",
    group: "Business admin",
    status: "live",
  },
  {
    slug: "resume-builder",
    name: "Resume Builder",
    blurb: "Build a clean, ATS-friendly resume.",
    icon: "filePen",
    group: "Business admin",
    status: "live",
  },
  {
    slug: "csv-cleaner",
    name: "CSV Cleaner",
    blurb: "Tidy messy exports before you import them.",
    icon: "fileSpreadsheet",
    group: "Business admin",
    status: "live",
  },
  {
    slug: "kpi-dashboard",
    name: "KPI Dashboard",
    blurb: "Track the numbers that matter in one view.",
    icon: "chartColumn",
    group: "Business admin",
    status: "live",
  },
  {
    slug: "qr-code-generator",
    name: "QR Code Generator",
    blurb: "Make a QR code for any link, menu or UPI ID.",
    icon: "qrCode",
    group: "Build & create",
    status: "live",
  },
  {
    slug: "ssl-checker",
    name: "SSL Checker",
    blurb: "Confirm your certificate is valid and not expiring.",
    icon: "lock",
    group: "Build & create",
    status: "live",
  },
  {
    slug: "brand-name-generator",
    name: "Business Name Generator",
    blurb: "Get name ideas with domains worth checking.",
    icon: "wandSparkles",
    group: "Build & create",
    status: "live",
  },
  {
    slug: "ai-blog-writer",
    name: "AI Blog Writer",
    blurb: "Draft an outline or article from a topic.",
    icon: "penTool",
    group: "AI tools",
    status: "live",
  },
  {
    slug: "ai-chatbot-builder",
    name: "AI Chatbot Builder",
    blurb: "Sketch a chatbot flow for your business.",
    icon: "bot",
    group: "AI tools",
    status: "live",
  },
  {
    slug: "pomodoro-timer",
    name: "Pomodoro Timer",
    blurb: "Focus in 25-minute blocks.",
    icon: "timer",
    group: "Build & create",
    status: "live",
  },
];

export const TOOL_GROUPS = ["Growth & SEO", "Business admin", "Build & create", "AI tools"];

export const liveTools = () => TOOLS.filter((t) => t.status === "live");
export const findTool = (slug: string) => TOOLS.find((t) => t.slug === slug) ?? null;
