"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, Trash2 } from "lucide-react";

type RedirectRow = {
  id: string;
  fromPath: string;
  toPath: string;
  permanent: boolean;
  isActive: boolean;
  hits: number;
};

const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

export default function RedirectsManager({ redirects }: { redirects: RedirectRow[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function api(path: string, init: RequestInit): Promise<boolean> {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(path, {
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Request failed.");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("Network error.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const ok = await api("/api/redirects", {
      method: "POST",
      body: JSON.stringify({
        fromPath: fd.get("fromPath"),
        toPath: fd.get("toPath"),
        permanent: fd.get("permanent") === "on",
      }),
    });
    if (ok) form.reset();
  }

  return (
    <div>
      <form
        onSubmit={handleCreate}
        className="grid grid-cols-1 gap-3 rounded-2xl border border-stone-200 bg-white p-5 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end dark:border-stone-800 dark:bg-stone-900"
      >
        <div>
          <label htmlFor="r-from" className="mb-1 block text-xs font-semibold">From path</label>
          <input id="r-from" name="fromPath" required placeholder="/old-services" className={inputCls} />
        </div>
        <div>
          <label htmlFor="r-to" className="mb-1 block text-xs font-semibold">To (path or URL)</label>
          <input id="r-to" name="toPath" required placeholder="/digital-marketing-services" className={inputCls} />
        </div>
        <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm">
          <input type="checkbox" name="permanent" className="h-4 w-4 accent-orange-600" />
          308 permanent
        </label>
        <button
          type="submit"
          disabled={busy}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-500 disabled:opacity-60"
        >
          <Plus size={14} aria-hidden /> Add
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
      )}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500 dark:border-stone-800 dark:text-stone-400">
              <th className="px-5 py-3 font-semibold">Rule</th>
              <th className="px-5 py-3 font-semibold">Type</th>
              <th className="px-5 py-3 font-semibold">Hits</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {redirects.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-stone-500">
                  No redirects yet.
                </td>
              </tr>
            )}
            {redirects.map((r) => (
              <tr key={r.id} className="border-b border-stone-100 last:border-0 dark:border-stone-800">
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-2 font-mono text-xs">
                    {r.fromPath}
                    <ArrowRight size={12} className="text-orange-600" aria-hidden />
                    {r.toPath}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs">{r.permanent ? "308 permanent" : "307 temporary"}</td>
                <td className="px-5 py-3 text-xs">{r.hits}</td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => void api(`/api/redirects/${r.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !r.isActive }) })}
                    disabled={busy}
                    className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      r.isActive
                        ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-950 dark:text-green-300"
                        : "bg-stone-100 text-stone-500 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400"
                    }`}
                  >
                    {r.isActive ? "Active" : "Disabled"}
                  </button>
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete redirect ${r.fromPath}?`)) {
                          void api(`/api/redirects/${r.id}`, { method: "DELETE" });
                        }
                      }}
                      disabled={busy}
                      aria-label={`Delete redirect ${r.fromPath}`}
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
