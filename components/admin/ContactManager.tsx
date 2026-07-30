"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { withBase } from "@/lib/base-path";
import { DESK_ICONS, type ContactConfig, type Desk } from "@/lib/contact-config";

const input =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";
const label = "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400";
const card = "rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900";

function Field({
  k, label: lbl, value, onChange, full, area, placeholder,
}: {
  k: string; label: string; value: string; onChange: (v: string) => void;
  full?: boolean; area?: boolean; placeholder?: string;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label htmlFor={k} className={label}>{lbl}</label>
      {area ? (
        <textarea id={k} rows={2} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={input} />
      ) : (
        <input id={k} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={input} />
      )}
    </div>
  );
}

export default function ContactManager({ contact }: { contact: ContactConfig }) {
  const router = useRouter();
  const [c, setC] = useState<ContactConfig>(contact);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof ContactConfig>(k: K, v: ContactConfig[K]) => setC((p) => ({ ...p, [k]: v }));
  const setDesk = (i: number, patch: Partial<Desk>) =>
    setC((p) => ({ ...p, desks: p.desks.map((d, k) => (k === i ? { ...d, ...patch } : d)) }));
  const addDesk = () =>
    setC((p) => ({ ...p, desks: [...p.desks, { key: `DESK_${p.desks.length + 1}`, label: "New desk", short: "Desk", cta: "Send message", blurb: "", email: "", phone: "", icon: "message" }] }));
  const removeDesk = (i: number) => setC((p) => ({ ...p, desks: p.desks.filter((_, k) => k !== i) }));

  async function save() {
    setBusy(true); setErr(null); setMsg(null);
    try {
      const res = await fetch(withBase("/api/settings/contact"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: c }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) { setErr(json.error ?? "Save failed."); return; }
      setMsg("Saved — live on the contact page.");
      router.refresh();
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className={card}>
        <h3 className="font-display text-sm font-bold">Page copy</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field k="c-eyebrow" label="Eyebrow" value={c.eyebrow} onChange={(v) => set("eyebrow", v)} />
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Field k="c-heading" label="Heading" value={c.heading} onChange={(v) => set("heading", v)} />
            <Field k="c-accent" label="Accent word" value={c.headingAccent} onChange={(v) => set("headingAccent", v)} />
          </div>
          <Field k="c-sub" label="Subheading" value={c.subheading} onChange={(v) => set("subheading", v)} full area />
        </div>
      </div>

      <div className={card}>
        <h3 className="font-display text-sm font-bold">Promises &amp; address line</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field k="c-resp" label="Response promise (bold)" value={c.responsePromise} onChange={(v) => set("responsePromise", v)} placeholder="under 2 hours" />
          <Field k="c-respn" label="Response note" value={c.responseNote} onChange={(v) => set("responseNote", v)} placeholder="Mon–Fri, 24-hour desk" />
          <Field k="c-aud" label="Audit promise (bold)" value={c.auditPromise} onChange={(v) => set("auditPromise", v)} placeholder="15-page audit" />
          <Field k="c-audn" label="Audit note" value={c.auditNote} onChange={(v) => set("auditNote", v)} placeholder="in 48 hours" />
          <Field k="c-addr" label="Address line (displayed)" value={c.addressLine} onChange={(v) => set("addressLine", v)} full />
        </div>
      </div>

      <div className={card}>
        <h3 className="font-display text-sm font-bold">Contact details</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field k="c-hours" label="Business hours" value={c.hours} onChange={(v) => set("hours", v)} />
          <Field k="c-usa" label="USA toll-free (optional)" value={c.usaTollFree} onChange={(v) => set("usaTollFree", v)} />
          <Field k="c-wa" label="WhatsApp number (digits, e.g. 91995…)" value={c.whatsappNumber} onChange={(v) => set("whatsappNumber", v)} />
          <Field k="c-wad" label="WhatsApp display" value={c.whatsappDisplay} onChange={(v) => set("whatsappDisplay", v)} />
          <Field k="c-mainp" label="Main phone (schema.org)" value={c.mainPhone} onChange={(v) => set("mainPhone", v)} />
          <Field k="c-maine" label="Main email (routing default)" value={c.mainEmail} onChange={(v) => set("mainEmail", v)} />
          <Field k="c-street" label="Street (schema.org)" value={c.street} onChange={(v) => set("street", v)} full />
          <Field k="c-loc" label="City" value={c.locality} onChange={(v) => set("locality", v)} />
          <Field k="c-reg" label="State / region" value={c.region} onChange={(v) => set("region", v)} />
          <Field k="c-cty" label="Country code" value={c.country} onChange={(v) => set("country", v)} />
          <Field k="c-map" label="Map embed URL (optional)" value={c.mapEmbedUrl} onChange={(v) => set("mapEmbedUrl", v)} />
        </div>
      </div>

      <div className={card}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-bold">Enquiry desks</h3>
          <button onClick={addDesk} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-500 hover:border-orange-400 hover:text-orange-700 dark:border-stone-700">
            <Plus size={12} /> Add desk
          </button>
        </div>
        <p className="mt-1 text-xs text-stone-400">The email decides where an enquiry routed to that desk lands.</p>
        <div className="mt-3 space-y-3">
          {c.desks.map((d, i) => (
            <div key={i} className="rounded-xl border border-stone-200 p-3 dark:border-stone-800">
              <div className="grid gap-2 sm:grid-cols-4">
                <Field k={`d-key-${i}`} label="Key" value={d.key} onChange={(v) => setDesk(i, { key: v.toUpperCase().replace(/[^A-Z0-9_]/g, "_") })} />
                <Field k={`d-label-${i}`} label="Label" value={d.label} onChange={(v) => setDesk(i, { label: v })} />
                <Field k={`d-short-${i}`} label="Short" value={d.short} onChange={(v) => setDesk(i, { short: v })} />
                <div>
                  <label htmlFor={`d-icon-${i}`} className={label}>Icon</label>
                  <select id={`d-icon-${i}`} value={d.icon} onChange={(e) => setDesk(i, { icon: e.target.value as Desk["icon"] })} className={input}>
                    {DESK_ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                  </select>
                </div>
                <Field k={`d-email-${i}`} label="Email" value={d.email} onChange={(v) => setDesk(i, { email: v })} />
                <Field k={`d-phone-${i}`} label="Phone" value={d.phone} onChange={(v) => setDesk(i, { phone: v })} />
                <Field k={`d-cta-${i}`} label="Button label" value={d.cta} onChange={(v) => setDesk(i, { cta: v })} />
                <Field k={`d-blurb-${i}`} label="Blurb" value={d.blurb} onChange={(v) => setDesk(i, { blurb: v })} />
              </div>
              {c.desks.length > 1 && (
                <button onClick={() => removeDesk(i)} className="mt-2 flex cursor-pointer items-center gap-1 text-xs font-semibold text-stone-400 hover:text-red-600">
                  <Trash2 size={12} /> Remove desk
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={card}>
        <h3 className="font-display text-sm font-bold">SEO</h3>
        <div className="mt-3 grid gap-3">
          <Field k="c-seot" label="SEO title" value={c.seoTitle} onChange={(v) => set("seoTitle", v)} />
          <Field k="c-seod" label="Meta description" value={c.seoDescription} onChange={(v) => set("seoDescription", v)} area />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => void save()} disabled={busy} className="cursor-pointer rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60">
          {busy ? "Saving…" : "Save contact page"}
        </button>
        {msg && <span className="text-xs text-emerald-700">{msg}</span>}
        {err && <span className="text-xs text-red-600">{err}</span>}
      </div>
    </div>
  );
}
