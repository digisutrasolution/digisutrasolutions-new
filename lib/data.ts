export type WorkCategory = "Web" | "Marketing" | "AI";

export type WorkItem = {
  slug: string;
  title: string;
  category: WorkCategory;
  categoryLabel: string;
  stack: string;
  gradient: string;
  icon: "cart" | "health" | "factory" | "phone" | "chart" | "wallet";
};

export const WORK_ITEMS: WorkItem[] = [
  {
    slug: "kart360",
    title: "Kart360 — 4.2× revenue",
    category: "Web",
    categoryLabel: "E-commerce",
    stack: "Next.js · Laravel · SEO + paid media",
    gradient: "from-orange-950 via-orange-600 to-amber-400",
    icon: "cart",
  },
  {
    slug: "medline-plus",
    title: "Medline+ healthcare SEO",
    category: "Marketing",
    categoryLabel: "Healthcare SEO",
    stack: "SEO · content · local listings",
    gradient: "from-stone-900 via-stone-700 to-orange-500",
    icon: "health",
  },
  {
    slug: "agrolink",
    title: "AgroLink lead engine",
    category: "Marketing",
    categoryLabel: "Lead generation",
    stack: "PPC · WhatsApp + SMS flows",
    gradient: "from-orange-900 via-orange-700 to-orange-300",
    icon: "factory",
  },
  {
    slug: "urbannest",
    title: "UrbanNest AI concierge",
    category: "AI",
    categoryLabel: "AI automation agents",
    stack: "AI chatbot · bookings · WhatsApp",
    gradient: "from-stone-800 via-stone-600 to-amber-400",
    icon: "phone",
  },
  {
    slug: "finedge",
    title: "FinEdge growth program",
    category: "Marketing",
    categoryLabel: "Marketing",
    stack: "SEO · Google Ads · CRO",
    gradient: "from-amber-700 via-orange-500 to-amber-300",
    icon: "chart",
  },
  {
    slug: "zenpay",
    title: "ZenPay merchant dashboard",
    category: "Web",
    categoryLabel: "SaaS platform",
    stack: "Next.js · Node · MongoDB",
    gradient: "from-stone-900 via-orange-800 to-orange-400",
    icon: "wallet",
  },
];

export const TICKER_ITEMS = [
  "SEO + AI SEARCH",
  "PPC",
  "AEO · GEO",
  "EMAIL MARKETING",
  "AI CHATBOTS",
  "BRANDING",
  "LEAD GENERATION",
  "E-COMMERCE",
  "WHATSAPP MARKETING",
  "MOBILE APPS",
  "CRM & LEADS",
  "AI AUTOMATION AGENTS",
];

export const STATS = [
  { value: 250, suffix: "+", label: "projects shipped" },
  { value: 120, suffix: "+", label: "happy clients" },
  { value: 5.8, suffix: "×", label: "average ROAS", decimals: 1 },
  { value: 12, suffix: "", label: "countries served" },
];

export const CERTS = [
  "Google Partner",
  "Meta Business Partner",
  "AWS Partner",
  "ISO 27001",
];

/* Home "studios" panels — 4 lanes mapping the 7 service categories. */
export const SERVICE_CATEGORIES = [
  {
    title: "Marketing",
    icon: "megaphone",
    items: [
      "SEO + AI Search (AEO · GEO)",
      "Google · Meta · LinkedIn Ads",
      "WhatsApp marketing",
      "Email & SMS marketing",
      "Lead generation",
      "Google Business Profile",
    ],
  },
  {
    title: "AI & Systems",
    icon: "sparkles",
    items: [
      "AI chatbots",
      "WhatsApp automation",
      "CRM setup & automation",
      "Lead qualification AI",
      "Appointment booking bots",
      "Sales automation",
    ],
  },
  {
    title: "Development",
    icon: "code",
    items: [
      "Business websites",
      "Next.js / React builds",
      "E-commerce stores",
      "Custom web applications",
      "Mobile apps · Flutter & RN",
      "Speed & maintenance",
    ],
  },
  {
    title: "Design",
    icon: "palette",
    items: [
      "Logo design",
      "Brand identity",
      "UI/UX design",
      "Wireframes",
      "Design systems",
      "Landing pages",
    ],
  },
] as const;

