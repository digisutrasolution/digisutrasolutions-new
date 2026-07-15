"use client";

import { withBase } from "@/lib/base-path";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChartBar,
  ClipboardList,
  CornerUpRight,
  FileText,
  Gauge,
  Image as ImageIcon,
  Mail,
  Megaphone,
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

const NAV = [
  { label: "Dashboard", href: "/admin", icon: Gauge, permission: null },
  { label: "Pages", href: "/admin/pages", icon: FileText, permission: "pages.view" },
  { label: "Blog", href: "/admin/blog", icon: Newspaper, permission: "blog.manage" },
  { label: "Media", href: "/admin/media", icon: ImageIcon, permission: "pages.view" },
  { label: "Videos", href: "/admin/videos", icon: Video, permission: "pages.view" },
  { label: "Forms", href: "/admin/forms", icon: ClipboardList, permission: "forms.manage" },
  { label: "Comments", href: "/admin/comments", icon: MessageSquare, permission: "comments.moderate" },
  { label: "Ads", href: "/admin/ads", icon: Megaphone, permission: "ads.manage" },
  { label: "Subscribers", href: "/admin/subscribers", icon: Mail, permission: "newsletter.manage" },
  { label: "Analytics", href: "/admin/analytics", icon: ChartBar, permission: "analytics.view" },
  { label: "Redirects", href: "/admin/redirects", icon: CornerUpRight, permission: "redirects.manage" },
  { label: "Users", href: "/admin/users", icon: Users, permission: "users.manage" },
  { label: "Settings", href: "/admin/settings", icon: Settings, permission: "settings.manage" },
  { label: "Audit log", href: "/admin/audit", icon: ScrollText, permission: "audit.read" },
] as const;

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

  const links = NAV.filter(
    (item) => item.permission === null || can(user.role, item.permission),
  );

  const sidebar = (
    <nav className="flex h-full flex-col" aria-label="Admin">
      <div className="px-5 pb-6 pt-5">
        <Link href="/admin" className="font-display text-lg font-extrabold italic tracking-tight">
          <span className="text-orange-500">DIGI</span>
          <span className="text-stone-800 dark:text-stone-100">SUTRA</span>
        </Link>
        <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-stone-400">
          CMS · Phase 1
        </p>
      </div>
      <div className="flex-1 space-y-1 px-3">
        {links.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileNav(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-orange-600 text-white"
                  : "text-stone-600 hover:bg-orange-50 hover:text-orange-700 dark:text-stone-300 dark:hover:bg-stone-800"
              }`}
            >
              <item.icon size={16} aria-hidden />
              {item.label}
            </Link>
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
