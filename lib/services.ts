import { db } from "@/lib/db";

/* Dynamic service catalog. Admin edits DB rows directly (visible toggle
   gates the public site); these defaults seed the DB on first admin load
   and are the render fallback if the DB is empty/unreachable. */

export type OfferDef = {
  name: string;
  blurb?: string;
  highlight?: boolean;
};

export type ServiceDef = {
  slug: string;
  name: string;
  blurb: string;
  intro: string;
  icon: string;
  badge?: string;
  image?: string;
  stat?: string;
  statLabel?: string;
  priceFrom?: string;
  marketNote?: string;
  offers: OfferDef[];
};

export const DEFAULT_SERVICES: ServiceDef[] = [
  {
    slug: "seo-ai-search",
    name: "SEO + AI Search Optimization",
    blurb: "Rank on Google and get cited by ChatGPT, Gemini and AI Overviews.",
    intro:
      "We get your business found on Google and inside AI answers. Retainers cover technical SEO, local rankings, e-commerce catalogs and content — plus AEO and GEO so ChatGPT, Gemini, Perplexity and Google AI Overviews cite you as the answer. Plans start at ₹15,000/month; the Indian market runs ₹20,000–₹50,000 for the same scope.",
    icon: "search",
    badge: "AEO · GEO",
    image: "/services-pages/seo-ai-search.jpg",
    stat: "+214%",
    statLabel: "avg organic growth, 12 mo",
    priceFrom: "from ₹15,000/mo",
    marketNote: "market: ₹20k–₹50k/mo for SMB SEO retainers",
    offers: [
      { name: "Technical SEO", blurb: "Crawl, indexing and speed issues fixed so rankings can move" },
      { name: "Local SEO", blurb: "Own the map pack and 'near me' searches in your city" },
      { name: "E-commerce SEO", blurb: "Category and product pages that rank and sell" },
      { name: "Answer Engine Optimization (AEO)", blurb: "Structured so ChatGPT and Perplexity cite you as the answer", highlight: true },
      { name: "Generative Engine Optimization (GEO)", blurb: "Show up inside Google AI Overviews and Gemini responses", highlight: true },
      { name: "Google Business Profile Optimization", blurb: "More calls and direction requests from your GBP listing" },
      { name: "Content Strategy", blurb: "Content mapped to searches your buyers actually make" },
      { name: "SEO Audits", blurb: "Free 15-page audit in 48 hours, then a prioritized fix plan" },
    ],
  },
  {
    slug: "performance-marketing",
    name: "Performance Marketing",
    blurb: "Google, Meta and LinkedIn ads run for leads and ROAS, not vanity clicks.",
    intro:
      "Paid campaigns managed end to end: strategy, creatives, tracking and weekly optimization across Google, Meta and LinkedIn. Every rupee of spend is tracked to a lead or sale, and landing pages get fixed so clicks actually convert. Management starts at ₹15,000/month — the market charges ₹15,000–₹60,000 flat or 10–20% of ad spend.",
    icon: "trendingUp",
    image: "/services-pages/performance-marketing.jpg",
    stat: "5.8×",
    statLabel: "avg client ROAS",
    priceFrom: "from ₹15,000/mo",
    marketNote: "market: ₹15k–₹60k/mo flat or 10–20% of ad spend",
    offers: [
      { name: "Google Ads", blurb: "Search and Performance Max campaigns tuned for cost per lead" },
      { name: "Meta Ads", blurb: "Facebook and Instagram funnels that turn scrolls into sales" },
      { name: "LinkedIn Ads", blurb: "B2B pipeline from decision-makers, not junk leads" },
      { name: "Remarketing", blurb: "Win back the visitors who didn't convert the first time" },
      { name: "Conversion Tracking", blurb: "Every lead and sale attributed to the ad that drove it" },
      { name: "Landing Page Optimization", blurb: "Pages rebuilt to convert more of the clicks you pay for" },
    ],
  },
  {
    slug: "ai-automation",
    name: "AI Automation",
    blurb: "Bots and workflows that capture, qualify and follow up leads 24/7.",
    intro:
      "We build AI chatbots, WhatsApp automation and CRM workflows that answer instantly, qualify leads and book appointments while your team sleeps. WhatsApp automation setups start at ₹15,000; the market prices SMB-grade AI chatbot builds at ₹75,000–₹4,00,000, and we deliver comparable scope from ₹40,000.",
    icon: "bot",
    badge: "NEW",
    image: "/services-pages/ai-automation.jpg",
    stat: "24/7",
    statLabel: "response, zero missed leads",
    priceFrom: "from ₹15,000 setup",
    marketNote: "market: ₹75k–₹4L for SMB AI chatbot builds; WhatsApp setup ₹15k–₹75k",
    offers: [
      { name: "AI Chatbots", blurb: "Website bots that answer, qualify and hand off to humans", highlight: true },
      { name: "WhatsApp Automation", blurb: "API setup, templates and flows that reply in seconds", highlight: true },
      { name: "CRM Automation", blurb: "Leads routed, tagged and followed up without manual work" },
      { name: "Email Automation", blurb: "Nurture sequences that warm leads while you sell" },
      { name: "Lead Qualification AI", blurb: "Hot leads routed to sales, time-wasters filtered out" },
      { name: "Appointment Booking Bots", blurb: "Bookings confirmed in chat — no back-and-forth calls" },
      { name: "AI Customer Support", blurb: "Instant answers to most queries, humans for the rest" },
      { name: "Sales Automation", blurb: "Follow-ups, quotes and reminders fired on schedule" },
      { name: "Internal Business Automation", blurb: "Repetitive back-office tasks handed to software" },
    ],
  },
  {
    slug: "website-design-development",
    name: "Website Design & Development",
    blurb: "Fast, SEO-ready websites — WordPress to Next.js to full e-commerce.",
    intro:
      "Websites built to convert: business sites, WordPress, Next.js/React, e-commerce stores and custom web apps — all mobile-first, fast and SEO-ready from day one. Business sites start at ₹35,000; the Indian market charges ₹40,000–₹1,50,000 for the same scope.",
    icon: "monitorSmartphone",
    image: "/services-pages/website-design-development.jpg",
    stat: "<2s",
    statLabel: "load time target, every build",
    priceFrom: "from ₹35,000",
    marketNote: "market: ₹40k–₹1.5L for a custom SMB business site",
    offers: [
      { name: "Business Websites", blurb: "A credible, lead-generating site live in weeks" },
      { name: "WordPress Development", blurb: "Custom WordPress you can edit yourself" },
      { name: "Next.js/React Websites", blurb: "Modern-stack sites that load fast and scale", highlight: true },
      { name: "E-commerce Stores", blurb: "Shopify or WooCommerce stores ready to take orders" },
      { name: "Custom Web Applications", blurb: "Portals, dashboards and tools built to your workflow" },
      { name: "Landing Pages", blurb: "Single pages engineered for one job: conversion" },
      { name: "Website Speed Optimization", blurb: "Core Web Vitals in the green, bounce rates down" },
      { name: "Website Maintenance", blurb: "Updates, backups and security handled for you" },
    ],
  },
  {
    slug: "crm-lead-management",
    name: "CRM & Lead Management",
    blurb: "Every lead tracked from first click to closed deal — nothing slips.",
    intro:
      "We set up Zoho or HubSpot CRM, build your sales pipeline and wire in lead tracking, assignment rules and dashboards so your team works leads instead of spreadsheets. Implementations start at ₹50,000; Indian partners typically charge ₹75,000–₹2,50,000 for the same SMB scope.",
    icon: "database",
    image: "/services-pages/crm-lead-management.jpg",
    stat: "0",
    statLabel: "leads lost to follow-up gaps",
    priceFrom: "from ₹50,000",
    marketNote: "market: ₹75k–₹2.5L for a typical SMB CRM implementation",
    offers: [
      { name: "CRM Setup", blurb: "Zoho or HubSpot configured, migrated and adopted" },
      { name: "Sales Pipeline", blurb: "Stages that mirror how your deals actually close" },
      { name: "Lead Tracking", blurb: "Know the source and status of every lead, always" },
      { name: "Lead Assignment", blurb: "Right lead to the right rep in seconds, automatically" },
      { name: "Sales Dashboard", blurb: "One screen showing pipeline, conversion and revenue" },
      { name: "Reporting", blurb: "Weekly numbers your team will actually act on" },
    ],
  },
  {
    slug: "branding-ui-ux",
    name: "Branding & UI/UX",
    blurb: "Logos, identities and product design that make you look established.",
    intro:
      "Brand and product design that earns trust before you say a word: logos, full identity systems, and UI/UX for websites and apps — from wireframes to design systems. Logo projects start at ₹20,000 and identity packages at ₹45,000; market rates run ₹50,000–₹2,00,000 for a full identity.",
    icon: "palette",
    image: "/services-pages/branding-ui-ux.jpg",
    stat: "5 days",
    statLabel: "to first identity concepts",
    priceFrom: "from ₹20,000",
    marketNote: "market: ₹20k–₹75k for an agency logo; ₹50k–₹2L for full identity",
    offers: [
      { name: "Logo Design", blurb: "A custom mark with concepts, revisions and all formats" },
      { name: "Brand Identity", blurb: "Logo, colors, type and guidelines — one consistent brand" },
      { name: "UI/UX Design", blurb: "Interfaces users get in seconds, not support tickets" },
      { name: "Wireframes", blurb: "Flows agreed on paper before a rupee goes to build" },
      { name: "Design Systems", blurb: "Reusable components that cut design time 30–50%" },
    ],
  },
  {
    slug: "mobile-app-development",
    name: "Mobile App Development",
    blurb: "Android and iOS apps shipped from one codebase — MVP to store launch.",
    intro:
      "We build Android and iOS apps on Flutter or React Native — one codebase, both stores, 40–60% cheaper than two native builds. MVPs with login, backend and payments start at ₹3,00,000, in line with the market's ₹3–8 lakh range for the same scope.",
    icon: "smartphone",
    image: "/services-pages/mobile-app-development.jpg",
    stat: "8–12 wks",
    statLabel: "typical MVP timeline",
    priceFrom: "from ₹3,00,000",
    marketNote: "market: ₹3L–₹8L for a cross-platform SMB MVP",
    offers: [
      { name: "Android Apps", blurb: "Play Store-ready apps for India's biggest platform" },
      { name: "iOS Apps", blurb: "Polished App Store builds that pass review first time" },
      { name: "Flutter Apps", blurb: "One codebase, both stores, 15–25% cheaper than RN" },
      { name: "React Native Apps", blurb: "Share code with your React web app, ship faster" },
      { name: "Progressive Web Apps", blurb: "App-like experience with no app store in between" },
    ],
  },
];

export type LiveService = ServiceDef & { id?: string };

/** Visible categories + offers for public pages; defaults if DB empty/down. */
export async function getLiveServices(): Promise<LiveService[]> {
  try {
    const rows = await db.serviceCategory.findMany({
      where: { visible: true },
      orderBy: { order: "asc" },
      include: {
        offers: { where: { visible: true }, orderBy: { order: "asc" } },
      },
    });
    if (rows.length > 0) {
      return rows.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        blurb: c.blurb,
        intro: c.intro,
        icon: c.icon ?? "sparkles",
        badge: c.badge ?? undefined,
        image: c.image ?? undefined,
        stat: c.stat ?? undefined,
        statLabel: c.statLabel ?? undefined,
        priceFrom: c.priceFrom ?? undefined,
        marketNote: c.marketNote ?? undefined,
        offers: c.offers.map((o) => ({
          name: o.name,
          blurb: o.blurb || undefined,
          highlight: o.highlight,
        })),
      }));
    }
  } catch {
    /* fall through to defaults */
  }
  return DEFAULT_SERVICES;
}

export async function getLiveService(slug: string): Promise<LiveService | null> {
  const all = await getLiveServices();
  return all.find((s) => s.slug === slug) ?? null;
}
