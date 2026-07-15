"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { withBase } from "@/lib/base-path";
import { animate, motion, useMotionValue } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  BadgeCheck,
  Bot,
  BookOpen,
  Brain,
  Briefcase,
  Building2,
  Calculator,
  CalendarDays,
  ChartColumn,
  ChartLine,
  Clapperboard,
  Cpu,
  Earth,
  FilePen,
  FileSearch,
  FileSpreadsheet,
  FileText,
  HeartHandshake,
  Images,
  Layers,
  Lightbulb,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  MicVocal,
  MonitorSmartphone,
  Newspaper,
  Palette,
  PenTool,
  QrCode,
  Repeat,
  ScrollText,
  Search,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sprout,
  Star,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  Tv,
  Users,
  WandSparkles,
  Wrench,
} from "lucide-react";

const ORANGE = "#F26419";

type MenuItem = { label: string; href: string; icon: LucideIcon };
type NavItem = {
  label: string;
  href: string;
  tagline?: string;
  cols?: number;
  panelImage?: string;
  dropdown?: MenuItem[];
};

const NAV: NavItem[] = [
  {
    label: "About",
    href: "/about",
    tagline: "15+ years. 100+ brands. 7 regions globally.\nBuilt on trust, driven by results.",
    cols: 2,
    panelImage: "/menu-images/about-digisutrasolution.webp",
    dropdown: [
      { label: "Who We Are", href: "/about", icon: Building2 },
      { label: "Why Choose Us", href: "/about/why-choose-us", icon: BadgeCheck },
      { label: "Global Presence", href: "/about/global-presence", icon: Earth },
      { label: "Technology & Innovation", href: "/about/technology", icon: Cpu },
      { label: "Certifications & Partners", href: "/about/certifications", icon: ShieldCheck },
      { label: "Trust Center", href: "/trust-center", icon: Lock },
      { label: "Life At Digisutra", href: "/about/life", icon: HeartHandshake },
      { label: "CSR & Community Impact", href: "/about/csr", icon: Sprout },
    ],
  },
  {
    label: "Services",
    href: "/services",
    tagline: "Full-spectrum digital marketing.\n18 services, one growth partner.",
    cols: 3,
    panelImage: "/menu-images/services.webp",
    dropdown: [
      { label: "AI Development", href: "/services/ai-development", icon: Cpu },
      { label: "AI Marketing", href: "/services/ai-marketing", icon: Brain },
      { label: "AI Automation", href: "/services/ai-automation", icon: Bot },
      { label: "White Label Development", href: "/services/white-label-development", icon: Layers },
      { label: "White Label Marketing", href: "/services/white-label-marketing", icon: Repeat },
      { label: "White Label AI", href: "/services/white-label-ai", icon: Sparkles },
      { label: "SEO & Content Marketing", href: "/services/seo", icon: Search },
      { label: "Pay-Per-Click (PPC)", href: "/services/ppc", icon: TrendingUp },
      { label: "Social Media Marketing", href: "/services/social-media", icon: Share2 },
      { label: "Web Design & Development", href: "/services/web-design", icon: MonitorSmartphone },
      { label: "Email Marketing", href: "/services/email-marketing", icon: Mail },
      { label: "Video Marketing", href: "/services/video-marketing", icon: Clapperboard },
      { label: "Brand Identity & Design", href: "/services/branding", icon: Palette },
      { label: "Performance Analytics", href: "/services/analytics", icon: ChartColumn },
      { label: "Influencer Marketing", href: "/services/influencer-marketing", icon: Star },
      { label: "WhatsApp Marketing", href: "/services/whatsapp-marketing", icon: MessageCircle },
      { label: "SMS Marketing", href: "/services/sms-marketing", icon: Smartphone },
      { label: "Jio Hotstar Advertising", href: "/services/jio-hotstar-ads", icon: Tv },
    ],
  },
  {
    label: "Work",
    href: "/work",
    tagline: "100+ brands. $1B+ revenue\ngenerated for clients.",
    cols: 2,
    panelImage: "/menu-images/work.webp",
    dropdown: [
      { label: "Our Clients", href: "/work/clients", icon: Users },
      { label: "Case Studies", href: "/work/case-studies", icon: Briefcase },
      { label: "Results", href: "/work/results", icon: Trophy },
      { label: "Portfolio", href: "/work/portfolio", icon: Images },
      { label: "Strategy & Consulting", href: "/work/strategy-consulting", icon: Target },
      { label: "Solutions", href: "/solutions", icon: Building2 },
    ],
  },
  {
    label: "Resources",
    href: "/resources",
    tagline: "132 free tools live.\nUse them. Grow. No account needed.",
    cols: 3,
    panelImage: "/menu-images/resources.webp",
    dropdown: [
      { label: "SEO Audit", href: "/resources/seo-audit", icon: FileSearch },
      { label: "SSL Checker", href: "/resources/ssl-checker", icon: Lock },
      { label: "QR Code Generator", href: "/resources/qr-code-generator", icon: QrCode },
      { label: "GST Calculator", href: "/resources/gst-calculator", icon: Calculator },
      { label: "Invoice Generator", href: "/resources/invoice-generator", icon: FileText },
      { label: "Privacy Policy Generator", href: "/resources/privacy-policy-generator", icon: ScrollText },
      { label: "Pomodoro Timer", href: "/resources/pomodoro-timer", icon: Timer },
      { label: "Resume Builder", href: "/resources/resume-builder", icon: FilePen },
      { label: "AI Blog Writer", href: "/resources/ai-blog-writer", icon: PenTool },
      { label: "Keyword Research", href: "/resources/keyword-ideas", icon: Search },
      { label: "Domain Authority Checker", href: "/resources/domain-authority-checker", icon: Award },
      { label: "Google Business Profile Audit", href: "/resources/google-business-profile-audit", icon: MapPin },
      { label: "ROI Calculator", href: "/resources/roi-calculator", icon: TrendingUp },
      { label: "Business Name Generator", href: "/resources/brand-name-generator", icon: WandSparkles },
      { label: "AI Chatbot Builder", href: "/resources/ai-chatbot-builder", icon: Bot },
      { label: "Google Review Link Generator", href: "/resources/google-review-link", icon: Star },
      { label: "KPI Dashboard", href: "/resources/kpi-dashboard", icon: ChartColumn },
      { label: "CSV Cleaner", href: "/resources/csv-cleaner", icon: FileSpreadsheet },
      { label: "→ View All 132 Free Tools", href: "/resources", icon: Wrench },
    ],
  },
  {
    label: "Newsroom",
    href: "/news-media",
    tagline: "Insights, trends & stories\nfrom the world of digital marketing.",
    cols: 2,
    panelImage: "/menu-images/newsroom.webp",
    dropdown: [
      { label: "Blog", href: "/news-media/blog", icon: BookOpen },
      { label: "Latest News", href: "/news-media/latest-news", icon: Newspaper },
      { label: "Industry Insights", href: "/news-media/industry-insights", icon: Lightbulb },
      { label: "Marketing Trends", href: "/news-media/marketing-trends", icon: ChartLine },
      { label: "Podcasts & Interviews", href: "/news-media/podcasts", icon: MicVocal },
      { label: "Events & Webinars", href: "/news-media/events", icon: CalendarDays },
      { label: "Awards & Recognition", href: "/news-media/awards", icon: Award },
    ],
  },
  { label: "Pricing", href: "/pricing" },
  { label: "Career", href: "/career" },
  { label: "Referral", href: "/referral-program" },
];