export const PROCESS_STEPS = [
  { step: "Audit & discovery", copy: "Goals, market and data baseline" },
  { step: "Strategy", copy: "Channels, budgets and KPIs" },
  { step: "Creative & setup", copy: "Ads, landing pages and tracking" },
  { step: "Launch", copy: "Campaigns live across channels" },
  { step: "Optimize", copy: "A/B tests, CRO and bid tuning" },
  { step: "Scale", copy: "More budget on what works" },
  { step: "Report & grow", copy: "Live dashboards, monthly reviews" },
];

export const CASE_STUDIES = [
  {
    client: "Kart360",
    category: "E-commerce · SEO + development",
    title: "4.2× revenue in 9 months",
    challenge:
      "Legacy store, 6-second load times, 92% of traffic from a single paid channel.",
    solution:
      "Next.js storefront, automated inventory sync, technical SEO and diversified paid media.",
    result:
      "Sub-second pages, organic became the #1 channel, revenue up 4.2×.",
    metrics: [
      { value: "+312%", label: "organic traffic" },
      { value: "4.2×", label: "revenue growth" },
      { value: "5.8×", label: "ad ROAS" },
      { value: "-62%", label: "cost per acquisition" },
    ],
  },
  {
    client: "FinEdge",
    category: "Fintech · growth program",
    title: "3× qualified leads in 6 months",
    challenge:
      "High CPL from broad targeting, landing pages converting under 1%.",
    solution:
      "Full-funnel rebuild — intent-based keywords, CRO landing system and lead scoring automation.",
    result:
      "Cost per lead cut by more than half while lead quality and volume tripled.",
    metrics: [
      { value: "3×", label: "qualified leads" },
      { value: "-54%", label: "cost per lead" },
      { value: "4.1%", label: "landing conversion" },
      { value: "+89%", label: "sales-accepted rate" },
    ],
  },
];

export const TECHNOLOGIES = [
  { group: "Frontend", items: ["HTML", "CSS", "JavaScript", "React", "Next.js", "Vue"] },
  { group: "Backend", items: ["PHP", "Laravel", "Node.js", "Python"] },
  { group: "Database", items: ["MySQL", "PostgreSQL", "MongoDB"] },
  { group: "Cloud", items: ["AWS", "Azure", "Google Cloud"] },
  { group: "AI & automation", items: ["Claude API", "OpenAI", "n8n", "Zapier"] },
];

export const WHY_US = [
  { title: "Experienced team", copy: "Senior marketers and engineers on every account.", icon: "users" },
  { title: "Transparent pricing", copy: "Fixed quotes, no surprise invoices.", icon: "receipt" },
  { title: "Dedicated support", copy: "Named account manager, same-day replies.", icon: "headset" },
  { title: "Agile development", copy: "Weekly demos, ship in small increments.", icon: "iterations" },
  { title: "Fast delivery", copy: "MVPs in weeks, not quarters.", icon: "rocket" },
  { title: "Secure solutions", copy: "OWASP practices, audits and backups.", icon: "shield" },
  { title: "Performance optimized", copy: "95+ Lighthouse targets on every build.", icon: "gauge" },
  { title: "AI powered", copy: "Automation baked into delivery and product.", icon: "bot" },
  { title: "Scalable architecture", copy: "Built for 10× traffic from day one.", icon: "layers" },
];

export const TESTIMONIALS = [
  {
    quote:
      "One team for ads, site and automation — a game changer. Every rupee is accounted for and the reporting is the best we've seen.",
    name: "Rohit Malhotra",
    role: "Founder, FinEdge",
    rating: 5,
  },
  {
    quote:
      "DigiSutra rebuilt our store and our marketing in one program. Revenue is up 4.2× and pages load in under a second.",
    name: "Priya Sharma",
    role: "Founder, Kart360",
    rating: 5,
  },
  {
    quote:
      "Their lead engine keeps our pipeline full — WhatsApp, SMS and email flows that actually convert. Support is genuinely same-day.",
    name: "Arvind Kulkarni",
    role: "Director, AgroLink",
    rating: 5,
  },
];

