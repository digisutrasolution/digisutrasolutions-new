"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Bot,
  ChartColumn,
  Check,
  Code,
  CreditCard,
  Database,
  Mail,
  Megaphone,
  MessageCircle,
  Mic,
  Monitor,
  MousePointerClick,
  Plug,
  Receipt,
  Search,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Target,
  Truck,
  Users,
  Workflow,
  Zap,
} from "lucide-react";

const SLIDE_MS = 5200;

type SlideTheme = "light" | "dark" | "orange" | "cream";

type TrustChip = { label: string; icon: LucideIcon };

type Slide = {
  eyebrow: string;
  copy: string;
  cta: { label: string; href: string };
  cta2?: { label: string; href: string };
  trust?: TrustChip[];
  theme: SlideTheme;
};

const SLIDES: Slide[] = [
  {
    eyebrow: "01 — AI-powered digital marketing",
    copy: "Generate more leads, automate workflows and dominate search using AI, SEO, PPC and social — one growth partner.",
    cta: { label: "Get free strategy call ↗", href: "/contact" },
    cta2: { label: "View our services", href: "/#services" },
    trust: [
      { label: "500+ happy clients", icon: Users },
      { label: "Top rated agency", icon: Award },
      { label: "100% trusted", icon: ShieldCheck },
    ],
    theme: "dark",
  },
  {
    eyebrow: "02 — Software development",
    copy: "Websites, e-commerce stores, web apps and AI automation agents — built to scale.",
    cta: { label: "Explore development ↗", href: "/#services" },
    cta2: { label: "See our work", href: "/work" },
    trust: [
      { label: "250+ projects shipped", icon: Code },
      { label: "214ms avg response", icon: Zap },
      { label: "ISO 27001", icon: ShieldCheck },
    ],
    theme: "dark",
  },
  {
    eyebrow: "03 — AI solutions",
    copy: "Chatbots, workflow automation and AI integrations for support, sales and ops.",
    cta: { label: "See AI in action ↗", href: "/#services" },
    cta2: { label: "View case studies", href: "/#case-studies" },
    trust: [
      { label: "24/7 always on", icon: Bot },
      { label: "80% auto-resolved", icon: MessageCircle },
      { label: "Human handoff built in", icon: Users },
    ],
    theme: "dark",
  },
  {
    eyebrow: "04 — E-commerce",
    copy: "Sub-second storefronts with automated inventory sync and payments built in.",
    cta: { label: "Launch your store ↗", href: "/contact" },
    cta2: { label: "View pricing", href: "/pricing" },
    trust: [
      { label: "Sub-second loads", icon: Zap },
      { label: "UPI + cards + EMI", icon: CreditCard },
      { label: "Logistics-ready", icon: Truck },
    ],
    theme: "dark",
  },
];

const SLIDE_BG: Record<SlideTheme, string> = {
  light: "bg-[#FFFBF7]",
  dark: "bg-stone-900",
  orange: "bg-[linear-gradient(115deg,#7C2D12,#C2410C_45%,#F97316)]",
  cream: "bg-stone-100",
};

/* One masked headline line: rises out of an overflow-hidden wrapper. */
function HeadlineLine({
  delay,
  children,
}: {
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <span className="hl-line">
      <span style={{ animationDelay: `${delay}s` }}>{children}</span>
    </span>
  );
}

