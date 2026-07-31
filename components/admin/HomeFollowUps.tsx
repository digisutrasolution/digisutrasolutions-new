"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CalendarClock } from "lucide-react";
import { withBase } from "@/lib/base-path";
import { DUE_LABEL, DUE_STYLE, dueBucket, followUpTypeLabel } from "@/lib/crm";

type Item = { id: string; title: string; type: string; dueAt: string; leadId: string; leadName: string };

export default function HomeFollowUps({ initial }: { initial: Item[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function complete(id: string) {
    setBusy(id);
    setItems((xs) => xs.filter((i) => i.id !== id));
    try {
      await fetch(withBase(`/api/followups/${id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DONE" }),
      });
    } finally {
      setBusy(null);
    }
  }

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-stone-200 py-8 text-center text-sm text-stone-400 dark:border-stone-800">
        You&apos;re all caught up — nothing due today.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((f) => {
        const bucket = dueBucket(f.dueAt);
        return (
          <li key={f.id} className="flex items-start gap-2.5 rounded-xl border border-stone-200 p-2.5 dark:border-stone-800">
            <button
              onClick={() => void complete(f.id)}
              disabled={busy === f.id}
              title="Mark done"
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-stone-300 text-transparent hover:border-green-500 hover:text-green-600 dark:border-stone-600"
            >
              <Check size={12} />
            </button>
            <button onClick={() => router.push(`/admin/leads/${f.leadId}`)} className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium text-stone-800 dark:text-stone-100">
                <span className="text-stone-400">{followUpTypeLabel(f.type)} · </span>{f.title}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500">
                <span className={`rounded-full px-1.5 py-0.5 font-semibold ${DUE_STYLE[bucket]}`}>{DUE_LABEL[bucket]}</span>
                {f.leadName} · <CalendarClock size={11} className="inline" /> {new Date(f.dueAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