export const PRICING = [
  {
    name: "Starter",
    price: "₹19,999",
    period: "/mo",
    tagline: "For businesses starting their digital journey",
    features: [
      "SEO or one paid channel",
      "Landing page + analytics",
      "Monthly report and review call",
      "Email support",
    ],
    cta: "Start with Starter",
    featured: false,
  },
  {
    name: "Professional",
    price: "₹49,999",
    period: "/mo",
    tagline: "Full-funnel growth for scaling brands",
    features: [
      "SEO + 2 paid channels + CRO",
      "Website or store development",
      "Live dashboard, weekly reviews",
      "Dedicated account manager",
      "Marketing automation setup",
    ],
    cta: "Go Professional",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    tagline: "AI automation agents, custom platforms and multi-market growth",
    features: [
      "Custom web platforms & AI automation agents",
      "Multi-channel growth program",
      "AI chatbots and automation",
      "SLA-backed priority support",
    ],
    cta: "Talk to sales",
    featured: false,
  },
];

/* Answer-first FAQ copy: `lead` is the direct fact search engines and AI
   Overviews can lift verbatim; `rest` adds context. JSON-LD joins the two.
   Questions target real search/AI-assistant queries (buyer-intent, local
   India, AI-era) — card icons in Faq.tsx are positional, keep in sync. */
export const FAQS = [
  {
    q: "How much does a digital marketing agency charge per month in India?",
    lead: "Most SMB programs cost ₹20,000–₹50,000 monthly; DigiSutra starter plans begin at ₹19,999.",
    rest: "That entry price covers SEO or one paid channel; full-funnel programs spanning several channels start at ₹49,999 per month. Pricing scales with channels and goals, not a one-size-fits-all package.",
  },
  {
    q: "How long does SEO take to show results?",
    lead: "SEO typically shows first movement in 4–6 weeks, compounding from month three.",
    rest: "Early weeks bring technical fixes, indexing gains and long-tail visibility; traffic and leads then build as content and authority stack up. Any agency guaranteeing overnight rankings is a red flag.",
  },
  {
    q: "What does a free website audit include and is it really free?",
    lead: "Yes — the audit is genuinely free: a 15-page report in 48 hours.",
    rest: "It covers SEO health, site speed, UX and conversion blockers, with no charge and no obligation to hire DigiSutra afterward. Use it as a prioritised fix-list even if you never become a client.",
  },
  {
    q: "Is SEO still worth it in 2026 with AI Overviews and ChatGPT?",
    lead: "Yes — AI Overviews and chatbots cite the well-structured pages SEO builds.",
    rest: "Assistants pull answers from clearly structured, entity-rich, authoritative content — exactly what good SEO produces. The work now includes being citable by AI engines alongside ranking in classic Google results.",
  },
  {
    q: "Can AI automation replace my marketing team or agency?",
    lead: "No — AI agents automate follow-up, reporting and repetitive workflows; strategy stays human.",
    rest: "DigiSutra builds AI automation agents that answer enquiries, chase leads and compile reports around the clock, while human specialists own positioning, campaigns and creative.",
  },
  {
    q: "Do I get locked into a long contract when I hire a marketing agency?",
    lead: "No lock-in — marketing retainers pause with 30 days notice.",
    rest: "Development and e-commerce projects run on fixed quotes with milestone payments, so costs are agreed before any work starts. The free 48-hour audit shows you the roadmap before you commit a rupee.",
  },
  {
    q: "Can an agency in India work with clients in the USA, UK or Australia?",
    lead: "Yes — DigiSutra already serves clients in 12 countries from Noida, India.",
    rest: "Remote delivery is standard: campaigns run on the same Google and Meta ad platforms whether you're in Sydney, London or New York, and async reporting keeps international accounts moving between time zones.",
  },
  {
    q: "Do you provide support and updates over WhatsApp?",
    lead: "Support and project updates run over WhatsApp — no ticket queues or email chains.",
    rest: "Clients message the team directly for campaign questions, approvals and quick fixes, alongside regular performance reporting. It keeps decisions moving fast.",
  },
];

export const BLOG_POSTS = [
  {
    title: "Local SEO in 2026: the map-pack playbook",
    category: "SEO",
    date: "Jun 28, 2026",
    gradient: "from-orange-900 via-orange-600 to-amber-400",
  },
  {
    title: "Lead generation in 2026: AI-assisted funnels",
    category: "Marketing",
    date: "Jun 14, 2026",
    gradient: "from-stone-900 via-stone-700 to-orange-500",
  },
  {
    title: "AI chatbots that actually convert — a field guide",
    category: "AI",
    date: "May 30, 2026",
    gradient: "from-amber-700 via-orange-500 to-amber-300",
  },
];