const SOCIALS: { label: string; href: string; viewBox: string; path: string }[] = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61585578555272",
    viewBox: "0 0 512 512",
    path: "M512 256C512 114.6 397.4 0 256 0S0 114.6 0 256C0 376 82.7 476.8 194.2 504.5V334.2H141.4V256h52.8V222.3c0-87.1 39.4-127.5 125-127.5c16.2 0 44.2 3.2 55.7 6.4V172c-6-.6-16.5-1-29.6-1c-42 0-58.2 15.9-58.2 57.2V256h83.6l-14.4 78.2H287V510.1C413.8 494.8 512 386.9 512 256h0z",
  },
  {
    label: "X",
    href: "https://x.com/Digisutra__",
    viewBox: "0 0 512 512",
    path: "M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/digisutrasolutions",
    viewBox: "0 0 448 512",
    path: "M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/digisutrasolutionsofficial/",
    viewBox: "0 0 448 512",
    path: "M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@DigiSutraSolutions",
    viewBox: "0 0 576 512",
    path: "M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z",
  },
  {
    label: "Pinterest",
    href: "https://in.pinterest.com/digisutrasolutionsofficial/",
    viewBox: "0 0 384 512",
    path: "M204 6.5C101.4 6.5 0 74.9 0 185.6 0 256 39.6 296 63.6 296c9.9 0 15.6-27.6 15.6-35.4 0-9.3-23.7-29.1-23.7-67.8 0-80.4 61.2-137.4 140.4-137.4 68.1 0 118.5 38.7 118.5 109.8 0 53.1-21.3 152.7-90.3 152.7-24.9 0-46.2-18-46.2-43.8 0-37.8 26.4-74.4 26.4-113.4 0-66.2-93.9-54.2-93.9 25.8 0 16.8 2.1 35.4 9.6 50.7-13.8 59.4-42 147.9-42 209.1 0 18.9 2.7 37.5 4.5 56.4 3.4 3.8 1.7 3.4 6.9 1.5 50.4-69 48.6-82.5 71.4-172.8 12.3 23.4 44.1 36 69.3 36 106.2 0 153.9-103.5 153.9-196.8C384 71.3 298.2 6.5 204 6.5z",
  },
];

function ArrowRightIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className="shrink-0" aria-hidden>
      <path
        d="M2.5 7H11.5M8 3.5L11.5 7L8 10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CaretIcon({ open }: { open?: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path
        d="M1.5 3.5L5 7l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DollarIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className="shrink-0" aria-hidden>
      <path
        d="M7 1v12M9.5 3.5a2.5 2 0 00-5 0c0 1.38 1.12 2 2.5 2.5S10 7.12 10 8.5a2.5 2 0 01-5 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className="shrink-0" aria-hidden>
      <path
        d="M12.5 9.8v1.5a1 1 0 01-1.09 1 9.9 9.9 0 01-4.31-1.53A9.75 9.75 0 013.6 7.3 9.9 9.9 0 012.08 3.1 1 1 0 013.07 2h1.5a1 1 0 011 .86c.063.48.18.95.35 1.4a1 1 0 01-.22 1.06L5.04 6a8 8 0 003 3l.68-.68a1 1 0 011.06-.23c.45.17.92.29 1.4.35a1 1 0 01.87 1.02z"
        stroke={color ?? "currentColor"}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailStrokeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2" stroke={ORANGE} strokeWidth="1.8" />
      <path d="M2 7l10 7 10-7" stroke={ORANGE} strokeWidth="1.8" />
    </svg>
  );
}

function WhatsAppRoundIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 32 32" fill="none" className="shrink-0" aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#25D366" />
      <path
        d="M23.5 8.5C21.6 6.6 19 5.5 16.3 5.5c-5.5 0-10 4.5-10 10 0 1.8.5 3.5 1.4 5L5.5 26.5l6.2-1.6c1.4.8 3 1.2 4.6 1.2 5.5 0 10-4.5 10-10 0-2.7-1-5.2-2.8-7.1zm-7.2 15.4c-1.5 0-2.9-.4-4.2-1.1l-.3-.2-3.1.8.8-3-.2-.3c-.8-1.3-1.2-2.7-1.2-4.2 0-4.4 3.6-8 8-8 2.1 0 4.1.8 5.6 2.3 1.5 1.5 2.3 3.5 2.3 5.7-.1 4.3-3.6 8-7.7 8zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.7-.3-1.4-.7-2-1.3-.5-.5-1-1.1-1.4-1.8-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.3.3-.4.1-.1.1-.2.1-.4 0-.1-.5-1.3-.7-1.8-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.7.7-1 1.5-1 2.4 0 .9.4 1.8 1.1 2.5 1 1.4 2.3 2.5 3.8 3.2.5.2 1 .4 1.5.5.7.2 1.3.1 1.8-.1.5-.3.9-.7 1.1-1.2.1-.3.1-.6 0-.8z"
        fill="white"
      />
    </svg>
  );
}

function WhatsAppSquareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden className="shrink-0">
      <rect width="32" height="32" fill="#25D366" />
      <path
        d="M23.5 8.5C21.6 6.6 19 5.5 16.3 5.5c-5.5 0-10 4.5-10 10 0 1.8.5 3.5 1.4 5L5.5 26.5l6.2-1.6c1.4.8 3 1.2 4.6 1.2 5.5 0 10-4.5 10-10 0-2.7-1-5.2-2.8-7.1zm-7.2 15.4c-1.5 0-2.9-.4-4.2-1.1l-.3-.2-3.1.8.8-3-.2-.3c-.8-1.3-1.2-2.7-1.2-4.2 0-4.4 3.6-8 8-8 2.1 0 4.1.8 5.6 2.3 1.5 1.5 2.3 3.5 2.3 5.7-.1 4.3-3.6 8-7.7 8zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.7-.3-1.4-.7-2-1.3-.5-.5-1-1.1-1.4-1.8-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.3.3-.4.1-.1.1-.2.1-.4 0-.1-.5-1.3-.7-1.8-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.7.7-1 1.5-1 2.4 0 .9.4 1.8 1.1 2.5 1 1.4 2.3 2.5 3.8 3.2.5.2 1 .4 1.5.5.7.2 1.3.1 1.8-.1.5-.3.9-.7 1.1-1.2.1-.3.1-.6 0-.8z"
        fill="white"
      />
    </svg>
  );
}

function UsFlagIcon() {
  return (
    <svg width="22" height="15" viewBox="0 0 20 14" aria-hidden className="shrink-0">
      <rect width="20" height="14" fill="#B22234" />
      <g fill="#fff">
        <rect y="2" width="20" height="2" />
        <rect y="6" width="20" height="2" />
        <rect y="10" width="20" height="2" />
      </g>
      <rect width="8" height="6" fill="#3C3B6E" />
      <g fill="#fff" transform="translate(1,1)">
        <circle cx="1" cy="1" r="0.4" />
        <circle cx="3" cy="1" r="0.4" />
        <circle cx="5" cy="1" r="0.4" />
      </g>
    </svg>
  );
}

function IndiaFlagIcon() {
  return (
    <svg width="22" height="15" viewBox="0 0 20 14" aria-hidden className="shrink-0">
      <rect width="20" height="14" fill="#FF9933" />
      <rect y="4.666" width="20" height="4.667" fill="white" />
      <rect y="9.333" width="20" height="4.667" fill="#138808" />
      <circle cx="10" cy="7" r="1.6" fill="#000080" />
    </svg>
  );
}

/* Thin orange page-scroll progress bar pinned above everything. */
function ScrollProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setPct(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-[9999] h-[3px]" aria-hidden>
      <div
        className="relative h-full rounded-r-full"
        style={{ width: `${pct}%`, backgroundColor: ORANGE }}
      >
        <div
          className="absolute right-0 top-1/2 h-[14px] w-[14px] -translate-y-1/2 translate-x-1/2 rounded-full"
          style={{
            backgroundColor: ORANGE,
            boxShadow: "0 0 12px 5px rgba(242, 100, 25, 0.75)",
          }}
        />
      </div>
    </div>
  );
}

