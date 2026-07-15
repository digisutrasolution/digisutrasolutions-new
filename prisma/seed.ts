/**
 * Development seed — creates one account per role.
 * Passwords are development defaults: CHANGE THEM before any deployment
 * (Users → reset password, or set strong values here and re-run).
 */
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const USERS: Array<{
  name: string;
  email: string;
  role: Role;
  password: string;
}> = [
  {
    name: "Super Admin",
    email: "admin@digisutra.com",
    role: "SUPER_ADMIN",
    password: "Admin@digisutra1",
  },
  {
    name: "Dev One",
    email: "developer@digisutra.com",
    role: "DEVELOPER",
    password: "Dev@digisutra1",
  },
  {
    name: "QA One",
    email: "tester@digisutra.com",
    role: "TESTER",
    password: "Test@digisutra1",
  },
  {
    name: "SEO One",
    email: "seo@digisutra.com",
    role: "SEO_MANAGER",
    password: "Seo@digisutra1",
  },
];

const DEMO_SECTIONS = [
  {
    type: "hero",
    eyebrow: "Digital marketing",
    heading: "SEO that compounds,",
    highlight: "ads that convert",
    copy: "Full-funnel growth programs measured in revenue — search, paid media and CRO run by one accountable team.",
    ctaLabel: "Get a free audit ↗",
    ctaHref: "/#contact",
  },
  {
    type: "cards",
    heading: "What's included",
    items: [
      { title: "Technical SEO", copy: "Site speed, crawlability, structured data and Core Web Vitals fixed at the source." },
      { title: "Content engine", copy: "Keyword-mapped articles and landing pages written for people, optimized for engines." },
      { title: "Paid media", copy: "Google and Meta campaigns with weekly optimization against your cost-per-acquisition targets." },
    ],
  },
  {
    type: "stats",
    items: [
      { value: "+248%", label: "avg. organic growth" },
      { value: "5.8×", label: "average ROAS" },
      { value: "90d", label: "to first results" },
      { value: "120+", label: "clients served" },
    ],
  },
  {
    type: "faq",
    heading: "Frequently asked questions",
    items: [
      { q: "How soon can we expect SEO results?", a: "Technical fixes show impact within 4–6 weeks; compounding traffic growth typically starts from month 3." },
      { q: "Do you require long contracts?", a: "No — programs run month-to-month and can be paused with 30 days' notice." },
    ],
  },
  {
    type: "cta",
    heading: "Ready to grow?",
    copy: "Get a free 15-page audit of your SEO, ads and site speed.",
    ctaLabel: "Claim your audit",
    ctaHref: "/#contact",
  },
];

