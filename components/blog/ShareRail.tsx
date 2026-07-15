"use client";

import { useState } from "react";
import { Check, Link2, MessageCircle } from "lucide-react";

/* Share buttons: WhatsApp first (primary audience), LinkedIn, X, copy link. */
export default function ShareRail({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  const enc = encodeURIComponent;
  // lucide-react dropped brand icons — LinkedIn/X use text glyphs like Footer.
  const targets = [
    {
      label: "Share on WhatsApp",
      href: `https://wa.me/?text=${enc(`${title} — ${url}`)}`,
      node: <MessageCircle size={15} aria-hidden />,
      className: "bg-[#E1F5EE] text-[#085041] hover:bg-[#25D366] hover:text-white",
    },
    {
      label: "Share on LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
      node: <span className="text-[11px] font-bold leading-none">in</span>,
      className: "bg-[#E6F1FB] text-[#0C447C] hover:bg-[#0A66C2] hover:text-white",
    },
    {
      label: "Share on X",
      href: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`,
      node: <span className="text-[12px] font-bold leading-none">𝕏</span>,
      className: "bg-stone-100 text-stone-700 hover:bg-stone-900 hover:text-white",
    },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {targets.map((t) => (
        <a
          key={t.label}
          href={t.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.label}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${t.className}`}
        >
          {t.node}
        </a>
      ))}
      <button
        onClick={copy}
        aria-label="Copy link"
        className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors ${
          copied
            ? "bg-green-100 text-green-800"
            : "bg-stone-100 text-stone-700 hover:bg-stone-200"
        }`}
      >
        {copied ? <Check size={15} aria-hidden /> : <Link2 size={15} aria-hidden />}
      </button>
    </div>
  );
}