const TOPBAR_CONTACTS = (
  <>
    <a
      href="https://wa.me/919953900123"
      target="_blank"
      rel="noopener noreferrer"
      className="group relative inline-flex items-center gap-1.5 whitespace-nowrap text-[0.92rem] font-semibold text-black/75 no-underline max-md:gap-1 max-md:text-[0.65rem]"
    >
      <WhatsAppSquareIcon />
      +91-9953-900123
      <span
        className="absolute -bottom-0.5 left-0 hidden h-[1.5px] w-full origin-left scale-x-0 rounded-full bg-[#F26419] transition-transform duration-200 group-hover:scale-x-100 md:block"
        aria-hidden
      />
    </a>
    <span className="h-4 w-px shrink-0 bg-black/15" />
    <a
      href="tel:+18886445402"
      className="group relative hidden items-center gap-1.5 whitespace-nowrap text-[0.92rem] font-semibold text-black/75 no-underline max-md:inline-flex max-md:gap-1 max-md:text-[0.65rem] max-[480px]:hidden lg:inline-flex"
    >
      <UsFlagIcon />
      +1-888-644-5402
      <span
        className="absolute -bottom-0.5 left-0 hidden h-[1.5px] w-full origin-left scale-x-0 rounded-full bg-[#F26419] transition-transform duration-200 group-hover:scale-x-100 md:block"
        aria-hidden
      />
    </a>
    <span className="hidden h-4 w-px shrink-0 bg-black/15 lg:block" />
    <a
      href="tel:+911204751400"
      className="group relative inline-flex items-center gap-1.5 whitespace-nowrap text-[0.92rem] font-semibold text-black/75 no-underline max-md:gap-1 max-md:text-[0.65rem]"
    >
      <IndiaFlagIcon />
      +91-120-475-1400
      <span
        className="absolute -bottom-0.5 left-0 hidden h-[1.5px] w-full origin-left scale-x-0 rounded-full bg-[#F26419] transition-transform duration-200 group-hover:scale-x-100 md:block"
        aria-hidden
      />
    </a>
  </>
);

/* Fixed announcement bar above the header: marquee + contact numbers. */
function AnnouncementBar() {
  const marqueeItem = (
    <span className="inline-flex items-center px-8">
      <span className="mx-2 inline-flex items-center whitespace-nowrap rounded-[4px] bg-gradient-to-r from-[#E31837] to-[#F26419] px-[0.65rem] py-[0.18rem] text-[0.85rem] font-black tracking-[0.07em] text-white">
        📺 Now Advertising on JioHotstar Smart TV.
      </span>
      <span className="whitespace-nowrap text-[0.92rem] font-normal text-black/60">
        Grow Beyond Search with AI SEO • GEO • Smart TV Ads
      </span>
    </span>
  );

  return (
    <div
      aria-label="Announcement bar"
      className="fixed left-0 right-0 top-0 z-[150] flex flex-col overflow-hidden border-b border-black/[0.08] bg-white/[0.98] backdrop-blur-[24px] md:flex-row md:items-center"
      style={{ height: "var(--topbar-h)" }}
    >
      <div className="flex w-full items-center md:contents">
        <div className="hidden h-full shrink-0 items-center border-r border-black/[0.08] pr-3 md:flex">
          <span className="inline-flex items-center whitespace-nowrap px-3 text-[0.8rem] font-black uppercase tracking-[0.14em] text-[#F26419]">
            Announcement:
          </span>
        </div>
        <div className="relative flex h-[2.5rem] flex-1 items-center overflow-hidden border-b border-black/[0.06] md:h-full md:border-b-0">
          <div className="anb-track flex h-full w-max items-center">
            {marqueeItem}
            {marqueeItem}
          </div>
        </div>
      </div>
      <div className="flex h-[2.5rem] flex-1 items-center justify-around gap-2 px-3 sm:px-6 md:h-full md:flex-none md:justify-start md:border-l md:border-black/[0.08]">
        {TOPBAR_CONTACTS}
      </div>
    </div>
  );
}

/* Magnetic logo: follows the cursor, lifts with an orange glow, snaps back elastically. */
function LogoMark() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const glowOpacity = useMotionValue(0);
  const glowScale = useMotionValue(0.6);

  return (
    <div
      ref={wrapRef}
      className="relative mr-1 flex shrink-0 cursor-pointer"
      style={{ willChange: "transform" }}
      onMouseMove={(e) => {
        const el = wrapRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        animate(x, (e.clientX - (r.left + r.width / 2)) * 0.25, { duration: 0.3, ease: "easeOut" });
        animate(y, (e.clientY - (r.top + r.height / 2)) * 0.18 - 6, { duration: 0.3, ease: "easeOut" });
      }}
      onMouseEnter={() => {
        animate(scale, 1.07, { duration: 0.35, ease: "easeOut" });
        animate(glowOpacity, 1, { duration: 0.4, ease: "easeOut" });
        animate(glowScale, 1, { duration: 0.4, ease: "easeOut" });
      }}
      onMouseLeave={() => {
        animate(x, 0, { type: "spring", stiffness: 260, damping: 11 });
        animate(y, 0, { type: "spring", stiffness: 260, damping: 11 });
        animate(scale, 1, { type: "spring", stiffness: 260, damping: 11 });
        animate(glowOpacity, 0, { duration: 0.35, ease: "easeIn" });
        animate(glowScale, 0.6, { duration: 0.35, ease: "easeIn" });
      }}
      onMouseDown={() => {
        animate(scale, 0.93, { duration: 0.1, ease: "easeIn" }).then(() =>
          animate(scale, 1.07, { type: "spring", stiffness: 400, damping: 9 }),
        );
      }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{
          opacity: glowOpacity,
          scale: glowScale,
          background: "radial-gradient(ellipse at 50% 80%, rgba(242,100,25,0.35) 0%, transparent 70%)",
          filter: "blur(8px)",
          translateY: 6,
        }}
        aria-hidden
      />
      <motion.div style={{ x, y, scale, willChange: "transform" }}>
        <Link href="/" aria-label="Digisutra Solutions — home">
          <Image
            src={withBase("/logo.png")}
            alt="Digisutra Solutions"
            width={200}
            height={70}
            priority
            className="h-12 w-auto max-w-[150px] object-contain sm:h-14 sm:max-w-none"
          />
        </Link>
      </motion.div>
    </div>
  );
}