function SlideHeadline({ index }: { index: number }) {
  const h =
    "font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl";
  const grad =
    "grad-shimmer bg-[linear-gradient(100deg,#EA580C,#F59E0B)] bg-clip-text text-transparent";

  switch (index) {
    case 0:
      return (
        <h1 className={`${h} text-stone-50`}>
          <HeadlineLine delay={0.1}>Scale your business</HeadlineLine>
          <HeadlineLine delay={0.22}>
            with <span className="text-[#F26419]">AI-powered</span>
          </HeadlineLine>
          <HeadlineLine delay={0.34}>
            <span className={grad}>digital marketing</span>
          </HeadlineLine>
        </h1>
      );
    case 1:
      return (
        <h2 className={`${h} text-stone-50`}>
          <HeadlineLine delay={0.1}>Software that runs</HeadlineLine>
          <HeadlineLine delay={0.22}>
            your <span className="text-[#F26419]">business</span>
          </HeadlineLine>
          <HeadlineLine delay={0.34}>
            <span className={grad}>end to end</span>
          </HeadlineLine>
        </h2>
      );
    case 2:
      return (
        <h2 className={`${h} text-stone-50`}>
          <HeadlineLine delay={0.1}>AI that works</HeadlineLine>
          <HeadlineLine delay={0.22}>
            <span className="font-serif-accent font-medium italic text-[#F26419]">
              while you sleep
            </span>
          </HeadlineLine>
          <HeadlineLine delay={0.34}>
            <span className={grad}>and closes deals</span>
          </HeadlineLine>
        </h2>
      );
    default:
      return (
        <h2 className={`${h} text-stone-50`}>
          <HeadlineLine delay={0.1}>Stores built</HeadlineLine>
          <HeadlineLine delay={0.22}>
            to <span className="text-[#F26419]">sell</span>
          </HeadlineLine>
          <HeadlineLine delay={0.34}>
            <span className={grad}>on autopilot</span>
          </HeadlineLine>
        </h2>
      );
  }
}

type PanelItem = { label: string; icon: LucideIcon };

const AI_SERVICES: PanelItem[] = [
  { label: "SEO & local SEO", icon: Search },
  { label: "Google Ads (PPC)", icon: MousePointerClick },
  { label: "Meta Ads", icon: Megaphone },
  { label: "Social media", icon: Share2 },
  { label: "Email marketing", icon: Mail },
  { label: "Web development", icon: Code },
  { label: "AI chatbots & agents", icon: Bot },
];

const DEV_STACK: PanelItem[] = [
  { label: "Business websites", icon: Monitor },
  { label: "E-commerce stores", icon: ShoppingCart },
  { label: "Web applications", icon: Code },
  { label: "AI automation agents", icon: Sparkles },
  { label: "Landing pages & funnels", icon: Target },
  { label: "Speed & Core Web Vitals", icon: Zap },
  { label: "API integrations", icon: Plug },
];

const AI_DEPLOYMENTS: PanelItem[] = [
  { label: "Support chatbots", icon: Bot },
  { label: "Workflow automation", icon: Workflow },
  { label: "Lead scoring", icon: Target },
  { label: "WhatsApp agents", icon: MessageCircle },
  { label: "Voice assistants", icon: Mic },
  { label: "Knowledge assistants", icon: BookOpen },
  { label: "Custom integrations", icon: Plug },
];

const STORE_STACK: PanelItem[] = [
  { label: "Storefront & PWA", icon: Store },
  { label: "Payments & UPI", icon: CreditCard },
  { label: "Auto inventory sync", icon: Database },
  { label: "Shipping & logistics", icon: Truck },
  { label: "Marketing automation", icon: Megaphone },
  { label: "Sales analytics", icon: ChartColumn },
  { label: "GST-ready invoicing", icon: Receipt },
];

const CARD =
  "rounded-2xl border border-stone-700 bg-stone-800 shadow-[0_20px_50px_rgba(0,0,0,0.35)]";

/* Shared command-center frame: services panel left, stacked cards right,
   floating badge on top. */
function CommandShell({
  panelTitle,
  panelItems,
  badge,
  children,
}: {
  panelTitle: string;
  panelItems: PanelItem[];
  badge: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative w-full max-w-sm lg:max-w-[26rem]">
      <div className="grid grid-cols-[0.92fr_1.08fr] gap-2.5">
        <div className={`${CARD} p-3.5`}>
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-orange-300">
            {panelTitle}
          </p>
          <ul className="space-y-2 text-[11px] font-medium text-stone-200">
            {panelItems.map((s) => (
              <li key={s.label} className="flex items-center gap-2">
                <s.icon size={12} className="shrink-0 text-[#F26419]" aria-hidden />
                {s.label}
              </li>
            ))}
            <li className="pt-0.5 font-semibold text-orange-300">&amp; more →</li>
          </ul>
        </div>
        <div className="flex flex-col gap-2.5">{children}</div>
      </div>
      <span className="animate-float-y absolute -right-2 -top-3 rounded-full border border-orange-400/40 bg-stone-800 px-3.5 py-1.5 text-xs font-semibold text-orange-300">
        {badge}
      </span>
    </div>
  );
}

