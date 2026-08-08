"use client";

import { withBase } from "@/lib/base-path";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import PushToggle from "@/components/admin/PushToggle";
import { canRaiseTabAlert } from "@/lib/tab-alerts";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

function timeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

export default function NotificationsBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  /* Ids already accounted for. Null until the first poll lands, so the
     existing backlog is adopted silently instead of firing 36 notifications
     at whoever opens the CMS. */
  const seen = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(withBase("/api/notifications"));
      const json = await res.json().catch(() => ({}));
      if (!json.ok) return;
      const list = json.items as NotificationItem[];

      if (seen.current === null) {
        seen.current = new Set(list.map((i) => i.id));
      } else {
        const fresh = list.filter((i) => !seen.current!.has(i.id));
        list.forEach((i) => seen.current!.add(i.id));
        // The push-service fallback: raise the notification from this tab.
        if (canRaiseTabAlert()) {
          for (const item of fresh) {
            if (item.readAt) continue;
            try {
              const n = new Notification(item.title, {
                body: item.body ?? "",
                tag: item.id,
                icon: withBase("/logo.png"),
              });
              n.onclick = () => {
                window.focus();
                if (item.link) router.push(item.link);
                n.close();
              };
            } catch {
              /* a profile can refuse the constructor outright — skip it */
            }
          }
        }
      }

      setItems(list);
      setUnread(json.unread);
    } catch {
      /* transient */
    }
  }, [router]);

  useEffect(() => {
    // Defer the initial fetch past commit (react-hooks/set-state-in-effect).
    const initial = setTimeout(load, 0);
    const id = setInterval(load, 60 * 1000);
    return () => {
      clearTimeout(initial);
      clearInterval(id);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function markAllRead() {
    await fetch(withBase("/api/notifications"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch(() => {});
    void load();
  }

  function openItem(item: NotificationItem) {
    void fetch(withBase("/api/notifications"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [item.id] }),
    }).then(load);
    setOpen(false);
    if (item.link) router.push(item.link);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        aria-expanded={open}
        className="relative cursor-pointer rounded-full border border-stone-200 p-2 text-stone-600 transition-colors hover:border-orange-400 hover:text-orange-600 dark:border-stone-700 dark:text-stone-300"
      >
        <Bell size={15} aria-hidden />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-stone-200 bg-white shadow-[0_18px_50px_rgba(28,25,23,0.15)] dark:border-stone-700 dark:bg-stone-900">
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3 dark:border-stone-800">
            <p className="font-display text-sm font-bold">Notifications</p>
            {unread > 0 && (
              <button
                onClick={() => void markAllRead()}
                className="cursor-pointer text-xs font-semibold text-orange-700 hover:underline dark:text-orange-400"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-stone-500">
                Nothing yet — workflow updates land here.
              </p>
            )}
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => openItem(item)}
                className={`block w-full cursor-pointer border-b border-stone-50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-orange-50 dark:border-stone-800 dark:hover:bg-stone-800 ${
                  item.readAt ? "opacity-60" : ""
                }`}
              >
                <p className="text-sm font-medium leading-snug">
                  {!item.readAt && (
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-orange-600 align-middle" />
                  )}
                  {item.title}
                </p>
                {item.body && (
                  <p className="mt-0.5 truncate text-xs text-stone-500 dark:text-stone-400">
                    {item.body}
                  </p>
                )}
                <p className="mt-0.5 text-[11px] text-stone-400">
                  {timeAgo(item.createdAt)}
                </p>
              </button>
            ))}
          </div>
          <PushToggle />
        </div>
      )}
    </div>
  );
}
