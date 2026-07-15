"use client";

import { withBase } from "@/lib/base-path";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2 } from "lucide-react";

type SubscriberRow = {
  id: string;
  email: string;
  source: string;
  createdAt: string;
};

export default function SubscribersManager({
  subscribers,
}: {
  subscribers: SubscriberRow[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function remove(id: string, email: string) {
    if (!window.confirm(`Remove ${email} from the list?`)) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(withBase(`/api/newsletter-subscribers/${id}`), {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) setError(json.error ?? "Request failed.");
      else router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-500 dark:text-stone-400">
          <b className="font-semibold text-stone-900 dark:text-stone-100">
            {subscribers.length}
          </b>{" "}
          {subscribers.length === 1 ? "subscriber" : "subscribers"}
        </p>
        <button
          onClick={() => {
            window.location.href = withBase("/api/newsletter-subscribers?format=csv");
          }}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-500"
        >
          <Download size={14} aria-hidden /> Export CSV
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
      )}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500 dark:border-stone-800 dark:text-stone-400">
              <th className="px-5 py-3 font-semibold">Email</th>
              <th className="px-5 py-3 font-semibold">Source</th>
              <th className="px-5 py-3 font-semibold">Subscribed</th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-sm text-stone-500">
                  No subscribers yet.
                </td>
              </tr>
            )}
            {subscribers.map((s) => (
              <tr key={s.id} className="border-b border-stone-100 last:border-0 dark:border-stone-800">
                <td className="px-5 py-3 font-medium">{s.email}</td>
                <td className="px-5 py-3 text-xs">{s.source}</td>
                <td className="px-5 py-3 text-xs">
                  {new Date(s.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end">
                    <button
                      onClick={() => void remove(s.id, s.email)}
                      disabled={busy}
                      aria-label={`Remove ${s.email}`}
                      className="cursor-pointer rounded-lg p-1.5 text-stone-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-stone-800"
                    >
                      <Trash2 size={14} aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
