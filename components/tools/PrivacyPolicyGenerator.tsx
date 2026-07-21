"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Printer } from "lucide-react";

/* Privacy policy generator — assembles a plain-English draft from what
   the business actually does. Explicitly a starting draft, not legal
   advice; the disclaimer stays on screen and in the output. */

const COLLECT = [
  { key: "contact", label: "Contact form details (name, email, phone)" },
  { key: "whatsapp", label: "WhatsApp number for follow-up" },
  { key: "analytics", label: "Anonymous analytics (page views)" },
  { key: "cookies", label: "Cookies for site functionality" },
  { key: "payments", label: "Payment details via a gateway" },
  { key: "newsletter", label: "Email address for a newsletter" },
];

export default function PrivacyPolicyGenerator() {
  const [biz, setBiz] = useState({ name: "", site: "", email: "", country: "India" });
  const [picked, setPicked] = useState<Record<string, boolean>>({
    contact: true,
    analytics: true,
    cookies: true,
  });
  const [copied, setCopied] = useState(false);

  const policy = useMemo(() => {
    const name = biz.name.trim() || "[Your business name]";
    const site = biz.site.trim() || "[yourwebsite.com]";
    const email = biz.email.trim() || "[privacy@yourbusiness.com]";
    const on = (k: string) => picked[k];
    const today = "the date this policy was last updated";

    const collected = [
      on("contact") && "the name, email address and phone number you enter in our contact forms",
      on("whatsapp") && "your WhatsApp number, where you share it so we can reply",
      on("newsletter") && "your email address, if you subscribe to updates",
      on("analytics") && "anonymous usage data such as pages viewed and approximate location",
      on("payments") && "payment information, which is processed by our payment provider and never stored by us",
    ].filter(Boolean) as string[];

    return `PRIVACY POLICY — ${name}

Last updated: ${today}.

1. WHO WE ARE
${name} operates ${site}. If you have any question about this policy or your data, write to ${email}.

2. WHAT WE COLLECT
We collect ${collected.length ? "only what we need to reply to you and run this website" : "very little"}:
${collected.map((c) => `  · ${c}`).join("\n") || "  · nothing beyond what your browser sends automatically"}

3. WHY WE COLLECT IT
We use this information to respond to enquiries, deliver the services you ask for, and improve the website. We do not sell your data, and we do not share it with anyone except the service providers that help us operate (for example email delivery or payment processing).

${on("cookies") ? `4. COOKIES
We use cookies that keep the site working and, where you allow it, measure how the site is used. You can clear or block cookies in your browser settings; parts of the site may then behave differently.

` : ""}${on("analytics") ? `5. ANALYTICS
We measure page views to understand what content is useful. This data is aggregated and is not used to identify you personally.

` : ""}6. HOW LONG WE KEEP IT
We keep enquiry records only as long as needed to serve you and to meet our legal and accounting obligations, then delete them.

7. YOUR RIGHTS
You can ask us what data we hold about you, ask us to correct it, or ask us to delete it. Email ${email} and we will respond within a reasonable period.${biz.country === "India" ? " We handle personal data in line with applicable Indian law, including the Digital Personal Data Protection Act, 2023." : ""}

8. SECURITY
We use appropriate technical measures to protect your data, including encrypted connections. No system is perfectly secure, so we cannot guarantee absolute security.

9. CHANGES
If this policy changes, the updated version will be posted on this page with a new date.

Contact: ${email}

---
This draft was generated as a starting point. It is not legal advice — have a lawyer review it before publishing, especially if you handle payments, health data or children's data.`;
  }, [biz, picked]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(policy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  const field =
    "w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-orange-500";

  return (
    <div className="grid gap-6 rounded-[2rem] bg-[#FFF6EF] p-6 sm:p-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-8">
      <div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-stone-500">Business name</label>
            <input value={biz.name} onChange={(e) => setBiz({ ...biz, name: e.target.value })} className={field} placeholder="Acme Traders" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-500">Website</label>
            <input value={biz.site} onChange={(e) => setBiz({ ...biz, site: e.target.value })} className={field} placeholder="acmetraders.in" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-500">Contact email</label>
            <input value={biz.email} onChange={(e) => setBiz({ ...biz, email: e.target.value })} className={field} placeholder="privacy@acmetraders.in" />
          </div>
        </div>

        <p className="mt-5 text-sm font-semibold text-stone-700">What do you collect?</p>
        <div className="mt-2 space-y-2">
          {COLLECT.map((c) => (
            <label key={c.key} className="flex cursor-pointer items-start gap-2.5 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={Boolean(picked[c.key])}
                onChange={(e) => setPicked((p) => ({ ...p, [c.key]: e.target.checked }))}
                className="mt-0.5 h-4 w-4 accent-[#F26419]"
              />
              {c.label}
            </label>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={copy} className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#F26419] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600">
            {copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
            {copied ? "Copied" : "Copy policy"}
          </button>
          <button onClick={() => window.print()} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-bold text-stone-800 transition-colors hover:border-[#F26419]">
            <Printer size={15} aria-hidden /> Print
          </button>
        </div>

        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
          A generated policy is a starting draft, not legal advice. Have a lawyer review it before
          you publish — especially if you take payments or handle sensitive data.
        </p>
      </div>

      <pre className="invoice-sheet max-h-[560px] overflow-auto whitespace-pre-wrap rounded-2xl bg-white p-5 font-sans text-xs leading-relaxed text-stone-700">
        {policy}
      </pre>
    </div>
  );
}
