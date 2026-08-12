import type { Section } from "@/lib/cms/sections";

/* Starter landing-page templates.

   Shaped for paid traffic, which is a different job from a site page. An ad
   landing page has ONE thing to achieve, so every template follows the same
   spine: promise → proof → what you get → how it works → objections → ask.
   Proof comes early because a stranger from an ad has no reason to believe
   anything yet, and the objection blocks (comparison, FAQ, price) sit late
   because they only matter to someone already interested.

   NOTHING HERE INVENTS A RESULT. Where a real number belongs the copy carries
   a [bracketed placeholder] instead, the same convention the seeded
   testimonials use. A fabricated "300% growth" on a live page is a claim about
   a real client that nobody made — worse than an empty slot.

   Library blocks (logos, testimonials, pricing, case studies) pull from the
   admin libraries, so they fill themselves in and render nothing while a
   library is empty. */

export type StarterTemplate = {
  slug: string;
  title: string;
  /** Shown in the install summary so the team knows which to use when. */
  useWhen: string;
  sections: Section[];
};

/* Cast: these are literals matching the zod union, and every omitted field has
   a default. They are parsed through SectionsSchema on install, which is what
   actually guarantees they are valid. */
const s = (blocks: unknown[]): Section[] => blocks as Section[];

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    slug: "starter-free-audit",
    title: "Starter — Free audit (lead magnet)",
    useWhen:
      "Cold traffic that does not know you. Asks for a small, free commitment instead of a sale.",
    sections: s([
      {
        type: "hero",
        eyebrow: "Free · No obligation",
        heading: "Find out exactly why your site isn't bringing you enquiries",
        highlight: "in 48 hours",
        copy: "A 15-page audit of your site, your search visibility and your ads — written by a human, not a tool. You get the specific fixes, in priority order, whether or not you ever work with us.",
        ctaLabel: "Get my free audit",
        ctaHref: "/free-audit",
        cta2Label: "Talk to someone first",
        cta2Href: "/contact",
      },
      /* The form sits second, immediately under the hero. A free audit is a
         low-risk yes, so the ask goes where the intent is highest rather than
         making someone scroll for it. Every other CTA on the page links away
         to /free-audit — this is the one that converts in place. */
      {
        type: "form",
        heading: "Request your free audit",
        formSlug: "lead-form",
      },
      { type: "logos", heading: "Trusted by", ids: [], limit: 8 },
      {
        type: "cards",
        heading: "What you actually get",
        layout: "checklist",
        items: [
          { title: "Where you rank, and where you don't", copy: "The searches your buyers use, who currently owns them, and the realistic gap to close." },
          { title: "What your site is losing you", copy: "The pages people land on and leave, with the specific reason each one loses them." },
          { title: "Ad spend you are wasting", copy: "If you run ads: the terms, placements and audiences burning budget with nothing to show." },
          { title: "A prioritised fix list", copy: "Ordered by impact against effort, so you can start on Monday. Yours to keep either way." },
        ],
      },
      {
        type: "steps",
        heading: "How it works",
        copy: "No meetings required until you want one.",
        items: [
          { title: "Send your details", copy: "Your site and what you sell. Takes a minute." },
          { title: "We audit it", copy: "A real person goes through your site, search presence and ads." },
          { title: "You get the report", copy: "Within 48 hours, with the fixes ranked by what will move the needle." },
        ],
      },
      { type: "testimonials", heading: "What clients say", ids: [], limit: 3 },
      {
        type: "faq",
        heading: "Before you ask",
        items: [
          { q: "Is it really free?", a: "Yes, and there is no obligation. We would rather show you the work than describe it." },
          { q: "What do you need from me?", a: "Your website address and a sentence about who you sell to. Ad account access only if you want the ads section covered." },
          { q: "Will I get sales calls?", a: "One follow-up to check you received it and answer questions. If you say no thanks, that is the end of it." },
          { q: "How is this different from a free tool report?", a: "A tool lists problems. This tells you which three to fix first and why the rest can wait." },
        ],
      },
      {
        type: "cta",
        heading: "Get your audit",
        copy: "48 hours, no cost, no obligation.",
        ctaLabel: "Get my free audit",
        ctaHref: "/free-audit",
      },
      {
        type: "stickyCta",
        text: "Free 15-page growth audit — 48 hours, no obligation",
        ctaLabel: "Get my audit",
        ctaHref: "/free-audit",
        showAfter: 600,
      },
    ]),
  },

  {
    slug: "starter-google-ads",
    title: "Starter — Google Ads / PPC",
    useWhen:
      "High-intent search traffic for 'ppc agency', 'google ads management'. Leads with the money being wasted.",
    sections: s([
      {
        type: "hero",
        eyebrow: "Google & Meta Ads management",
        heading: "You're paying for clicks that were never going to buy",
        highlight: "Let's fix that first",
        copy: "Most accounts we take over are spending a third of the budget on terms that have never produced an enquiry. We find them in week one, then rebuild around what actually converts.",
        ctaLabel: "Get a free account review",
        ctaHref: "/free-audit",
        cta2Label: "Talk to us",
        cta2Href: "/contact",
      },
      // Same reasoning as the audit template: a free account review is a low
      // -risk yes, so the form goes high rather than at the end.
      {
        type: "form",
        heading: "Get your free account review",
        formSlug: "lead-form",
      },
      { type: "logos", heading: "", ids: [], limit: 8 },
      {
        type: "cards",
        heading: "What we take off your hands",
        layout: "cards",
        items: [
          { title: "Account rebuild", copy: "Structure, match types and negatives redone so budget follows intent rather than volume." },
          { title: "Landing pages that match", copy: "The click and the page say the same thing. Most wasted spend dies in that gap." },
          { title: "Conversion tracking you can trust", copy: "Proper event and offline-conversion setup, so the numbers you optimise against are real." },
          { title: "Weekly reporting", copy: "Spend, leads, cost per lead. In your inbox, in plain language, every week." },
        ],
      },
      {
        type: "comparison",
        heading: "How we compare",
        copy: "Same budget, different outcome.",
        columns: [
          { label: "DigiSutra", highlight: true },
          { label: "Typical agency", highlight: false },
          { label: "In-house", highlight: false },
        ],
        rows: [
          { label: "Named person on your account", values: ["yes", "no", "yes"] },
          { label: "Reporting", values: ["Weekly", "Monthly", "When asked"] },
          { label: "Landing pages included", values: ["yes", "no", "no"] },
          { label: "Lock-in contract", values: ["no", "yes", "-"] },
          { label: "You own the ad account", values: ["yes", "no", "yes"] },
        ],
      },
      {
        type: "steps",
        heading: "The first 30 days",
        copy: "",
        items: [
          { title: "Audit", copy: "We find the waste and size the opportunity. Free, before you commit." },
          { title: "Rebuild", copy: "Structure, targeting and tracking rebuilt around intent." },
          { title: "Launch", copy: "Live with the new structure and matching landing pages." },
          { title: "Report", copy: "Weekly numbers, and a call whenever you want one." },
        ],
      },
      { type: "testimonials", heading: "What clients say", ids: [], limit: 3 },
      {
        type: "pricing",
        heading: "What it costs",
        copy: "No lock-in. Cancel with a month's notice.",
        ids: [],
      },
      {
        type: "faq",
        heading: "Common questions",
        items: [
          { q: "What's the minimum ad budget?", a: "Below roughly [set your floor, e.g. ₹50,000] a month there is not enough data to optimise against, so we would tell you to wait." },
          { q: "Do we keep our account?", a: "Always. We work inside your account, you own it, and you keep the history if we part ways." },
          { q: "How soon do we see results?", a: "Waste usually drops in the first fortnight. A dependable cost per lead takes about [set a realistic window, e.g. 6–8 weeks]." },
          { q: "Do you do Meta and LinkedIn too?", a: "Yes. Where the budget goes depends on where your buyers actually decide." },
        ],
      },
      {
        type: "cta",
        heading: "Find out what your account is wasting",
        copy: "Free review, no obligation.",
        ctaLabel: "Get a free account review",
        ctaHref: "/free-audit",
      },
      {
        type: "stickyCta",
        text: "Free ad-account review — see the waste before you commit",
        ctaLabel: "Get my review",
        ctaHref: "/free-audit",
        showAfter: 600,
      },
    ]),
  },

  {
    slug: "starter-seo-aeo",
    title: "Starter — SEO & AI search (AEO/GEO)",
    useWhen:
      "Buyers searching for SEO help. Leads with the shift to AI answers, which is the argument competitors are not making yet.",
    sections: s([
      {
        type: "hero",
        eyebrow: "SEO · AEO · GEO",
        heading: "Ranking isn't enough when the answer appears above the results",
        highlight: "Get cited, not just listed",
        copy: "Buyers increasingly get an answer without clicking anything. We optimise for both: the classic rankings that still send traffic, and the AI answers that now sit above them.",
        ctaLabel: "See where you stand",
        ctaHref: "/free-audit",
        cta2Label: "Talk to us",
        cta2Href: "/contact",
      },
      {
        type: "richText",
        eyebrow: "The shift",
        heading: "Being on page one is no longer the finish line",
        body: "A search that once sent a visitor to your site now often ends in an answer box. The click never happens, and the brand named in that answer wins the consideration.\n\nThat does not make SEO obsolete — it changes what the work is. Structured, answer-first content that a model can quote. Entities and schema that make it unambiguous who you are. Genuine authority signals that make you worth quoting.\n\nWe do the classic work because it still pays, and the answer-engine work because that is where the next few years go.",
        image: "",
        imageAlt: "",
      },
      { type: "logos", heading: "", ids: [], limit: 8 },
      {
        type: "cards",
        heading: "What the work looks like",
        layout: "bento",
        items: [
          { title: "Technical foundation", copy: "Crawlability, speed, Core Web Vitals and schema — the part that quietly caps everything else." },
          { title: "Answer-first content", copy: "Pages that state the answer, then justify it. Reads better for people and is quotable by models." },
          { title: "Entity and authority", copy: "Making it unambiguous who you are, what you do and why you are worth citing." },
          { title: "Reporting that means something", copy: "Rankings, yes — but also enquiries. Position 3 that produces nothing is not a win." },
        ],
      },
      {
        type: "steps",
        heading: "How we work",
        copy: "",
        items: [
          { title: "Audit", copy: "Where you rank, where you are cited, and the gap to the people beating you." },
          { title: "Plan", copy: "A costed 90-day roadmap, ordered by impact against effort." },
          { title: "Build", copy: "Fixes and content shipped, not just recommended." },
          { title: "Report", copy: "Monthly, in numbers you can check yourself." },
        ],
      },
      { type: "caseStudies", heading: "Selected work", ids: [], limit: 3 },
      { type: "testimonials", heading: "What clients say", ids: [], limit: 3 },
      {
        type: "faq",
        heading: "Common questions",
        items: [
          { q: "How long until we see movement?", a: "Technical fixes can show within weeks. Competitive terms are a [set a realistic window, e.g. 4–6 month] job, and anyone promising faster is guessing." },
          { q: "What is AEO / GEO?", a: "Answer Engine and Generative Engine Optimisation — being the source an AI answer cites, rather than a link below it." },
          { q: "Do you guarantee rankings?", a: "No, and be wary of anyone who does. We commit to the work and report honestly on what it produces." },
          { q: "Do we need new content?", a: "Usually some. Often the bigger win is restructuring what you already have so it answers the question first." },
        ],
      },
      /* Late, unlike the audit templates. AEO/GEO is a category most buyers
         have no language for yet — the argument has to land before the ask, or
         the form reads as noise. It sits before the closing CTA so the page
         still ends on a clear next step. */
      {
        type: "form",
        heading: "See where you stand in AI answers",
        formSlug: "lead-form",
      },
      {
        type: "cta",
        heading: "See where you actually stand",
        copy: "Free audit covering rankings, AI visibility and the gap to close.",
        ctaLabel: "Get my free audit",
        ctaHref: "/free-audit",
      },
      {
        type: "stickyCta",
        text: "Free audit — rankings, AI visibility and what to fix first",
        ctaLabel: "Get my audit",
        ctaHref: "/free-audit",
        showAfter: 600,
      },
    ]),
  },

  {
    slug: "starter-web-build",
    title: "Starter — Website & e-commerce build",
    useWhen:
      "Higher-value, longer-consideration traffic. Weighted towards proof and process, because the risk feels bigger.",
    sections: s([
      {
        type: "hero",
        eyebrow: "Websites · E-commerce · Web apps",
        heading: "A site that sells, not just one that looks finished",
        highlight: "Built to convert",
        copy: "Design, build and launch — with the tracking, speed and search foundations in place from day one, so the site starts earning instead of waiting for a phase two that never gets funded.",
        ctaLabel: "Get a quote",
        ctaHref: "/contact",
        cta2Label: "See our work",
        cta2Href: "/work",
      },
      { type: "logos", heading: "Brands we've built for", ids: [], limit: 8 },
      {
        type: "cards",
        heading: "What's included",
        layout: "cards",
        items: [
          { title: "Design that fits your buyer", copy: "Not a template with your logo dropped in. Structured around the decision your customer is making." },
          { title: "Built to be fast", copy: "Core Web Vitals treated as a requirement, because speed is both ranking and revenue." },
          { title: "Search-ready at launch", copy: "Structure, schema and metadata done during the build, not bolted on afterwards." },
          { title: "You can edit it", copy: "A CMS your team can actually use, so you are not raising a ticket to change a headline." },
          { title: "Tracking that works", copy: "Analytics and conversion tracking wired up and verified before go-live." },
          { title: "Support after launch", copy: "We are still there the week after, which is when the real questions arrive." },
        ],
      },
      {
        type: "steps",
        heading: "How a build runs",
        copy: "Fixed scope, fixed price, no surprise invoices.",
        items: [
          { title: "Discovery", copy: "Who buys, what stops them, what the site has to do." },
          { title: "Design", copy: "Key pages designed and agreed before anyone writes code." },
          { title: "Build", copy: "Built, reviewed with you weekly, tested on real devices." },
          { title: "Launch", copy: "Migration, redirects and tracking — then we watch the first week with you." },
        ],
      },
      { type: "caseStudies", heading: "Recent work", ids: [], limit: 3 },
      { type: "testimonials", heading: "What clients say", ids: [], limit: 3 },
      {
        type: "comparison",
        heading: "What you're choosing between",
        copy: "",
        columns: [
          { label: "DigiSutra", highlight: true },
          { label: "Template site", highlight: false },
          { label: "Freelancer", highlight: false },
        ],
        rows: [
          { label: "Fixed price agreed up front", values: ["yes", "yes", "no"] },
          { label: "SEO built in at launch", values: ["yes", "no", "-"] },
          { label: "Conversion tracking verified", values: ["yes", "no", "-"] },
          { label: "Support after launch", values: ["yes", "no", "-"] },
          { label: "Someone answers next year", values: ["yes", "-", "-"] },
        ],
      },
      {
        type: "faq",
        heading: "Common questions",
        items: [
          { q: "How long does a build take?", a: "A marketing site is typically [set your range, e.g. 4–6 weeks]; e-commerce and web apps depend on scope, which we fix before starting." },
          { q: "What does it cost?", a: "Quoted per project after discovery, so you are not paying for scope you do not need. No hourly surprises." },
          { q: "Will we lose our rankings?", a: "Not if the migration is done properly. Redirect mapping is part of every build, not an extra." },
          { q: "Can we edit it ourselves?", a: "Yes. Every build ships with a CMS your team is trained on before handover." },
        ],
      },
      /* Late, like the AEO template. Nobody commissions a build off a headline
         — the work, the price and the comparison have to come first. */
      {
        type: "form",
        heading: "Tell us what you're building",
        formSlug: "lead-form",
      },
      {
        type: "cta",
        heading: "Tell us what you need",
        copy: "A quick call, then a fixed quote. No pressure either way.",
        ctaLabel: "Get a quote",
        ctaHref: "/contact",
      },
      {
        type: "stickyCta",
        text: "Fixed-price website and e-commerce builds",
        ctaLabel: "Get a quote",
        ctaHref: "/contact",
        showAfter: 700,
      },
    ]),
  },
];
