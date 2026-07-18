"use client";

import { withBase } from "@/lib/base-path";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChartBar,
  ChevronDown,
  ClipboardList,
  CornerUpRight,
  FileText,
  Gauge,
  Image as ImageIcon,
  Inbox,
  IndianRupee,
  LayoutGrid,
  Mail,
  Megaphone,
  MenuSquare,
  MessageSquare,
  Newspaper,
  ScrollText,
  Settings,
  Users,
  Video,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
} from "lucide-react";
import { can, ROLE_LABELS } from "@/lib/auth/rbac";
import type { SessionUser } from "@/lib/auth/session";
import NotificationsBell from "@/components/admin/NotificationsBell";

/* Sidebar structure: Dashboard + Leads stay pinned; everything else lives
   in collapsible groups. The group holding the current page auto-opens and
   open/closed choices persist in localStorage. */
const PINNED = [
  { label: "Dashboard", href: "/admin", icon: Gauge, permission: null },
  { label: "Leads", href: "/admin/leads", icon: Inbox, permission: "leads.manage", badge: "newLeads" },
] as const;

const NAV_GROUPS = [
  {
    label: "Content",
    items: [
      { label: "Pages", href: "/admin/pages", icon: FileText, permission: "pages.view" },
      { label: "Blog", href: "/admin/blog", icon: Newspaper, permission: "blog.manage" },
      { label: "Media", href: "/admin/media", icon: ImageIcon, permission: "pages.view" },
      { label: "Videos", href: "/admin/videos", icon: Video, permission: "pages.view" },
      { label: "Forms", href: "/admin/forms", icon: ClipboardList, permission: "forms.manage" },
      { label: "Comments", href: "/admin/comments", icon: MessageSquare, permission: "comments.moderate", badge: "pendingComments" },
    ],
  },
  {
    label: "Site setup",
    items: [
      { label: "Menus", href: "/admin/menus", icon: MenuSquare, permission: "menus.manage" },
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
    ],
  },
  {
    label: "System",
    items: [
      { label: "Users", href: "/admin/users", icon: Users, permission: "users.manage" },
      { label: "Settings", href: "/admin/settings", icon: Settings, permission: "settings.manage" },
      { label: "Audit log", href: "/admin/audit", icon: ScrollText, permission: "audit.read" },
    ],
  },
] as const;

type NavItem = {
  label: string;
  href: string;
  icon: typeof Gauge;
  permission: string | null;
  badge?: "newLeads" | "pendingComments";
};

export default function AdminShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [badges, setBadges] = useState<{ newLeads: number; pendingComments: number }>({
    newLeads: 0,
    pendingComments: 0,
  });

  // Restore persisted group state, then make sure the active page's group
  // is open (deferred past commit per repo convention).
  useEffect(() => {
    const t = setTimeout(() => {
      let open = new Set<string>();
      try {
        const stored = localStorage.getItem("ds-admin-nav");
        if (stored) open = new Set(JSON.parse(stored) as string[]);
      } catch {
        /* corrupted state — start fresh */
      }
      for (const group of NAV_GROUPS) {
        if (group.items.some((i) => pathname.startsWith(i.href))) open.add(group.label);
      }
      setOpenGroups(open);
    }, 0);
    return () => clearTimeout(t);
  }, [pathname]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
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
          setBadges({ newLeads: data.newLeads, pendingComments: data.pendingComments });
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
    item.permission === null || can(user.role, item.permission as never);

  const badgeFor = (item: NavItem) =>
    item.badge === "newLeads"
      ? badges.newLeads
      : item.badge === "pendingComments"
        ? badges.pendingComments
        : 0;

  const renderLink = (item: NavItem, indent = false) => {
    const active =
      item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
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