async function main() {
  for (const u of USERS) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    await db.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        role: u.role,
        passwordHash,
      },
    });
    console.log(`seeded ${u.role.padEnd(12)} ${u.email}`);
  }

  const admin = await db.user.findUnique({
    where: { email: "admin@digisutra.com" },
  });
  await db.page.upsert({
    where: { slug: "digital-marketing-services" },
    update: {},
    create: {
      title: "Digital Marketing Services",
      slug: "digital-marketing-services",
      status: "PUBLISHED",
      publishedAt: new Date(),
      sections: DEMO_SECTIONS,
      seoTitle: "Digital Marketing Services — SEO, PPC & CRO",
      seoDescription:
        "Full-funnel digital marketing by DigiSutra: technical SEO, content, Google & Meta ads and CRO — measured in revenue, not vanity metrics.",
      createdById: admin?.id,
      updatedById: admin?.id,
      versions: {
        create: {
          version: 1,
          title: "Digital Marketing Services",
          sections: DEMO_SECTIONS,
          seoSnapshot: {},
          note: "Seeded",
          createdByName: "Seed",
        },
      },
    },
  });
  console.log("seeded page         /digital-marketing-services");

  const seo = await db.user.findUnique({
    where: { email: "seo@digisutra.com" },
  });
  const POSTS = [
    {
      title: "Local SEO in 2026: the map-pack playbook",
      slug: "local-seo-2026-map-pack-playbook",
      category: "SEO",
      tags: ["seo", "local-seo"],
      excerpt:
        "Reviews, entity signals and service-area pages — what actually moves the local map pack this year.",
      body: "The local map pack drives more calls than any blue link, yet most businesses treat their profile as a set-and-forget listing.\n\n## Reviews are the ranking signal you control\n\nVelocity beats volume: five fresh reviews a month outrank a hundred stale ones. Build the ask into your delivery workflow, not your marketing calendar.\n\n## Entity consistency\n\nName, address, phone — identical everywhere, including the schema markup on your site. Mismatches quietly cap your ranking.\n\n### Service-area pages that aren't spam\n\nOne page per city works only when each page says something true and specific about that city: local clients, local numbers, local proof.",
    },
    {
      title: "ERP vs. spreadsheets: when to make the switch",
      slug: "erp-vs-spreadsheets-when-to-switch",
      category: "Software",
      tags: ["erp", "operations"],
      excerpt:
        "The four signals that your operation has outgrown Excel — and what a right-sized ERP migration looks like.",
      body: "Spreadsheets are the world's most successful ERP. Until they aren't.\n\n## The four signals\n\nDouble entry between sheets. A single person who 'owns the file'. Month-end taking a week. And decisions made on numbers nobody fully trusts.\n\n## Right-sizing the migration\n\nYou don't need a five-year SAP program. Start with the module that bleeds the most — usually inventory or billing — and integrate outward.",
    },
  ];
  for (const p of POSTS) {
    await db.blogPost.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...p,
        status: "PUBLISHED",
        publishedAt: new Date(),
        readingMinutes: Math.max(1, Math.round(p.body.split(/\s+/).length / 200)),
        seoTitle: p.title,
        seoDescription: p.excerpt,
        authorId: seo?.id,
        authorName: seo?.name ?? "DigiSutra team",
      },
    });
    console.log(`seeded post         /blog/${p.slug}`);
  }

  await db.form.upsert({
    where: { slug: "lead-form" },
    update: {},
    create: {
      name: "Lead form",
      slug: "lead-form",
      fields: [
        { key: "name", label: "Name", type: "text", required: true, options: [] },
        { key: "email", label: "Email", type: "email", required: true, options: [] },
        { key: "service", label: "Service", type: "select", required: false, options: ["Digital marketing", "Development", "AI solutions"] },
        { key: "message", label: "Message", type: "textarea", required: true, options: [] },
      ],
    },
  });
  console.log("seeded form         lead-form");

  await db.video.upsert({
    where: { slug: "getting-started-with-digisutra" },
    update: {},
    create: {
      title: "Getting started with DigiSutra",
      slug: "getting-started-with-digisutra",
      provider: "YOUTUBE",
      videoId: "M7lc1UVf-VE",
      description:
        "A quick look at how we run marketing and engineering as one accountable team.",
      category: "Showreel",
      thumbnailUrl: "https://i.ytimg.com/vi/M7lc1UVf-VE/hqdefault.jpg",
      featured: true,
      uploadedByName: "Seed",
    },
  });
  console.log("seeded video        getting-started-with-digisutra");

  const COMPANY_PAGES: Array<{
    title: string;
    slug: string;
    seoTitle: string;
    seoDescription: string;
    sections: unknown[];
  }> = [
    {
      title: "About Us",
      slug: "about",
      seoTitle: "About Us — Your Growth, Our Sutra",
      seoDescription:
        "DigiSutra Solutions pairs marketing strategists with product engineers — SEO, ads, web, ERP and AI under one accountable roof, serving clients across 12 countries.",
      sections: [
        {
          type: "hero",
          eyebrow: "About us",
          heading: "One team.",
          highlight: "Every growth lever.",
          copy: "Founded in 2018, DigiSutra pairs marketing strategists with product engineers so clients never have to coordinate two agencies again.",
          ctaLabel: "Work with us ↗",
          ctaHref: "/#contact",
        },
        {
          type: "richText",
          heading: "Why we exist",
          body: "Most businesses hire a marketing agency and a development shop, then spend their energy refereeing between the two. Campaigns launch before the landing pages are ready. Sites ship that nobody can rank. The ERP never talks to the ad account.\n\nWe built DigiSutra to end that split. Our strategists and engineers sit in the same standups, share the same dashboards, and answer to the same number: your revenue.",
        },
        {
          type: "stats",
          items: [
            { value: "2018", label: "founded" },
            { value: "250+", label: "projects shipped" },
            { value: "120+", label: "happy clients" },
            { value: "12", label: "countries served" },
          ],
        },
        {
          type: "cards",
          heading: "What we stand for",
          items: [
            { title: "Outcome first", copy: "We commit to numbers — traffic, leads, revenue — not activity reports. Every engagement starts by agreeing what success measurably looks like." },
            { title: "Radical transparency", copy: "Fixed quotes, live dashboards, and honest post-mortems when something doesn't work. You always know what we did and what it cost." },
            { title: "Ship fast, iterate", copy: "MVPs in weeks, weekly demos, small increments. Momentum beats perfection, and real user data beats every internal debate." },
          ],
        },
        {
          type: "cta",
          heading: "Let's write your next chapter",
          copy: "Tell us where you want to grow — we'll bring the plan.",
          ctaLabel: "Get free consultation",
          ctaHref: "/#contact",
        },
      ],
    },
    {
      title: "Careers",
      slug: "careers",
      seoTitle: "Careers — Join the Team",
      seoDescription:
        "Join a remote-first team of marketers and engineers who ship. Openings across SEO, paid media, full-stack development and design.",
      sections: [
        {
          type: "hero",
          eyebrow: "Careers",
          heading: "Do the best work",
          highlight: "of your career",
          copy: "Remote-first, small teams, real ownership. We hire people who like shipping more than they like meetings.",
          ctaLabel: "Send your resume ↗",
          ctaHref: "mailto:careers@digisutra.com",
        },
        {
          type: "cards",
          heading: "What you get",
          items: [
            { title: "Remote-first", copy: "Work from anywhere in India with overlap hours; we meet in person once a quarter." },
            { title: "Real ownership", copy: "Small pods own accounts and products end to end — no ticket factories." },
            { title: "Learning budget", copy: "Annual budget for courses, certifications and conferences, plus dedicated learning Fridays." },
          ],
        },
        {
          type: "richText",
          heading: "How we hire",
          body: "One short intro call, one practical exercise drawn from real (anonymized) client work, one conversation with the team you'd join. No whiteboard hazing, and we always tell you where you stand within a week.\n\nWe hire on demonstrated craft over credentials. If you've shipped things you're proud of — campaigns, codebases, designs — we want to see them.",
        },
        {
          type: "faq",
          heading: "Common questions",
          items: [
            { q: "Which roles do you hire for?", a: "SEO and paid-media specialists, full-stack developers (Next.js/Laravel), Flutter developers, and UI/UX designers. Send a resume even if there's no exact opening — we hire opportunistically for strong people." },
            { q: "Is the work fully remote?", a: "Yes, remote-first across India, with a quarterly team meetup and core overlap hours of 11:00–17:00 IST." },
            { q: "How fast is the process?", a: "Typically two weeks from first call to offer. We respect your time and never leave candidates hanging." },
          ],
        },
        {
          type: "cta",
          heading: "Don't see your role?",
          copy: "Strong generalists always have a seat. Introduce yourself.",
          ctaLabel: "careers@digisutra.com",
          ctaHref: "mailto:careers@digisutra.com",
        },
      ],
    },
    {
      title: "Privacy Policy",
      slug: "privacy-policy",
      seoTitle: "Privacy Policy",
      seoDescription:
        "How DigiSutra Solutions collects, uses and protects your personal information.",
      sections: [
        {
          type: "hero",
          eyebrow: "Legal",
          heading: "Privacy Policy",
          highlight: "",
          copy: "Last updated: July 2026. This policy explains what we collect, why, and the choices you have.",
          ctaLabel: "",
          ctaHref: "",
        },
        {
          type: "richText",
          heading: "What we collect",
          body: "When you contact us or submit a form, we collect the details you provide: name, company, email, phone number, and your message. Our website records anonymous, cookie-less page-view statistics (the page visited and the referring site) that contain no personal identifiers.\n\nWe do not use advertising trackers on this site, and we do not buy, sell, or trade personal data.",
        },
        {
          type: "richText",
          heading: "How we use it",
          body: "Contact details are used solely to respond to your enquiry and, where you engage us, to deliver our services and invoices. Aggregate site statistics help us understand which content is useful.\n\nWe retain enquiry data for up to 24 months, and client records for as long as required by Indian tax and accounting law.",
        },
        {
          type: "richText",
          heading: "Sharing and processors",
          body: "We share data only with the service providers needed to operate: our hosting provider, our email delivery provider, and — for clients — the advertising and analytics platforms you authorize us to manage on your behalf. Each processor is bound by its own data-protection terms.\n\nWe never disclose your information to third parties for their marketing.",
        },
        {
          type: "richText",
          heading: "Your rights",
          body: "You may request a copy of the personal data we hold about you, ask us to correct it, or ask us to delete it (subject to legal retention requirements). Write to privacy@digisutra.com and we will respond within 30 days.\n\nThis policy is governed by the laws of India, including the Digital Personal Data Protection Act, 2023.",
        },
        {
          type: "cta",
          heading: "Questions about your data?",
          copy: "We answer privacy requests within 30 days.",
          ctaLabel: "privacy@digisutra.com",
          ctaHref: "mailto:privacy@digisutra.com",
        },
      ],
    },
    {
      title: "Terms & Conditions",
      slug: "terms",
      seoTitle: "Terms & Conditions",
      seoDescription:
        "The terms that govern use of the DigiSutra Solutions website and engagement of our services.",
      sections: [
        {
          type: "hero",
          eyebrow: "Legal",
          heading: "Terms & Conditions",
          highlight: "",
          copy: "Last updated: July 2026. Using this website or engaging our services means you accept these terms.",
          ctaLabel: "",
          ctaHref: "",
        },
        {
          type: "richText",
          heading: "Services and proposals",
          body: "Every engagement is defined by a written proposal covering scope, deliverables, timeline and fees. Work outside the agreed scope is quoted separately before we begin it.\n\nEstimates for marketing outcomes (rankings, traffic, lead volume) are projections based on experience, not guarantees — no honest agency can promise a specific position on a platform it doesn't control.",
        },
        {
          type: "richText",
          heading: "Payment",
          body: "Development projects are invoiced against milestones; marketing retainers are invoiced monthly in advance. Invoices are payable within 14 days.\n\nWe may pause work on accounts more than 30 days overdue after written notice.",
        },
        {
          type: "richText",
          heading: "Intellectual property",
          body: "On full payment, you own the deliverables we create for you — code, designs, and content. We retain ownership of our pre-existing tools, frameworks and internal libraries, which you receive a perpetual license to use within the deliverables.\n\nWe may reference completed work in our portfolio unless you request otherwise in writing.",
        },
        {
          type: "richText",
          heading: "Liability",
          body: "Our aggregate liability under any engagement is limited to the fees paid for that engagement in the preceding six months. We are not liable for indirect or consequential losses, or for the actions of third-party platforms (search engines, ad networks, app stores) outside our control.\n\nThese terms are governed by the laws of India; disputes fall under the jurisdiction of the courts of our registered office.",
        },
      ],
    },
    {
      title: "Refund Policy",
      slug: "refund-policy",
      seoTitle: "Refund Policy",
      seoDescription: "When and how DigiSutra Solutions issues refunds for services.",
      sections: [
        {
          type: "hero",
          eyebrow: "Legal",
          heading: "Refund Policy",
          highlight: "",
          copy: "Last updated: July 2026. Plainly: pay only for work delivered.",
          ctaLabel: "",
          ctaHref: "",
        },
        {
          type: "richText",
          heading: "Development projects",
          body: "Milestone payments cover completed, delivered milestones and are non-refundable once you have accepted the milestone. If you cancel a project mid-milestone, we invoice only the portion of work completed and refund any unearned balance of that milestone within 14 days.",
        },
        {
          type: "richText",
          heading: "Marketing retainers",
          body: "Retainers may be cancelled with 30 days' written notice. The notice month is worked and billed as normal; any month paid beyond the notice period is refunded in full.\n\nMedia budgets (Google, Meta, etc.) are paid to the platforms directly and follow those platforms' refund rules, not ours.",
        },
        {
          type: "richText",
          heading: "What we don't refund",
          body: "Completed and accepted work, third-party costs incurred on your behalf (licenses, stock assets, ad spend), and discovery or audit engagements once the findings have been delivered.\n\nIf something has genuinely gone wrong, talk to us first — we would rather fix it than argue about it. Write to billing@digisutra.com.",
        },
      ],
    },
    {
      title: "Cookie Policy",
      slug: "cookie-policy",
      seoTitle: "Cookie Policy",
      seoDescription:
        "What cookies the DigiSutra Solutions website uses — spoiler: almost none.",
      sections: [
        {
          type: "hero",
          eyebrow: "Legal",
          heading: "Cookie Policy",
          highlight: "",
          copy: "Last updated: July 2026. The short version: this site is nearly cookie-free by design.",
          ctaLabel: "",
          ctaHref: "",
        },
        {
          type: "richText",
          heading: "What we use",
          body: "Our public website sets no advertising or analytics cookies. Page-view statistics are collected with a cookie-less, first-party method that stores no identifier on your device.\n\nThe only cookies this site sets are strictly-necessary session cookies for team members signed in to our content management system — visitors never receive them.",
        },
        {
          type: "richText",
          heading: "Embedded content",
          body: "Some pages embed videos from YouTube or Vimeo. We use privacy-enhanced embeds where available (youtube-nocookie.com), but playing an embedded video may cause the video platform to set its own cookies under its own policy.",
        },
        {
          type: "richText",
          heading: "Managing cookies",
          body: "Because we set no optional cookies, there is nothing to opt out of on our side. You can control or delete cookies from embedded platforms through your browser settings at any time.",
        },
      ],
    },
  ];

  for (const p of COMPANY_PAGES) {
    await db.page.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        title: p.title,
        slug: p.slug,
        status: "PUBLISHED",
        workflowStage: "APPROVED",
        publishedAt: new Date(),
        sections: p.sections as object[],
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        createdById: admin?.id,
        updatedById: admin?.id,
        versions: {
          create: {
            version: 1,
            title: p.title,
            sections: p.sections as object[],
            seoSnapshot: {},
            note: "Seeded",
            createdByName: "Seed",
          },
        },
      },
    });
    console.log(`seeded page         /${p.slug}`);
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
