import type { WorkCategory } from "@/lib/data";

/* Portfolio case studies for /work — outcome-led, written 2026-07-18.
   Kart360 + FinEdge metrics are the fixed house figures used site-wide
   (CASE_STUDIES, testimonials); keep them in sync if edited. */

export type WorkCase = {
  slug: string;
  client: string;
  title: string;
  industry: string;
  category: WorkCategory;
  services: string[];
  challenge: string;
  solution: string;
  result: string;
  metrics: { value: string; label: string }[];
  timeframe: string;
  image: string;
};

export const WORK_CASES: WorkCase[] = [
  {
    "slug": "kart360",
    "client": "Kart360",
    "title": "4.2× revenue growth in 9 months",
    "industry": "D2C e-commerce",
    "category": "Web",
    "services": [
      "Next.js Storefront",
      "Technical SEO",
      "Performance Max",
      "CRO"
    ],
    "challenge": "A slow legacy storefront and single-channel ad spend capped growth — 6-second page loads and Meta CPAs climbing every quarter.",
    "solution": "Rebuilt the storefront on Next.js with sub-second loads and clean crawl architecture, then diversified spend across Google Shopping, Performance Max and Meta with weekly creative testing.",
    "result": "Organic traffic grew 312% and revenue 4.2× in nine months, while blended ad ROAS held at 5.8×.",
    "metrics": [
      {
        "value": "4.2×",
        "label": "revenue growth"
      },
      {
        "value": "+312%",
        "label": "organic traffic"
      },
      {
        "value": "5.8×",
        "label": "ad ROAS"
      }
    ],
    "timeframe": "9 months",
    "image": "/services-pages/ecommerce-development.jpg"
  },
  {
    "slug": "medline-plus",
    "client": "Medline+",
    "title": "+143% appointment calls across 18 clinics",
    "industry": "Healthcare clinic chain",
    "category": "Marketing",
    "services": [
      "Local SEO",
      "GBP Management",
      "Content Strategy",
      "Review Ops"
    ],
    "challenge": "Eighteen clinic locations were near-invisible in local search — inconsistent listings, thin location pages and unanswered patient reviews.",
    "solution": "Standardised every Google Business Profile, built unique location and treatment pages, and ran a monthly content and review-response cadence across all 18 branches.",
    "result": "Appointment calls rose 143% and 14 of 18 locations now rank in the map-pack top three for their core treatments.",
    "metrics": [
      {
        "value": "+143%",
        "label": "appointment calls"
      },
      {
        "value": "14/18",
        "label": "locations in top 3"
      },
      {
        "value": "+82%",
        "label": "GBP actions"
      }
    ],
    "timeframe": "8 months",
    "image": "/services-pages/seo-ai-search.jpg"
  },
  {
    "slug": "agrolink",
    "client": "AgroLink",
    "title": "58% of dealer enquiries now reply on WhatsApp",
    "industry": "B2B agri-equipment",
    "category": "Marketing",
    "services": [
      "Google Ads",
      "WhatsApp Automation",
      "SMS Nurture",
      "Landing Pages"
    ],
    "challenge": "Dealer enquiries went cold within days — no follow-up system, seasonal demand spikes and ad spend leaking to consumer-intent clicks.",
    "solution": "Rebuilt Google Ads around dealer and bulk-purchase intent, then wired every enquiry into automated WhatsApp and SMS nurture flows with spec sheets, pricing and a timed rep handoff.",
    "result": "With 58% of enquiries actively replying inside the nurture flows, qualified leads grew 2.4× while cost per lead fell 41%.",
    "metrics": [
      {
        "value": "58%",
        "label": "WhatsApp reply rate"
      },
      {
        "value": "2.4×",
        "label": "qualified leads"
      },
      {
        "value": "-41%",
        "label": "cost per lead"
      }
    ],
    "timeframe": "7 months",
    "image": "/services-pages/performance-marketing.jpg"
  },
  {
    "slug": "urbannest",
    "client": "UrbanNest",
    "title": "+57% tour bookings with an AI concierge",
    "industry": "Premium co-living",
    "category": "AI",
    "services": [
      "AI Chatbot",
      "WhatsApp Concierge",
      "Tour Automation",
      "Calendar & Lead Sync"
    ],
    "challenge": "Enquiries landed at all hours across six properties, but replies took a day and tour requests died in an inbox nobody owned after 7pm.",
    "solution": "Deployed an AI booking concierge on the website and WhatsApp that answers pricing and availability, qualifies tenants and books tours straight into the property calendar — 24/7.",
    "result": "First responses dropped from hours to under a minute, tour bookings rose 57%, and 38% of confirmed tours now come in after office hours.",
    "metrics": [
      {
        "value": "<1 min",
        "label": "first response"
      },
      {
        "value": "+57%",
        "label": "tour bookings"
      },
      {
        "value": "38%",
        "label": "after-hours bookings"
      }
    ],
    "timeframe": "5 months",
    "image": "/services-pages/ai-automation.jpg"
  },
  {
    "slug": "finedge",
    "client": "FinEdge",
    "title": "3× qualified leads at 54% lower cost",
    "industry": "Fintech lending",
    "category": "Marketing",
    "services": [
      "Intent Search Ads",
      "CRO",
      "Lead Scoring",
      "Landing Pages"
    ],
    "challenge": "Heavy ad spend produced form-fills sales refused to call — generic keywords, one landing page for every loan product and zero lead qualification.",
    "solution": "Restructured campaigns around high-intent loan keywords, built a per-product landing system with continuous CRO testing, and added lead scoring so sales only sees qualified applications.",
    "result": "Qualified leads tripled in six months at 54% lower cost per lead, and the sales-accepted rate climbed 89%.",
    "metrics": [
      {
        "value": "3×",
        "label": "qualified leads"
      },
      {
        "value": "-54%",
        "label": "cost per lead"
      },
      {
        "value": "+89%",
        "label": "sales-accepted rate"
      }
    ],
    "timeframe": "6 months",
    "image": "/services/marketing.jpg"
  },
  {
    "slug": "zenpay",
    "client": "ZenPay",
    "title": "+46% merchant activation in 14 weeks",
    "industry": "Payments SaaS",
    "category": "Web",
    "services": [
      "Next.js Development",
      "Node.js API",
      "MongoDB",
      "Onboarding UX"
    ],
    "challenge": "Merchants signed up but stalled — KYC lived in email threads, the legacy dashboard hid settlement data and support carried the onboarding load.",
    "solution": "Built a merchant dashboard on Next.js, Node and MongoDB with a guided onboarding funnel — document upload, KYC status tracking and settlement views in one place.",
    "result": "Merchant activation rose 46%, onboarding time fell 68%, and support tickets dropped 31% within 14 weeks of launch.",
    "metrics": [
      {
        "value": "+46%",
        "label": "merchant activation"
      },
      {
        "value": "-68%",
        "label": "onboarding time"
      },
      {
        "value": "-31%",
        "label": "support tickets"
      }
    ],
    "timeframe": "14 weeks",
    "image": "/services/development.jpg"
  }
];
