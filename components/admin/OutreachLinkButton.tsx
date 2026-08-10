"use client";

import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { withBase } from "@/lib/base-path";

/* Mint a tokenised outreach link for a lead and put it on the clipboard.

   Copy rather than send, deliberately: the team already reaches clients on
   WhatsApp, email and Teams depending on the relationship, and guessing which
   one is worse than letting them paste it where the conversation already is.
   Asking again returns the SAME link, so a reminder points at the same page
   and the opened/completed stamps stay meaningful. */

export default function OutreachLinkButton({
  leadId,
  kind,
  label,
}: {
  leadId: string;
  kind: "REVIEW" | "PROMO";
  label: string;
}) {
  const [state, setState] = useState<"idle" | "busy" | "copied" | "error">("idle");
  const [url, setUrl] = useState("");

  async function make() {
    setState("busy");
    try {
      const res = await fetch(withBase(`/api/leads/${leadId}/outreach`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setState("error");
        return;
      }
      setUrl(json.url);
      // Clipboard needs a secure context and can be refused; the link is shown
      // below either way so it is never trapped inside a failed copy.
      try {
        await navigator.clipboard.writeText(json.url);
        setState("copied");
      } catch {
        setState("idle");
      }
    } catch {
      setState("error");
    }
  }

  return (
    <span className="relative">
      <button
        onClick={() => void make()}
        disabled={state === "busy"}
        title={`Generate a ${kind === "REVIEW" ? "review request" : "offer"} link for this lead`}
        className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-600 transition-colors hover:border-orange-400 hover:text-orange-600 disabled:opacity-60 dark:border-stone-700 dark:text-stone-300"
      >
        {state === "copied" ? <Check size={14} className="text-green-600" /> : <Link2 size={14} />}
        {state === "busy" ? "Making…" : state === "copied" ? "Copied" : label}
      </button>
      {url && (
        <span className="absolute left-0 top-full z-20 mt-1 flex w-80 items-center gap-2 rounded-xl border border-stone-200 bg-white p-2 shadow-lg dark:border-stone-700 dark:bg-stone-900">
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full bg-transparent text-[11px] text-stone-600 outline-none dark:text-stone-300"
          />
          <button
            onClick={() => void navigator.clipboard.writeText(url).then(() => setState("copied"))}
            aria-label="Copy link"
            className="shrink-0 cursor-pointer rounded-lg p-1.5 text-stone-500 hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-stone-800"
          >
            <Copy size={13} />
          </button>
        </span>
      )}
      {state === "error" && (
        <span className="absolute left-0 top-full z-20 mt-1 whitespace-nowrap rounded-lg bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700">
          Could not create the link.
        </span>
      )}
    </span>
  );
}
