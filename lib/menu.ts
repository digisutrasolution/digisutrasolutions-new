import type { MenuItem } from "@prisma/client";
import { db } from "@/lib/db";
import { MENU_LOCATIONS, type MenuLocation } from "@/lib/menu-locations";

/* Dynamic navigation. Admin edits MenuItem rows (the draft tree); publishing
   serializes them into SiteSetting "menu:<location>:live", which is what the
   public site renders. DEFAULT_NAV is the fallback when nothing is published
   AND the bootstrap used to seed MenuItem rows the first time /admin/menus
   loads — navigation can never come up empty. */

export { MENU_LOCATIONS, type MenuLocation };

export const MENU_LOCATION = "HEADER";

export const liveKey = (location: string) => `menu:${location}:live`;
export const dirtyKey = (location: string) => `menu:${location}:dirty`;

export type NavChild = {
  label: string;
  href: string;
  icon?: string;
  group?: string;
  badge?: string;
  description?: string;
  newTab?: boolean;
};

export type NavNode = {
  label: string;
  href: string;
  tagline?: string;
  cols?: number;
  panelImage?: string;
  featured?: boolean;
  newTab?: boolean;
  children?: NavChild[];
};

/* Seeded default — Services grouped into three lanes (main-services
   recommendation); the tail lives behind "All services". */