/* One row inside a mega menu: icon chip + label. */
function MegaLink({
  label,
  href,
  icon: Icon,
  index,
  onNavigate,
}: MenuItem & { index: number; onNavigate: () => void }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="mega-link group flex items-center gap-2.5 rounded-lg p-2 no-underline transition-colors hover:bg-[#FEF3EC]"
      style={{ animationDelay: `${0.12 + index * 0.028}s` }}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-colors group-hover:bg-[#FFE5CC] group-hover:text-[#F26419]">
        <Icon size={18} />
      </span>
      <span className="text-[0.95rem] font-medium leading-snug text-gray-800 transition-colors group-hover:text-[#F26419]">
        {label}
      </span>
    </Link>
  );
}

/* Full-width dropdown panel with edge-to-edge image and icon grid. */
function MegaPanel({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  return (
    <div className="mega-panel absolute left-0 right-0 top-full z-[200] border-t-2 border-[#F26419] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.13),0_2px_8px_rgba(0,0,0,0.05)]">
      {item.panelImage && (
        <div
          className="mega-image absolute bottom-0 left-0 top-0 overflow-hidden"
          style={{ width: "max(252px, calc((100% - 1280px) / 2 + 252px))", zIndex: 0 }}
        >
          <Image
            src={withBase(item.panelImage)}
            alt=""
            fill
            sizes="420px"
            loading="eager"
            className="object-cover object-center"
            aria-hidden
          />
          <div
            className="absolute bottom-0 right-0 flex flex-col px-5 pb-5 pt-16"
            style={{
              width: "252px",
              background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 100%)",
            }}
          >
            <p className="mega-label mb-1.5 text-[1.6rem] font-black leading-none text-white">
              {item.label}
            </p>
            <Link
              href={item.href}
              onClick={onNavigate}
              className="mega-cta inline-flex items-center gap-1 text-[0.82rem] font-bold text-[#F26419] no-underline transition-colors hover:text-orange-400"
            >
              View all {item.label} <ArrowRightIcon size={11} />
            </Link>
          </div>
        </div>
      )}
      <div className="relative mx-auto flex max-w-[1280px]" style={{ zIndex: 1 }}>
        <div className="w-[252px] shrink-0 self-stretch" />
        <div
          className="flex-1 bg-white p-4"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${item.cols ?? 2}, 1fr)`,
            gap: "0.1rem",
            alignContent: "start",
          }}
        >
          {item.dropdown?.map((sub, i) => (
            <MegaLink key={sub.href} {...sub} index={i} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* Mobile accordion row inside the drawer. */
function DrawerItem({ item, onClose }: { item: NavItem; onClose: () => void }) {
  const [open, setOpen] = useState(false);

  if (!item.dropdown) {
    return (
      <Link
        href={item.href}
        onClick={onClose}
        className="flex items-center border-b border-black/[0.06] px-6 py-4 no-underline"
      >
        <span className="flex-1 text-[1.15rem] font-semibold tracking-tight text-gray-900">
          {item.label}
        </span>
        <span className="text-gray-400">
          <ArrowRightIcon size={15} />
        </span>
      </Link>
    );
  }

  return (
    <div className="border-b border-black/[0.06]">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center border-none bg-transparent px-6 py-4 text-left"
      >
        <span className="flex-1 text-[1.15rem] font-semibold tracking-tight text-gray-900">
          {item.label}
        </span>
        <span
          className={`flex transition-transform duration-200 ${open ? "rotate-90 text-[#F26419]" : "text-gray-400"}`}
        >
          <ArrowRightIcon size={15} />
        </span>
      </button>
      <div
        className="overflow-hidden bg-gray-50 transition-[max-height] duration-300 ease-in-out"
        style={{ maxHeight: open ? 52 * item.dropdown.length + 52 : 0 }}
      >
        <Link
          href={item.href}
          onClick={onClose}
          className="flex items-center gap-1.5 px-6 pb-1.5 pt-2.5 text-sm font-bold text-[#F26419] no-underline"
        >
          View all {item.label} <ArrowRightIcon size={11} />
        </Link>
        {item.dropdown.map((sub) => (
          <Link
            key={sub.href}
            href={sub.href}
            onClick={onClose}
            className="flex items-center gap-3 px-6 py-2 no-underline"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
              <sub.icon size={15} />
            </span>
            <span className="text-[0.95rem] font-medium text-gray-800">{sub.label}</span>
          </Link>
        ))}
        <div className="h-2" />
      </div>
    </div>
  );
}

/* Full-screen slide-in mobile menu. */
function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[290] bg-black/30 transition-opacity duration-300 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden
      />
      <div
        className={`fixed bottom-0 left-0 top-0 z-[300] flex w-full flex-col overflow-y-auto bg-white transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-black/[0.07] px-5 py-3.5">
          <Link href="/" onClick={onClose}>
            <Image
              src={withBase("/logo.png")}
              alt="Digisutra Solutions"
              width={120}
              height={40}
              className="h-9 w-auto object-contain"
            />
          </Link>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-black/[0.14] bg-white text-gray-900"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <nav className="flex-1" aria-label="Mobile">
          {NAV.map((item) => (
            <DrawerItem key={item.href} item={item} onClose={onClose} />
          ))}
        </nav>
        <div className="bg-gray-50 px-6 py-5">
          <div className="mb-4 flex flex-col gap-2.5">
            <a
              href="mailto:Info@digisutrasolutions.com"
              className="inline-flex items-center gap-2 text-[0.95rem] text-gray-900 no-underline"
            >
              <MailStrokeIcon /> Info@digisutrasolutions.com
            </a>
            <a
              href="tel:+911204751400"
              className="inline-flex items-center gap-2 text-[0.95rem] text-gray-900 no-underline"
            >
              <PhoneIcon size={15} color={ORANGE} /> +91-120-475-1400
            </a>
            <a
              href="https://wa.me/919953900123"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[0.95rem] text-gray-900 no-underline"
            >
              <WhatsAppRoundIcon /> WhatsApp
            </a>
          </div>
          <div className="mb-5 flex flex-wrap gap-3">
            {SOCIALS.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex items-center text-gray-600 transition-colors hover:text-[#F26419]"
              >
                <svg viewBox={s.viewBox} width="18" height="18" fill="currentColor" aria-hidden>
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>
          <div className="flex gap-2.5">
            <Link
              href="/payment"
              onClick={onClose}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#F26419] py-2.5 text-[0.95rem] font-semibold text-[#F26419] no-underline"
            >
              <DollarIcon /> Payment Options
            </Link>
            <Link
              href="/contact"
              onClick={onClose}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#F26419] py-2.5 text-[0.95rem] font-semibold text-white no-underline"
            >
              <PhoneIcon /> Contact Us
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Navbar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const closeNow = useCallback(() => {
    cancelClose();
    setOpenMenu(null);
  }, [cancelClose]);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenMenu(null), 80);
  }, [cancelClose]);

  const openFor = useCallback(
    (label: string | null) => {
      cancelClose();
      setOpenMenu(label);
    },
    [cancelClose],
  );

  // Header stays pinned; add depth with a soft shadow once the page scrolls.
  useEffect(() => {
    let raf = 0;
    const update = () => setScrolled(window.scrollY > 8);
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => () => cancelClose(), [cancelClose]);

  const openItem = NAV.find((n) => n.label === openMenu && n.dropdown);

  return (
    <div className="font-condensed">
      <ScrollProgress />
      <AnnouncementBar />

      <header
        onMouseLeave={scheduleClose}
        className={`fixed left-0 right-0 z-[140] h-[68px] border-b border-black/[0.08] bg-white transition-shadow duration-300 ${
          scrolled ? "shadow-[0_10px_30px_rgba(15,15,15,0.08)]" : ""
        }`}
        style={{ top: "var(--topbar-h)" }}
      >
        <div className="mx-auto flex h-full max-w-[1280px] items-center gap-2 px-3 sm:gap-4 sm:px-6">
          <LogoMark />

          {/* Desktop nav */}
          <nav aria-label="Main" className="hidden flex-1 items-center justify-center lg:flex">
            {NAV.map((item) =>
              item.dropdown ? (
                <div key={item.label} onMouseEnter={() => openFor(item.label)}>
                  <Link
                    href={item.href}
                    onClick={closeNow}
                    className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[16px] font-medium no-underline transition-colors ${
                      openMenu === item.label ? "text-[#F26419]" : "text-gray-800"
                    }`}
                  >
                    {item.label}
                    <CaretIcon open={openMenu === item.label} />
                  </Link>
                </div>
              ) : (
                <div key={item.label} onMouseEnter={() => openFor(null)}>
                  <Link
                    href={item.href}
                    className="group relative inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[16px] font-medium text-gray-800 no-underline"
                  >
                    {item.label}
                    <span
                      className="absolute -bottom-0.5 left-2.5 right-2.5 h-[2px] origin-left scale-x-0 rounded-full bg-[#F26419] transition-transform duration-200 group-hover:scale-x-100"
                      aria-hidden
                    />
                  </Link>
                </div>
              ),
            )}
          </nav>

          {/* Desktop CTAs */}
          <div
            className="hidden shrink-0 items-center gap-2.5 lg:flex"
            onMouseEnter={() => openFor(null)}
          >
            <div className="group relative overflow-hidden rounded-full border border-[#F26419]">
              <span
                className="absolute inset-0 origin-left scale-x-0 rounded-full bg-[#F26419] transition-transform duration-300 group-hover:scale-x-100"
                aria-hidden
              />
              <Link
                href="/payment"
                className="relative z-10 inline-flex items-center gap-1.5 whitespace-nowrap px-4 py-2 text-[0.95rem] font-semibold no-underline"
              >
                <span className="inline-flex items-center gap-1.5 text-[#F26419] transition-colors duration-300 group-hover:text-white">
                  <DollarIcon /> Payment Options
                </span>
              </Link>
            </div>
            <div className="group relative overflow-hidden rounded-full bg-[#F26419]">
              <span
                className="absolute inset-0 origin-left scale-x-0 rounded-full bg-[#0f0f0f] transition-transform duration-300 group-hover:scale-x-100"
                aria-hidden
              />
              <Link
                href="/contact"
                className="relative z-10 inline-flex items-center gap-1.5 whitespace-nowrap px-5 py-2 text-[0.95rem] font-semibold text-white no-underline"
              >
                <PhoneIcon /> Contact Us
              </Link>
            </div>
          </div>

          {/* Mobile controls */}
          <div className="ml-auto flex items-center gap-3 lg:hidden">
            <Link
              href="/contact"
              className="inline-flex h-[36px] items-center gap-1.5 whitespace-nowrap rounded-lg border border-black/[0.14] bg-[#F26419] px-3.5 text-[0.8rem] font-semibold text-white no-underline"
            >
              <PhoneIcon size={12} /> Contact Us
            </Link>
            <button
              onClick={() => setDrawerOpen(true)}
              aria-expanded={drawerOpen}
              aria-label="Open menu"
              className="flex h-[36px] w-[36px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-black/[0.14] bg-white text-gray-900"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
                <path d="M3 5.5h16M3 11h16M3 16.5h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {openItem && <MegaPanel item={openItem} onNavigate={closeNow} />}
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
