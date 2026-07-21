"use client";

import { withBase } from "@/lib/base-path";

import { useState } from "react";
import { Save } from "lucide-react";

type FooterInfo = {
  description: string;
  address: string;
  phoneIndia: string;
  phoneUs: string;
  whatsapp: string;
  email: string;
};

const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";
const labelCls = "mb-1 block text-xs font-semibold text-stone-500 dark:text-stone-400";

export default function FooterInfoManager({ initial }: { initial: FooterInfo }) {
  const [info, setInfo] = useState<FooterInfo>(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof FooterInfo) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setInfo((prev) => ({ ...prev, [key]: e.target.value }));

  async function save() {
    setState("saving");
    setError(null);
    try {
      const res = await fetch(withBase("/api/settings/footer"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ info }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Save failed.");
        setState("error");
        return;
      }
      setState("saved");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setError("Network error.");
      setState("error");
    }
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelCls}>Brand description (under the footer logo)</label>
          <textarea value={info.description} onChange={set("description")} className={`${inputCls} min-h-20 resize-y`} maxLength={300} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Address (line break = new line in the footer)</label>
          <textarea value={info.address} onChange={set("address")} className={`${inputCls} min-h-16 resize-y`} maxLength={240} />
        </div>
        <div>
          <label className={labelCls}>India phone (shown with 🇮🇳 flag)</label>
          <input value={info.phoneIndia} onChange={set("phoneIndia")} className={inputCls} maxLength={30} />
        </div>
        <div>
          <label className={labelCls}>International phone (shown with 🇺🇸 flag)</label>
          <input value={info.phoneUs} onChange={set("phoneUs")} className={inputCls} maxLength={30} />
        </div>
        <div>
          <label className={labelCls}>WhatsApp number</label>
          <input value={info.whatsapp} onChange={set("whatsapp")} className={inputCls} maxLength={30} />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input type="email" value={info.email} onChange={set("email")} className={inputCls} maxLength={120} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          disabled={state === "saving"}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50"
        >
          <Save size={13} aria-hidden /> {state === "saving" ? "Saving…" : "Save footer"}
        </button>
        {state === "saved" && <span className="text-xs font-semibold text-emerald-600">Saved — live immediately.</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  );
}