function ChecksCard({
  icon: Icon,
  title,
  checks,
}: {
  icon: LucideIcon;
  title: string;
  checks: string[];
}) {
  return (
    <div className="rounded-2xl border border-[#F26419]/70 bg-stone-800 p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-orange-300">
        <Icon size={13} aria-hidden /> {title}
      </p>
      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] font-medium text-stone-200">
        {checks.map((c) => (
          <span key={c} className="flex items-center gap-1.5">
            <Check size={12} className="shrink-0 text-[#F26419]" aria-hidden />
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  delta,
  accent,
}: {
  label: string;
  value: string;
  delta: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg bg-stone-900 px-2.5 py-1.5">
      <p className="text-[11px] text-stone-400">{label}</p>
      <p className={`text-sm font-bold ${accent ? "text-[#F26419]" : "text-white"}`}>
        {value}{" "}
        <span className="text-[11px] font-semibold text-green-400">{delta}</span>
      </p>
    </div>
  );
}

function AiCommandVisual() {
  return (
    <CommandShell
      panelTitle="Our services"
      panelItems={AI_SERVICES}
      badge="#1 Google rankings · +45 keywords"
    >
      <div className={`shine-sweep ${CARD} p-3.5`}>
        <div className="mb-1.5 flex items-center justify-between text-[11px]">
          <span className="font-semibold text-stone-200">
            Marketing performance
          </span>
          <span className="font-semibold text-green-400">▲ live</span>
        </div>
        <svg viewBox="0 0 200 56" className="w-full" aria-hidden>
          <polyline
            className="draw-line"
            pathLength={1}
            style={{ animationDelay: "0.45s" }}
            points="0,48 25,41 50,44 75,30 100,34 125,20 150,24 175,12 200,8"
            fill="none"
            stroke="#F26419"
            strokeWidth="2.5"
          />
          <polyline
            className="draw-line"
            pathLength={1}
            style={{ animationDelay: "0.8s" }}
            points="0,52 25,49 50,50 75,44 100,46 125,39 150,41 175,34 200,31"
            fill="none"
            stroke="#FDBA74"
            strokeWidth="1.5"
            opacity="0.55"
          />
        </svg>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <StatTile label="Total leads" value="21,580" delta="+18.5%" />
          <StatTile label="Campaign ROI" value="356%" delta="+32.5%" accent />
        </div>
      </div>
      <ChecksCard
        icon={Bot}
        title="AI marketing assistant"
        checks={["Analyze", "Automate", "Optimize", "Generate results"]}
      />
    </CommandShell>
  );
}

function DevCommandVisual() {
  return (
    <CommandShell
      panelTitle="What we build"
      panelItems={DEV_STACK}
      badge="250+ projects shipped"
    >
      <div className={`shine-sweep overflow-hidden ${CARD}`}>
        <div className="flex items-center gap-1.5 border-b border-stone-700 px-3.5 py-2">
          <span className="h-2 w-2 rounded-full bg-stone-600" />
          <span className="h-2 w-2 rounded-full bg-stone-600" />
          <span className="h-2 w-2 rounded-full bg-stone-600" />
          <span className="ml-1.5 text-[11px] text-stone-500">
            apps.digisutra.dev
          </span>
        </div>
        <div className="space-y-1.5 p-3.5 font-mono text-[11px] leading-relaxed text-stone-400">
          <p>
            <span className="term-type">
              <span className="text-[#F26419]">$</span> digisutra deploy site
            </span>
          </p>
          <p className="term-line" style={{ animationDelay: "1.6s" }}>
            <span className="text-green-400">✓</span> store + funnels + blog
            live
          </p>
          <p className="term-line" style={{ animationDelay: "2.2s" }}>
            <span className="text-green-400">✓</span> 214ms avg response
            <span className="animate-blink">▌</span>
          </p>
        </div>
      </div>
      <ChecksCard
        icon={ShieldCheck}
        title="Engineering standards"
        checks={[
          "Scalable architecture",
          "Secure by default",
          "99.9% uptime",
          "CI/CD delivery",
        ]}
      />
    </CommandShell>
  );
}

function BotCommandVisual() {
  return (
    <CommandShell
      panelTitle="AI we deploy"
      panelItems={AI_DEPLOYMENTS}
      badge="80% queries auto-resolved"
    >
      <div className={`shine-sweep ${CARD} p-3.5`}>
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-orange-300">
          <Bot size={13} aria-hidden /> SutraBot · online
        </p>
        <div
          className="chat-pop max-w-[90%] rounded-xl rounded-bl-sm bg-stone-900 px-3 py-2 text-[11px] leading-relaxed text-stone-200"
          style={{ animationDelay: "0.45s" }}
        >
          Hi! I can book a demo, quote a project or track your order.
        </div>
        <div
          className="chat-pop ml-auto mt-2 max-w-[75%] rounded-xl rounded-br-sm bg-[#F26419] px-3 py-2 text-[11px] leading-relaxed text-white"
          style={{ animationDelay: "1.15s" }}
        >
          Automate my lead follow-ups
        </div>
        <p className="chat-pop mt-2 text-[11px] text-stone-400" style={{ animationDelay: "1.75s" }}>
          SutraBot is typing<span className="animate-blink">…</span>
        </p>
      </div>
      <ChecksCard
        icon={Zap}
        title="Always on"
        checks={[
          "24/7 support",
          "80% auto-resolved",
          "Human handoff",
          "Multilingual",
        ]}
      />
    </CommandShell>
  );
}

function StoreCommandVisual() {
  return (
    <CommandShell
      panelTitle="Your store stack"
      panelItems={STORE_STACK}
      badge="✓ order #4,812 just placed"
    >
      <div className={`shine-sweep ${CARD} p-3.5`}>
        <div className="mb-1.5 flex items-center justify-between text-[11px]">
          <span className="font-semibold text-stone-200">Store performance</span>
          <span className="font-semibold text-green-400">▲ live</span>
        </div>
        <svg viewBox="0 0 200 56" className="w-full" aria-hidden>
          {(
            [
              [4, 36, 18, 20, "#7C2D12"],
              [30, 30, 18, 26, "#9A3412"],
              [56, 33, 18, 23, "#9A3412"],
              [82, 22, 18, 34, "#C2410C"],
              [108, 26, 18, 30, "#C2410C"],
              [134, 14, 18, 42, "#F26419"],
              [160, 18, 18, 38, "#F26419"],
              [186, 6, 10, 50, "#FB923C"],
            ] as const
          ).map(([x, y, w, hh, fill], i) => (
            <rect
              key={x}
              className="bar-grow"
              style={{ animationDelay: `${0.45 + i * 0.07}s` }}
              x={x}
              y={y}
              width={w}
              height={hh}
              rx="2"
              fill={fill}
            />
          ))}
        </svg>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <StatTile label="Orders today" value="1,204" delta="+21%" />
          <StatTile label="Avg order" value="₹2,340" delta="+9%" accent />
        </div>
      </div>
      <ChecksCard
        icon={Zap}
        title="Built to sell"
        checks={[
          "Sub-second loads",
          "One-tap checkout",
          "Auto stock sync",
          "GST invoices",
        ]}
      />
    </CommandShell>
  );
}

function SlideVisual({ index }: { index: number }) {
  switch (index) {
    case 0:
      return <AiCommandVisual />;
    case 1:
      return <DevCommandVisual />;
    case 2:
      return <BotCommandVisual />;
    default:
      return <StoreCommandVisual />;
  }
}

/* Per-slide phone screen: dashboard / deploy / chat / storefront. */
function PhoneScreen({ index }: { index: number }) {
  switch (index) {
    case 0:
      return (
        <div className="flex min-h-[250px] flex-col justify-between rounded-xl bg-[#FFFBF7] p-2.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-stone-900">
            <span>
              DIGI<span className="text-[#F26419]">SUTRA</span>
            </span>
            <span className="text-[9px] font-semibold text-green-600">▲ live</span>
          </div>
          <svg viewBox="0 0 150 40" className="mt-1.5 w-full" aria-hidden>
            <polyline
              points="0,34 20,28 40,31 60,20 80,24 100,13 125,16 150,6"
              fill="none"
              stroke="#F26419"
              strokeWidth="2.5"
            />
          </svg>
          <div className="mt-1.5 grid grid-cols-2 gap-1 text-[9px]">
            <div className="rounded-md bg-orange-50 px-1.5 py-1 text-stone-600">
              ROI <b className="text-[#F26419]">356%</b>
            </div>
            <div className="rounded-md bg-orange-50 px-1.5 py-1 text-stone-600">
              Leads <b className="text-stone-900">21.5k</b>
            </div>
          </div>
          <div className="mt-1.5 rounded-full bg-stone-900 py-1 text-center text-[9px] font-semibold text-white">
            View dashboard
          </div>
        </div>
      );
    case 1:
      return (
        <div className="flex min-h-[250px] flex-col justify-between rounded-xl bg-stone-900 p-2.5 font-mono text-[9px] leading-relaxed text-stone-400">
          <div className="mb-1.5 flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-stone-700" />
            <span className="h-1.5 w-1.5 rounded-full bg-stone-700" />
            <span className="h-1.5 w-1.5 rounded-full bg-stone-700" />
          </div>
          <p>
            <span className="text-[#F26419]">$</span> digisutra deploy site
          </p>
          <p>
            <span className="text-green-400">✓</span> funnels live
          </p>
          <p>
            <span className="text-green-400">✓</span> 214ms avg
            <span className="animate-blink">▌</span>
          </p>
          <div className="mt-2 flex h-10 items-center justify-center rounded-md bg-stone-800">
            <Code size={14} className="text-[#F26419]" aria-hidden />
          </div>
          <div className="mt-1.5 rounded-md bg-[#F26419]/20 py-0.5 text-center text-[9px] text-orange-300">
            build passing
          </div>
        </div>
      );
    case 2:
      return (
        <div className="flex min-h-[250px] flex-col justify-between rounded-xl bg-[#FFFBF7] p-2.5">
          <p className="flex items-center gap-1 text-[9px] font-semibold text-stone-900">
            <Bot size={11} className="text-[#F26419]" aria-hidden /> SutraBot ·
            online
          </p>
          <div className="mt-1.5 max-w-[85%] rounded-lg rounded-bl-sm bg-stone-200 px-2 py-1 text-[9px] leading-snug text-stone-700">
            Hi! Book a demo or get a quote?
          </div>
          <div className="ml-auto mt-1.5 max-w-[75%] rounded-lg rounded-br-sm bg-[#F26419] px-2 py-1 text-[9px] leading-snug text-white">
            Automate my lead follow-ups
          </div>
          <div className="mt-1.5 max-w-[55%] rounded-lg rounded-bl-sm bg-stone-200 px-2 py-1 text-[9px] text-stone-500">
            typing…
          </div>
          <div className="mt-1.5 rounded-full bg-stone-900 py-1 text-center text-[9px] font-semibold text-white">
            24/7 · replies in 5s
          </div>
        </div>
      );
    default:
      return (
        <div className="flex min-h-[250px] flex-col justify-between rounded-xl bg-[#FFFBF7] p-2.5">
          <div className="text-[10px] font-bold text-stone-900">
            DIGI<span className="text-[#F26419]">STORE</span>
          </div>
          <div className="mt-1.5 flex h-12 items-center justify-center rounded-lg bg-[linear-gradient(120deg,#F26419,#FB923C)]">
            <ShoppingCart size={16} className="text-white" aria-hidden />
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-1">
            <div className="h-7 rounded-md bg-orange-100" />
            <div className="h-7 rounded-md bg-orange-100" />
          </div>
          <div className="mt-1.5 rounded-full bg-stone-900 py-1 text-center text-[9px] font-semibold text-white">
            Buy now · ₹4,299
          </div>
          <p className="mt-1 text-center text-[9px] font-semibold text-green-600">
            ✓ order #4,812 placed
          </p>
        </div>
      );
  }
}

/* Tilted floating phone that anchors the middle of each slide. */
function PhoneMockup({ index }: { index: number }) {
  return (
    <div className="-rotate-[4deg]" aria-hidden>
      <div className="animate-float-y w-[200px] rounded-[1.6rem] border-2 border-stone-700 bg-[#0f0f0f] p-2 shadow-[0_30px_60px_rgba(0,0,0,0.55),0_0_0_1px_rgba(242,100,25,0.18)]">
        <div className="mx-auto mb-1.5 h-1 w-10 rounded-full bg-stone-800" />
        <PhoneScreen index={index} />
      </div>
    </div>
  );
}

function RotatingBadge() {
  return (
    <div
      className="animate-spin-slow pointer-events-none absolute right-8 top-24 z-20 hidden h-28 w-28 lg:block"
      aria-hidden
    >
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <defs>
          <path
            id="badge-circle"
            d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0"
          />
        </defs>
        <text className="fill-orange-700 text-[11px] font-semibold tracking-[0.22em]">
          <textPath href="#badge-circle">YOUR GROWTH · OUR SUTRA · </textPath>
        </text>
      </svg>
      <span className="font-display absolute inset-8 flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#F97316,#EA580C)] text-xs font-extrabold text-white">
        DS
      </span>
    </div>
  );
}

const contentVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] as const },
  },
};

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const visX = useTransform(mx, (v) => v * 18);
  const visY = useTransform(my, (v) => v * 12);
  const decorX = useTransform(mx, (v) => v * -12);
  const decorY = useTransform(my, (v) => v * -8);

  const go = useCallback((next: number) => {
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused || reduced) return;
    const t = setTimeout(() => go(index + 1), SLIDE_MS);
    return () => clearTimeout(t);
  }, [index, paused, reduced, go]);

  const slide = SLIDES[index];
  const isDarkText = slide.theme === "dark" || slide.theme === "orange";

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured services"
      className="relative overflow-hidden outline-none"
      onMouseMove={(e) => {
        if (reduced) return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        mx.set(0);
        my.set(0);
      }}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
      tabIndex={0}
    >
      <RotatingBadge />
      <motion.div
        style={{ x: decorX, y: decorY }}
        className="pointer-events-none absolute inset-0 z-10 hidden lg:block"
        aria-hidden
      >
        <span className="animate-twinkle absolute left-[10%] top-28 text-xl text-orange-400">
          ✦
        </span>
        <span
          className="animate-twinkle absolute left-[45%] top-44 text-sm text-amber-500"
          style={{ animationDelay: "1.1s" }}
        >
          ✦
        </span>
        <span
          className="animate-twinkle absolute bottom-24 right-[16%] text-lg text-orange-300"
          style={{ animationDelay: "0.6s" }}
        >
          ✦
        </span>
        <span
          className="animate-twinkle absolute bottom-36 left-[6%] text-sm text-amber-400"
          style={{ animationDelay: "1.8s" }}
        >
          ✦
        </span>
      </motion.div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          initial={reduced ? false : { opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduced ? undefined : { opacity: 0, scale: 0.99 }}
          transition={{ duration: 0.5 }}
          className={`relative ${SLIDE_BG[slide.theme]}`}
        >
          <span
            className={`absolute inset-0 ${
              isDarkText
                ? "bg-dots-light opacity-25"
                : "bg-dots-dark opacity-50"
            }`}
          />
          {slide.theme === "light" && (
            <>
              <span className="animate-aurora absolute -left-10 -top-16 h-72 w-72 rounded-full bg-orange-300 opacity-45 blur-[60px]" />
              <span className="animate-aurora-slow absolute -right-10 top-10 h-64 w-64 rounded-full bg-amber-300 opacity-40 blur-[60px]" />
            </>
          )}
          {slide.theme === "dark" && (
            <span className="animate-aurora absolute -top-16 right-[10%] h-72 w-72 rounded-full bg-orange-500 opacity-25 blur-[70px]" />
          )}
          {slide.theme === "cream" && (
            <span className="animate-aurora absolute -bottom-20 left-[30%] h-72 w-72 rounded-full bg-orange-200 opacity-60 blur-[60px]" />
          )}
          {slide.theme === "orange" && (
            <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_20%,rgba(255,237,213,0.25),transparent_55%)]" />
          )}

          <motion.div
            variants={contentVariants}
            initial={reduced ? false : "hidden"}
            animate="show"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.06}
            onDragEnd={(_, info) => {
              if (info.offset.x < -70) go(index + 1);
              if (info.offset.x > 70) go(index - 1);
            }}
            className="relative mx-auto grid max-w-[1280px] cursor-grab grid-cols-1 items-center gap-10 px-6 pb-28 pt-8 active:cursor-grabbing sm:pt-10 lg:min-h-[660px] lg:grid-cols-[1fr_0.44fr_0.98fr] lg:gap-5"
          >
            <div>
              <motion.p
                variants={itemVariants}
                className={`mb-4 text-xs font-semibold uppercase tracking-[0.3em] ${
                  isDarkText ? "text-orange-200" : "text-orange-800"
                }`}
              >
                {slide.eyebrow}
              </motion.p>
              <motion.div variants={itemVariants}>
                <SlideHeadline index={index} />
              </motion.div>
              <motion.p
                variants={itemVariants}
                className={`mt-5 max-w-md text-sm leading-relaxed sm:text-base ${
                  isDarkText ? "text-orange-50/80" : "text-stone-600"
                }`}
              >
                {slide.copy}
              </motion.p>
              <motion.div
                variants={itemVariants}
                className="mt-7 flex flex-wrap items-center gap-3"
              >
                <Link
                  href={slide.cta.href}
                  className="shine-sweep inline-block rounded-full bg-[#F26419] px-7 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                >
                  {slide.cta.label}
                </Link>
                {slide.cta2 && (
                  <Link
                    href={slide.cta2.href}
                    className={`inline-block rounded-full border px-7 py-3.5 text-sm font-semibold transition-all hover:-translate-y-0.5 ${
                      isDarkText
                        ? "border-white/40 text-white hover:bg-white/10"
                        : "border-stone-300 text-stone-800 hover:border-orange-500"
                    }`}
                  >
                    {slide.cta2.label}
                  </Link>
                )}
              </motion.div>
              {slide.trust && (
                <motion.div
                  variants={itemVariants}
                  className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-stone-400"
                >
                  {slide.trust.map((t) => (
                    <span key={t.label} className="flex items-center gap-1.5">
                      <t.icon size={13} className="text-[#F26419]" aria-hidden />
                      {t.label}
                    </span>
                  ))}
                </motion.div>
              )}
            </div>
            <motion.div
              variants={itemVariants}
              className="hidden justify-center lg:flex"
            >
              <PhoneMockup index={index} />
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="flex w-full justify-center lg:justify-end"
            >
              <motion.div
                className="w-full max-w-sm lg:max-w-[26rem]"
                style={reduced ? undefined : { x: visX, y: visY }}
              >
                <SlideVisual index={index} />
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-x-0 bottom-14 z-20 sm:bottom-16">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6">
          <div className="flex items-center gap-2" role="tablist" aria-label="Slides">
            {SLIDES.map((s, i) => (
              <button
                key={s.eyebrow}
                role="tab"
                aria-selected={i === index}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => go(i)}
                className={`relative h-1.5 cursor-pointer overflow-hidden rounded-full transition-all duration-300 ${
                  i === index
                    ? "w-11 bg-orange-200"
                    : "w-4 bg-stone-300/70 hover:bg-orange-300"
                }`}
              >
                {i === index && !reduced && (
                  <motion.span
                    key={`progress-${index}-${paused}`}
                    initial={{ width: paused ? "100%" : 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: SLIDE_MS / 1000, ease: "linear" }}
                    className="absolute inset-y-0 left-0 rounded-full bg-orange-600"
                  />
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`font-display rounded-full px-3 py-1 text-xs font-bold ${
                isDarkText
                  ? "bg-white/15 text-white"
                  : "bg-white/80 text-stone-500"
              }`}
              aria-live="polite"
            >
              {String(index + 1).padStart(2, "0")} /{" "}
              {String(SLIDES.length).padStart(2, "0")}
            </span>
            <button
              onClick={() => go(index - 1)}
              aria-label="Previous slide"
              className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border transition-colors hover:border-orange-600 hover:bg-orange-600 hover:text-white ${
                isDarkText
                  ? "border-white/30 bg-white/10 text-white"
                  : "border-stone-300 bg-white/85 text-stone-700"
              }`}
            >
              <ArrowLeft size={15} aria-hidden />
            </button>
            <button
              onClick={() => go(index + 1)}
              aria-label="Next slide"
              className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border transition-colors hover:border-orange-600 hover:bg-orange-600 hover:text-white ${
                isDarkText
                  ? "border-white/30 bg-white/10 text-white"
                  : "border-stone-300 bg-white/85 text-stone-700"
              }`}
            >
              <ArrowRight size={15} aria-hidden />
            </button>
          </div>
        </div>
      </div>

    </section>
  );
}