export const DEFAULT_NAV: NavNode[] = [
  {
    label: "About",
    href: "/about",
    tagline: "15+ years. 100+ brands. 7 regions globally.\nBuilt on trust, driven by results.",
    cols: 2,
    panelImage: "/menu-images/about-digisutrasolution.webp",
    children: [
      { label: "Who We Are", href: "/about", icon: "building2" },
      { label: "Why Choose Us", href: "/about/why-choose-us", icon: "badgeCheck" },
      { label: "Global Presence", href: "/about/global-presence", icon: "earth" },
      { label: "Technology & Innovation", href: "/about/technology", icon: "cpu" },
      { label: "Certifications & Partners", href: "/about/certifications", icon: "shieldCheck" },
      { label: "Trust Center", href: "/trust-center", icon: "lock" },
      { label: "Life At Digisutra", href: "/about/life", icon: "heartHandshake" },
      { label: "CSR & Community Impact", href: "/about/csr", icon: "sprout" },
    ],
  },
  {
    label: "Services",
    href: "/services",
    tagline: "Full-spectrum digital marketing.\n18 services, one growth partner.",
    panelImage: "/menu-images/services-stock.jpg",
    children: [
      { label: "SEO + AI Search Optimization", href: "/services/seo-ai-search", icon: "search", badge: "AEO · GEO", group: "Growth", description: "Rank on Google — and get cited by AI answers" },
      { label: "Performance Marketing", href: "/services/performance-marketing", icon: "trendingUp", group: "Growth", description: "Google, Meta & LinkedIn ads run for ROAS" },
      { label: "AI Automation", href: "/services/ai-automation", icon: "bot", badge: "NEW", group: "AI & Systems", description: "Bots that capture and qualify leads 24/7" },
      { label: "CRM & Lead Management", href: "/services/crm-lead-management", icon: "database", group: "AI & Systems", description: "Every lead tracked — nothing slips" },
      { label: "Website Design & Development", href: "/services/website-design-development", icon: "monitorSmartphone", group: "Build & Brand", description: "Fast, SEO-ready sites and stores" },
      { label: "Mobile App Development", href: "/services/mobile-app-development", icon: "smartphone", group: "Build & Brand", description: "Android & iOS from one codebase" },
      { label: "Branding & UI/UX", href: "/services/branding-ui-ux", icon: "palette", group: "Build & Brand", description: "Identity and interfaces people trust" },
    ],
  },
  {
    label: "Work",
    href: "/work",
    tagline: "100+ brands. $1B+ revenue\ngenerated for clients.",
    cols: 2,
    panelImage: "/menu-images/work.webp",
    children: [
      { label: "Our Clients", href: "/work/clients", icon: "users" },
      { label: "Case Studies", href: "/work/case-studies", icon: "briefcase" },
      { label: "Results", href: "/work/results", icon: "trophy" },
      { label: "Portfolio", href: "/work/portfolio", icon: "images" },
      { label: "Strategy & Consulting", href: "/work/strategy-consulting", icon: "target" },
      { label: "Solutions", href: "/solutions", icon: "building2" },
    ],
  },
  {
    label: "Resources",
    href: "/resources",
    tagline: "132 free tools live.\nUse them. Grow. No account needed.",
    cols: 3,
    panelImage: "/menu-images/resources.webp",
    children: [
      { label: "SEO Audit", href: "/resources/seo-audit", icon: "fileSearch" },
      { label: "SSL Checker", href: "/resources/ssl-checker", icon: "lock" },
      { label: "QR Code Generator", href: "/resources/qr-code-generator", icon: "qrCode" },
      { label: "GST Calculator", href: "/resources/gst-calculator", icon: "calculator" },
      { label: "Invoice Generator", href: "/resources/invoice-generator", icon: "fileText" },
      { label: "Privacy Policy Generator", href: "/resources/privacy-policy-generator", icon: "scrollText" },
      { label: "Pomodoro Timer", href: "/resources/pomodoro-timer", icon: "timer" },
      { label: "Resume Builder", href: "/resources/resume-builder", icon: "filePen" },
      { label: "AI Blog Writer", href: "/resources/ai-blog-writer", icon: "penTool" },
      { label: "Keyword Research", href: "/resources/keyword-ideas", icon: "search" },
      { label: "Domain Authority Checker", href: "/resources/domain-authority-checker", icon: "award" },
      { label: "Google Business Profile Audit", href: "/resources/google-business-profile-audit", icon: "mapPin" },
      { label: "ROI Calculator", href: "/resources/roi-calculator", icon: "trendingUp" },
      { label: "Business Name Generator", href: "/resources/brand-name-generator", icon: "wandSparkles" },
      { label: "AI Chatbot Builder", href: "/resources/ai-chatbot-builder", icon: "bot" },
      { label: "Google Review Link Generator", href: "/resources/google-review-link", icon: "star" },
      { label: "KPI Dashboard", href: "/resources/kpi-dashboard", icon: "chartColumn" },
      { label: "CSV Cleaner", href: "/resources/csv-cleaner", icon: "fileSpreadsheet" },
      { label: "→ View All 132 Free Tools", href: "/resources", icon: "wrench" },
    ],
  },
  {
    label: "Newsroom",
    href: "/news-media",
    tagline: "Insights, trends & stories\nfrom the world of digital marketing.",
    cols: 2,
    panelImage: "/menu-images/newsroom.webp",
    children: [
      { label: "Blog", href: "/blog", icon: "bookOpen" },
      { label: "Latest News", href: "/news-media/latest-news", icon: "newspaper" },
      { label: "Industry Insights", href: "/news-media/industry-insights", icon: "lightbulb" },
      { label: "Marketing Trends", href: "/news-media/marketing-trends", icon: "chartLine" },
      { label: "Podcasts & Interviews", href: "/news-media/podcasts", icon: "micVocal" },
      { label: "Events & Webinars", href: "/news-media/events", icon: "calendarDays" },
      { label: "Awards & Recognition", href: "/news-media/awards", icon: "award" },
    ],
  },
  { label: "Pricing", href: "/pricing" },
  { label: "Career", href: "/career" },
  { label: "Referral", href: "/referral-program" },
];

/* Footer columns — mirrors the previously hardcoded Footer lists. A column's
   own href powers its "See All … →" link (use "#" to skip it). */
