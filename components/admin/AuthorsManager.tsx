"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Save, Trash2, UserRound } from "lucide-react";
import UploadButton from "@/components/admin/UploadButton";
import { withBase } from "@/lib/base-path";
import { authorSlug } from "@/lib/authors";

type Author = {
  id: string;
  slug: string;
  name: string;
  role: string;
  photoUrl: string | null;
  bio: string;
  experienceYears: number | null;
  credentials: string[];
  linkedinUrl: string | null;
  email: string | null;
  isActive: boolean;
  _count?: { posts: number };
};

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-orange-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";
const labelCls = "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-500";

const blank = (): Author => ({
  id: "", slug: "", name: "", role: "", photoUrl: null, bio: "",
  experienceYears: null, credentials: [], linkedinUrl: null, email: null, isActive: true,
});

export default function AuthorsManager() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [editing, setEditing] = useState<Author | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(withBase("/api/authors"));
    const json = await res.json().catch(() => ({ ok: false }));
    if (json.ok) setAuthors(json.authors);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const set = <K extends keyof Author>(k: K, v: Author[K]) =>
    setEditing((p) => (p ? { ...p, [k]: v } : p));

  async function save() {
    if (!editing) return;
    if (editing.name.trim().length < 2) { setMsg("A name is required."); return; }
    setBusy(true); setMsg("");
    try {
      const isNew = !editing.id;
      const body = {
        name: editing.name.trim(),
        slug: editing.slug || authorSlug(editing.name),
        role: editing.role,
        photoUrl: editing.photoUrl || null,
        bio: editing.bio,
        experienceYears: editing.experienceYears,
        credentials: editing.credentials.filter((c) => c.trim()),
        linkedinUrl: editing.linkedinUrl || null,
        email: editing.email || null,
        isActive: editing.isActive,
      };
      const res = await fetch(
        withBase(isNew ? "/api/authors" : `/api/authors/${editing.id}`),
        { method: isNew ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
      );
      const json = await res.json();
      if (!json.ok) { setMsg(json.error ?? "Save failed."); return; }
      setMsg("Saved.");
      setEditing(null);
      await load();
    } finally { setBusy(false); }
  }

  async function remove(a: Author) {
    if (!window.confirm(`Delete ${a.name}?`)) return;
    const res = await fetch(withBase(`/api/authors/${a.id}`), { method: "DELETE" });
    const json = await res.json();
    if (!json.ok) { setMsg(json.error ?? "Delete failed."); return; }
    await load();
  }

  /* What a profile is still missing. Shown per author because an empty bio or
     a missing LinkedIn is the difference between a byline that earns trust and
     one that just has a name on it — and only a person can fill these in. */
  const gaps = (a: Author) =>
    [
      !a.photoUrl && "photo",
      !a.bio.trim() && "bio",
      !a.role.trim() && "role",
      !a.linkedinUrl && "LinkedIn",
      a.experienceYears == null && "experience",
    ].filter(Boolean) as string[];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Authors</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Public profiles behind article bylines. A complete profile — real
            name, photo, role, experience and LinkedIn — is what makes a byline
            worth anything to a reader or to Google.
          </p>
        </div>
        <button
          onClick={() => { setEditing(blank()); setMsg(""); }}
          className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500"
        >
          <Plus size={15} /> New author
        </button>
      </div>

      {msg && <p className="mt-3 text-sm font-semibold text-stone-600 dark:text-stone-300">{msg}</p>}

      {editing && (
        <div className="mt-4 rounded-2xl border border-orange-200 bg-[#FFF9F5] p-5 dark:border-stone-700 dark:bg-stone-900">
          <h2 className="font-display text-sm font-bold">
            {editing.id ? `Edit ${editing.name || "author"}` : "New author"}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Full name *</label>
              <input value={editing.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="Priya Sharma" />
            </div>
            <div>
              <label className={labelCls}>Role / job title</label>
              <input value={editing.role} onChange={(e) => set("role", e.target.value)} className={inputCls} placeholder="SEO Lead" />
            </div>
            <div>
              <label className={labelCls}>URL slug</label>
              <input
                value={editing.slug}
                onChange={(e) => set("slug", e.target.value)}
                className={`${inputCls} font-mono`}
                placeholder={authorSlug(editing.name) || "priya-sharma"}
              />
              <p className="mt-1 text-[11px] text-stone-400">
                /author/{editing.slug || authorSlug(editing.name) || "…"} — changing this
                breaks links already published against their articles.
              </p>
            </div>
            <div>
              <label className={labelCls}>Years of experience</label>
              <input
                type="number" min={0} max={70}
                value={editing.experienceYears ?? ""}
                onChange={(e) => set("experienceYears", e.target.value === "" ? null : Number(e.target.value))}
                className={inputCls}
                placeholder="6"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Photo</label>
              <div className="flex items-center gap-2">
                <input value={editing.photoUrl ?? ""} onChange={(e) => set("photoUrl", e.target.value)} className={inputCls} placeholder="Paste a URL or upload →" />
                <UploadButton accept="image/*" onUploaded={(url) => set("photoUrl", url)} />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Short bio</label>
              <textarea
                value={editing.bio}
                onChange={(e) => set("bio", e.target.value)}
                rows={3}
                className={inputCls}
                placeholder="What they actually do, and what they have actually done. Write it truthfully — an invented bio is worse than none."
              />
            </div>
            <div>
              <label className={labelCls}>LinkedIn URL</label>
              <input value={editing.linkedinUrl ?? ""} onChange={(e) => set("linkedinUrl", e.target.value)} className={inputCls} placeholder="https://www.linkedin.com/in/…" />
            </div>
            <div>
              <label className={labelCls}>Public email (optional)</label>
              <input value={editing.email ?? ""} onChange={(e) => set("email", e.target.value)} className={inputCls} placeholder="priya@digisutrasolutions.com" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Credentials (one per line)</label>
              <textarea
                value={editing.credentials.join("\n")}
                onChange={(e) => set("credentials", e.target.value.split("\n"))}
                rows={3}
                className={inputCls}
                placeholder={"Google Ads Certified\nGA4 Certified"}
              />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={editing.isActive} onChange={(e) => set("isActive", e.target.checked)} className="accent-orange-600" />
              <span className="text-stone-700 dark:text-stone-200">
                Active — off hides the profile and drops their articles back to the team byline
              </span>
            </label>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={() => void save()} disabled={busy} className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50">
              <Save size={15} /> {busy ? "Saving…" : "Save"}
            </button>
            <button onClick={() => setEditing(null)} className="text-xs font-semibold text-stone-500 hover:text-stone-800">Cancel</button>
          </div>
        </div>
      )}

      <ul className="mt-5 space-y-2">
        {authors.length === 0 && (
          <li className="rounded-2xl border border-stone-200 bg-white p-10 text-center text-sm text-stone-500 dark:border-stone-800 dark:bg-stone-900">
            No author profiles yet. Articles publish under the DigiSutra team byline until you add one.
          </li>
        )}
        {authors.map((a) => {
          const missing = gaps(a);
          return (
            <li key={a.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-100 text-stone-400 dark:bg-stone-800">
                {a.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={withBase(a.photoUrl)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <UserRound size={18} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {a.name}
                  {!a.isActive && <span className="ml-2 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-500 dark:bg-stone-800">Off</span>}
                </p>
                <p className="text-[11px] text-stone-400">
                  {[a.role, `/author/${a.slug}`, `${a._count?.posts ?? 0} article(s)`].filter(Boolean).join(" · ")}
                </p>
                {missing.length > 0 && (
                  <p className="mt-1 text-[11px] font-medium text-amber-700">
                    Missing: {missing.join(", ")}
                  </p>
                )}
              </div>
              <button onClick={() => { setEditing({ ...a }); setMsg(""); }} className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:border-orange-400 hover:text-orange-700 dark:border-stone-700 dark:text-stone-300">
                Edit
              </button>
              <button onClick={() => void remove(a)} title="Delete" className="rounded-lg border border-stone-300 p-1.5 text-stone-400 hover:border-red-400 hover:text-red-600 dark:border-stone-700">
                <Trash2 size={14} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
