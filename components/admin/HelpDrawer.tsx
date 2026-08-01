"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CircleHelp, X, BookOpen, ExternalLink } from "lucide-react";
import { GUIDE_URL, guideUrl, helpForPath } from "@/lib/admin-help";

/* Header Help button + slide-over. It reads the current route and shows help
   for exactly the page you're on, plus a link to the full Team Guide. One
   instance in AdminShell covers every admin page. */
export default function HelpDrawer() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const topic = helpForPath(pathname);

  // Close on route change (deferred past commit per repo convention).
  useEffect(() => {
    const t = setTimeout(() => setOpen(false), 0);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Help for this page"
        title="Help"
        className="cursor-pointer rounded-full border border-stone-200 p-2 text-stone-600 transition-colors hover:border-orange-400 hover:text-orange-600 dark:border-stone-700 dark:text-stone-300"
      >
        <CircleHelp size={15} aria-hidden />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Help"
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl dark:bg-stone-900"
          >
            <header className="flex items-center justify-between border-b border-stone-200 px-5 py-4 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <CircleHelp size={18} className="text-orange-600" aria-hidden />
                <span className="text-sm font-bold uppercase tracking-[0.14em] text-stone-400">Help</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close help"
                className="cursor-pointer rounded-lg p-1.5 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 dark:hover:bg-stone-800 dark:hover:text-stone-200"
              >
                <X size={18} aria-hidden />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <h2 className="font-display text-xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
                {topic.title}
              </h2>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{topic.summary}</p>

              <ul className="mt-4 space-y-3">
                {topic.points.map((p, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed text-stone-700 dark:text-stone-200">
                    <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-orange-500" aria-hidden />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>

              <a
                href={guideUrl(topic.guideAnchor)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800 transition-colors hover:bg-orange-100 dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-300 dark:hover:bg-orange-950/70"
              >
                <span className="flex items-center gap-2">
                  <BookOpen size={16} aria-hidden /> Open the full Team Guide
                </span>
                <ExternalLink size={14} aria-hidden />
              </a>
              <p className="mt-2 text-[11px] leading-relaxed text-stone-400">
                Step-by-step walkthroughs, screenshots and FAQs for the whole CRM.
              </p>
            </div>

            <footer className="border-t border-stone-200 px-5 py-3 dark:border-stone-800">
              <p className="truncate text-[11px] text-stone-400">
                Need more?{" "}
                <a href={GUIDE_URL} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">
                  digisutrasolutions.com team guide
                </a>
              </p>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}