export const DEFAULT_FOOTER_NAV: NavNode[] = [
  {
    label: "Services",
    href: "/services",
    children: [
      { label: "SEO + AI Search Optimization", href: "/services/seo-ai-search" },
      { label: "Performance Marketing", href: "/services/performance-marketing" },
      { label: "AI Automation", href: "/services/ai-automation" },
      { label: "CRM & Lead Management", href: "/services/crm-lead-management" },
      { label: "Website Design & Development", href: "/services/website-design-development" },
      { label: "Mobile App Development", href: "/services/mobile-app-development" },
      { label: "Branding & UI/UX", href: "/services/branding-ui-ux" },
    ],
  },
  {
    label: "Company",
    href: "#",
    children: [
      { label: "About Us", href: "/about" },
      { label: "Our Work", href: "/work/portfolio" },
      { label: "Pricing", href: "/pricing" },
      { label: "Career", href: "/career" },
      { label: "Referral Program", href: "/referral-program" },
      { label: "Payment Options", href: "/payment" },
      { label: "Blog", href: "/blog" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
];

export const DEFAULT_FOOTER_LEGAL_NAV: NavNode[] = [
  { label: "Locations", href: "/about/global-presence" },
  { label: "Trust Center", href: "/trust-center" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms-and-conditions" },
  { label: "Cookie Policy", href: "/cookie-policy" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Disclaimer", href: "/disclaimer" },
  { label: "Sitemap", href: "/sitemap" },
];

export const DEFAULT_NAV_BY_LOCATION: Record<MenuLocation, NavNode[]> = {
  HEADER: DEFAULT_NAV,
  FOOTER: DEFAULT_FOOTER_NAV,
  FOOTER_LEGAL: DEFAULT_FOOTER_LEGAL_NAV,
};

/** Draft MenuItem rows → NavNode tree (admin preview + publish source). */
export function itemsToTree(items: MenuItem[], opts?: { includeHidden?: boolean }): NavNode[] {
  const keep = (i: MenuItem) => opts?.includeHidden || i.visible;
  const byOrder = (a: MenuItem, b: MenuItem) => a.order - b.order;
  return items
    .filter((i) => !i.parentId)
    .filter(keep)
    .sort(byOrder)
    .map((top) => {
      const kids = items
        .filter((i) => i.parentId === top.id)
        .filter(keep)
        .sort(byOrder)
        .map((c) => ({
          label: c.label,
          href: c.href,
          ...(c.icon ? { icon: c.icon } : {}),
          ...(c.group ? { group: c.group } : {}),
          ...(c.badge ? { badge: c.badge } : {}),
          ...(c.description ? { description: c.description } : {}),
          ...(c.newTab ? { newTab: true } : {}),
        }));
      return {
        label: top.label,
        href: top.href,
        ...(top.tagline ? { tagline: top.tagline } : {}),
        ...(top.panelImage ? { panelImage: top.panelImage } : {}),
        ...(top.featured ? { featured: true } : {}),
        ...(top.newTab ? { newTab: true } : {}),
        ...(kids.length ? { children: kids } : {}),
      };
    });
}

/** Published nav for a location — snapshot first, defaults otherwise. */
export async function getLiveNav(
  location: MenuLocation = MENU_LOCATION,
): Promise<NavNode[]> {
  try {
    const row = await db.siteSetting.findUnique({ where: { key: liveKey(location) } });
    const nav = row?.value as NavNode[] | undefined;
    if (Array.isArray(nav) && nav.length > 0) return nav;
  } catch {
    /* DB down → static nav keeps the site navigable */
  }
  return DEFAULT_NAV_BY_LOCATION[location] ?? [];
}

export type FeaturedPost = {
  slug: string;
  title: string;
  coverUrl: string | null;
  category: string;
};

/** Latest published post for the mega panel's featured card. */
export async function getFeaturedPost(): Promise<FeaturedPost | null> {
  try {
    return await db.blogPost.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      select: { slug: true, title: true, coverUrl: true, category: true },
    });
  } catch {
    return null;
  }
}
