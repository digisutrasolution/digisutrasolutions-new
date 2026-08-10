"use client";

import { withBase } from "@/lib/base-path";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgeCheck,
  BookOpen,
  CalendarClock,
  ChartBar,
  ChevronDown,
  CircleHelp,
  Footprints,
  ClipboardList,
  CornerUpRight,
  FileText,
  Gauge,
  History,
  Image as ImageIcon,
  Inbox,
  IndianRupee,
  LayoutDashboard,
  LayoutGrid,
  Mail,
  MapPin,
  Megaphone,
  MenuSquare,
  MessageSquare,
  Newspaper,
  Radio,
  ReceiptText,
  ScrollText,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
  Webhook,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Quote,
} from "lucide-react";
import { ROLE_LABELS } from "@/lib/auth/rbac";
import type { SessionUser } from "@/lib/auth/session";
import NotificationsBell from "@/components/admin/NotificationsBell";
import HelpDrawer from "@/components/admin/HelpDrawer";

/* Sidebar structure: Dashboard + Leads stay pinned; everything else lives
   in collapsible groups. The group holding the current page auto-opens and
   open/closed choices persist in localStorage. */
const PINNED = [
  { label: "Dashboard", href: "/admin", icon: Gauge, permission: null },
] as const;

const NAV_GROUPS = [
  {
    label: "Lead Management",
    items: [
      { label: "Overview", href: "/admin/crm", icon: LayoutDashboard, permission: "leads.manage" },
      { label: "Leads", href: "/admin/leads", icon: Inbox, permission: "leads.manage", badge: "newLeads" },
      { label: "Follow-ups", href: "/admin/followups", icon: CalendarClock, permission: "leads.manage", badge: "dueFollowups" },
      { label: "Quotations", href: "/admin/quotations", icon: ReceiptText, permission: "quotes.manage" },
      { label: "Payments", href: "/admin/payments", icon: IndianRupee, permission: "payments.manage" },
      { label: "Activity", href: "/admin/leads/activity", icon: History, permission: "leads.manage" },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Pages", href: "/admin/pages", icon: FileText, permission: "pages.view" },
      { label: "Blog", href: "/admin/blog", icon: Newspaper, permission: "blog.manage" },
      { label: "Media", href: "/admin/media", icon: ImageIcon, permission: "pages.view" },
      { label: "Videos", href: "/admin/videos", icon: Video, permission: "pages.view" },
      { label: "Forms", href: "/admin/forms", icon: ClipboardList, permission: "forms.manage" },
      { label: "Comments", href: "/admin/comments", icon: MessageSquare, permission: "comments.moderate", badge: "pendingComments" },
      { label: "Contact & footer", href: "/admin/contact", icon: MapPin, permission: "contact.manage" },
      { label: "FAQ", href: "/admin/faq", icon: CircleHelp, permission: "faq.manage" },
      { label: "Proof", href: "/admin/proof", icon: Quote, permission: "proof.manage" },
    ],
  },
  {
    label: "Site setup",
    items: [
      { label: "Menus", href: "/admin/menus", icon: MenuSquare, permission: "menus.manage", badge: "brokenLinks" },
      { label: "Services", href: "/admin/services", icon: LayoutGrid, permission: "services.manage" },
      { label: "Pricing", href: "/admin/pricing", icon: IndianRupee, permission: "pricing.manage" },
      { label: "Ads", href: "/admin/ads", icon: Megaphone, permission: "ads.manage" },
      { label: "Redirects", href: "/admin/redirects", icon: CornerUpRight, permission: "redirects.manage" },
    ],
  },
  {
    label: "Audience",
    items: [
      { label: "Subscribers", href: "/admin/subscribers", icon: Mail, permission: "newsletter.manage" },
      { label: "Analytics", href: "/admin/analytics", icon: ChartBar, permission: "analytics.view" },
      { label: "Sessions", href: "/admin/sessions", icon: Footprints, permission: "analytics.view" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Templates", href: "/admin/comms", icon: Send, permission: "comms.manage" },
      { label: "Channels", href: "/admin/channels", icon: Radio, permission: "settings.manage" },
      { label: "Developers", href: "/admin/developers", icon: Webhook, permission: "api.manage" },
      { label: "AI providers", href: "/admin/ai", icon: Sparkles, permission: "settings.manage" },
      { label: "Verification", href: "/admin/verification", icon: BadgeCheck, permission: "settings.manage" },
      { label: "Users", href: "/admin/users", icon: Users, permission: "users.manage" },
      { label: "Roles", href: "/admin/roles", icon: ShieldCheck, permission: "roles.manage" },
      { label: "Settings", href: "/admin/settings", icon: Settings, permission: "settings.manage" },
      { label: "Team Guide", href: "/admin/guide", icon: BookOpen, permission: null },
      { label: "Audit log", href: "/admin/audit", icon: ScrollText, permission: "audit.read" },
    ],
  },
] as const;

type NavItem = {
  label: string;
  href: string;
  icon: typeof Gauge;
  permission: string | null;
  badge?: "newLeads" | "pendingComments" | "dueFollowups" | "brokenLinks";
};

/** Does this path sit under this nav item? Exact match, or a real path
    segment beneath it — the trailing slash stops "/admin/leadsomething"
    counting as a child of "/admin/leads". */
function covers(href: string, pathname: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The single nav item that should light up: the LONGEST href that covers the
    current path. Without this, /admin/leads/activity highlights both Activity
    and Leads, because one href is a prefix of the other. A lead detail page
    still resolves to Leads, since nothing longer covers it. */
function activeHref(pathname: string): string {
  // Hrefs only — the nav arrays are `as const` tuples with per-item literal
  // types, so flattening the objects themselves fights the inferencer.
  const hrefs: string[] = [
    ...PINNED.map((i) => String(i.href)),
    ...NAV_GROUPS.flatMap((g) => g.items.map((i) => String(i.href))),
  ];
  let best = "";
  for (const href of hrefs) {
    if (covers(href, pathname) && href.length > best.length) best = href;
  }
  return best;
}

export default function AdminShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const current = activeHref(pathname);
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [badges, setBadges] = useState<{ newLeads: number; pendingComments: number; dueFollowups: number; brokenLinks: number }>({
    newLeads: 0,
    pendingComments: 0,
    dueFollowups: 0,
    brokenLinks: 0,
  });

  // Restore persisted group state, then make sure the active page's group
  // is open (deferred past commit per repo convention).
  useEffect(() => {
    const t = setTimeout(() => {
      // Only one group open at a time: the group holding the current page
      // wins; otherwise fall back to the single persisted group.
      let open = new Set<string>();
      const winner = activeHref(pathname);
      const active = NAV_GROUPS.find((g) => g.items.some((i) => i.href === winner));
      if (active) {
        open = new Set([active.label]);
      } else {
        try {
          const stored = localStorage.getItem("ds-admin-nav");
          const arr = stored ? (JSON.parse(stored) as string[]) : [];
          if (arr.length) open = new Set([arr[0]]);
        } catch {
          /* corrupted state — start fresh */
        }
      }
      setOpenGroups(open);
    }, 0);
    return () => clearTimeout(t);
  }, [pathname]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => {
      // Exclusive: clicking an open group closes it; clicking another opens
      // only that one, so at most one group is ever expanded.
      const next = prev.has(label) ? new Set<string>() : new Set([label]);
      localStorage.setItem("ds-admin-nav", JSON.stringify([...next]));
      return next;
    });
  };

  // Work-waiting badges (new leads, pending comments), refreshed with the
  // same cadence as the notifications bell.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(withBase("/api/admin/badges"));
        const data = await res.json();
        if (data.ok && !cancelled) {
          setBadges({ newLeads: data.newLeads, pendingComments: data.pendingComments, dueFollowups: data.dueFollowups ?? 0, brokenLinks: data.brokenLinks ?? 0 });
        }
      } catch {
        /* transient */
      }
    }
    const t = setTimeout(load, 0);
    const id = setInterval(load, 60 * 1000);
    return () => {
      cancelled = true;
      clearTimeout(t);
      clearInterval(id);
    };
  }, [pathname]);

  // Silent session keep-alive: rotate the refresh token and mint a new
  // access token well before the 15-minute expiry. On failure, fall back
  // to the login screen.
  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const res = await fetch(withBase("/api/auth/refresh"), { method: "POST" });
        if (!res.ok && !cancelled) {
          router.push("/admin/login");
        }
      } catch {
        /* transient network error — retry on next tick */
      }
    }
    const id = setInterval(refresh, 10 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [router]);

  useEffect(() => {
    // Theme must sync from localStorage after hydration; defer past commit
    // to satisfy react-hooks/set-state-in-effect.
    const t = setTimeout(() => {
      const stored = localStorage.getItem("ds-admin-theme");
      const wantDark =
        stored === "dark" ||
        (stored === null &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      setDark(wantDark);
      document.documentElement.classList.toggle("dark", wantDark);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("ds-admin-theme", next ? "dark" : "light");
  }

  async function logout() {
    await fetch(withBase("/api/auth/logout"), { method: "POST" }).catch(() => {});
    document.documentElement.classList.remove("dark");
    router.push("/admin/login");
    router.refresh();
  }

  const allowed = (item: NavItem) =>
    item.permission === null ||
    (user.permissions as string[]).includes(item.permission);

  const badgeFor = (item: NavItem) =>
    item.badge === "newLeads"
      ? badges.newLeads
      : item.badge === "pendingComments"
        ? badges.pendingComments
        : item.badge === "dueFollowups"
          ? badges.dueFollowups
          : item.badge === "brokenLinks"
            ? badges.brokenLinks
            : 0;

  const renderLink = (item: NavItem, indent = false) => {
    const active = item.href === current;
    const count = badgeFor(item);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileNav(false)}
        className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
          indent ? "ml-2" : ""
        } ${
          active
            ? "bg-orange-600 text-white"
            : "text-stone-600 hover:bg-orange-50 hover:text-orange-700 dark:text-stone-300 dark:hover:bg-stone-800"
        }`}
      >
        <item.icon size={16} aria-hidden />
        {item.label}
        {count > 0 && (
          <span
            className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
              active ? "bg-white/25 text-white" : "bg-orange-600 text-white"
            }`}
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Link>
    );
  };

  const sidebar = (
    <nav className="flex h-full flex-col" aria-label="Admin">
      <div className="px-5 pb-6 pt-5">
        <Link href="/admin" className="block">
          {/* Light mode: full-color logo; dark mode: the light footer variant. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={withBase("/logo.png")}
            alt="DigiSutra Solutions"
            className="h-10 w-auto object-contain dark:hidden"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={withBase("/footer-logo.webp")}
            alt="DigiSutra Solutions"
            className="hidden h-10 w-auto object-contain dark:block"
          />
        </Link>
        <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-stone-400">
          CMS
        </p>
      </div>
      <div className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {PINNED.filter((i) => allowed(i as NavItem)).map((i) => renderLink(i as NavItem))}
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((i) => allowed(i as NavItem));
          if (items.length === 0) return null;
          const isOpen = openGroups.has(group.label);
          const groupHasWork = items.some((i) => badgeFor(i as NavItem) > 0);
          return (
            <div key={group.label} className="pt-2">
              <button
                onClick={() => toggleGroup(group.label)}
                aria-expanded={isOpen}
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400 transition-colors hover:text-orange-700 dark:hover:text-orange-400"
              >
                {group.label}
                {!isOpen && groupHasWork && (
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" aria-hidden />
                )}
                <ChevronDown
                  size={12}
                  aria-hidden
                  className={`ml-auto transition-transform duration-200 ${isOpen ? "" : "-rotate-90"}`}
                />
              </button>
              {isOpen && (
                <div className="space-y-0.5">
                  {items.map((i) => renderLink(i as NavItem, true))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="border-t border-stone-200 p-4 dark:border-stone-800">
        <p className="truncate text-sm font-semibold text-stone-900 dark:text-stone-100">
          {user.name}
        </p>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          {ROLE_LABELS[user.role]}
        </p>
        <button
          onClick={logout}
          className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-stone-300 py-2 text-xs font-semibold text-stone-700 transition-colors hover:border-red-400 hover:text-red-700 dark:border-stone-700 dark:text-stone-300"
        >
          <LogOut size={13} aria-hidden /> Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-stone-200 bg-white lg:block dark:border-stone-800 dark:bg-stone-900">
        {sidebar}
      </aside>

      {mobileNav && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-stone-900/50"
            onClick={() => setMobileNav(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white dark:bg-stone-900">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-white/80 px-4 py-3 backdrop-blur-md sm:px-6 dark:border-stone-800 dark:bg-stone-900/80">
          <button
            onClick={() => setMobileNav(!mobileNav)}
            aria-label={mobileNav ? "Close menu" : "Open menu"}
            className="cursor-pointer rounded-lg p-2 text-stone-600 lg:hidden dark:text-stone-300"
          >
            {mobileNav ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
          </button>
          <p className="hidden text-sm text-stone-500 lg:block dark:text-stone-400">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <HelpDrawer />
            <button
              onClick={toggleTheme}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              className="cursor-pointer rounded-full border border-stone-200 p-2 text-stone-600 transition-colors hover:border-orange-400 hover:text-orange-600 dark:border-stone-700 dark:text-stone-300"
            >
              {dark ? <Sun size={15} aria-hidden /> : <Moon size={15} aria-hidden />}
            </button>
            <Link
              href="/"
              target="_blank"
              className="rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-stone-700 dark:bg-orange-600 dark:hover:bg-orange-500"
            >
              View site ↗
            </Link>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
