"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Pencil, Plus, Sparkles, Trash2, Users, X } from "lucide-react";
import { withBase } from "@/lib/base-path";
import {
  ALL_PERMISSIONS,
  PERMISSION_GROUPS,
  PERMISSION_META,
  type Permission,
  type PermissionGroup,
} from "@/lib/auth/rbac";

type CustomRole = { id: string; name: string; permissions: string[]; userCount: number };

const inputCls =
  "rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

export default function CustomRolesManager() {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [editing, setEditing] = useState<CustomRole | null>(null);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(withBase("/api/roles"));
      const json = await res.json();
      if (json.ok) setRoles(json.roles);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  async function remove(r: CustomRole) {
    if (!window.confirm(`Delete role "${r.name}"?${r.userCount > 0 ? ` ${r.userCount} user(s) will fall back to their system role.` : ""}`)) return;
    await fetch(withBase(`/api/roles/${r.id}`), { method: "DELETE" });
    await load();
  }
  const [seeding, setSeeding] = useState(false);
  async function loadStarter() {
    setSeeding(true);
    try {
      await fetch(withBase("/api/roles/seed"), { method: "POST" });
      await load();
    } finally { setSeeding(false); }
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Custom roles</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">Build your own roles (e.g. Sales Member) and assign them to users on the Users page.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => void loadStarter()} disabled={seeding} className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3.5 py-2 text-sm font-semibold text-stone-600 hover:border-orange-400 hover:text-orange-600 disabled:opacity-50 dark:border-stone-700 dark:text-stone-300">
            <Sparkles size={15} /> {seeding ? "Adding…" : "Add Sales Member"}
          </button>
          <button onClick={() => { setAdding(true); setEditing(null); }} className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-orange-500">
            <Plus size={15} /> New role
          </button>
        </div>
      </div>

      {(adding || editing) && (
        <RoleEditor
          initial={editing}
          onClose={() => { setAdding(false); setEditing(null); }}
          onSaved={async () => { setAdding(false); setEditing(null); await load(); }}
        />
      )}

      {loading && <p className="mt-3 text-xs text-stone-400">Loading…</p>}
      {!loading && roles.length === 0 && !adding && (
        <p className="mt-3 rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-400 dark:border-stone-700">No custom roles yet.</p>
      )}

      <ul className="mt-3 space-y-2">
        {roles.map((r) => (
          <li key={r.id} className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-stone-900 dark:text-stone-100">{r.name}</p>
              <p className="mt-0.5 flex items-center gap-2 text-xs text-stone-500">
                {r.permissions.length} permission{r.permissions.length === 1 ? "" : "s"}
                <span className="inline-flex items-center gap-1"><Users size={11} /> {r.userCount}</span>
              </p>
            </div>
            <button onClick={() => { setEditing(r); setAdding(false); }} className="rounded-lg border border-stone-300 p-2 text-stone-400 hover:border-orange-400 hover:text-orange-600 dark:border-stone-700" aria-label="Edit"><Pencil size={14} /></button>
            <button onClick={() => void remove(r)} className="rounded-lg border border-stone-300 p-2 text-stone-400 hover:border-red-400 hover:text-red-600 dark:border-stone-700" aria-label="Delete"><Trash2 size={14} /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoleEditor({ initial, onClose, onSaved }: { initial: CustomRole | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [perms, setPerms] = useState<Set<Permission>>(new Set((initial?.permissions ?? []) as Permission[]));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const grouped: Record<PermissionGroup, Permission[]> = {
    Leads: [], Content: [], "Site setup": [], Audience: [], System: [],
  };
  for (const p of ALL_PERMISSIONS) grouped[PERMISSION_META[p].group].push(p);

  const toggle = (p: Permission) => setPerms((s) => { const n = new Set(s); if (n.has(p)) n.delete(p); else n.add(p); return n; });

  async function save() {
    if (!name.trim()) { setErr("Name is required."); return; }
    setBusy(true); setErr("");
    try {
      const res = await fetch(
        withBase(initial ? `/api/roles/${initial.id}` : "/api/roles"),
        { method: initial ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), permissions: [...perms] }) },
      );
      const json = await res.json();
      if (json.ok) onSaved();
      else setErr(json.error ?? "Save failed.");
    } finally { setBusy(false); }
  }

  return (
    <div className="mt-3 rounded-2xl border border-stone-200 bg-stone-50/60 p-5 dark:border-stone-800 dark:bg-stone-950/40">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-bold">{initial ? "Edit role" : "New role"}</h3>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-700"><X size={16} /></button>
      </div>
      <div className="max-w-xs">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-500">Role name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sales Member" className={`${inputCls} w-full`} autoFocus />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PERMISSION_GROUPS.map((g) => (
          <div key={g}>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-400">{g}</p>
            <ul className="space-y-1">
              {grouped[g].map((p) => (
                <li key={p}>
                  <button onClick={() => toggle(p)} role="checkbox" aria-checked={perms.has(p)} className="flex w-full items-center gap-2 text-left text-xs">
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${perms.has(p) ? "border-orange-500 bg-orange-500 text-white" : "border-stone-300 text-transparent dark:border-stone-600"}`}>
                      <Check size={11} />
                    </span>
                    <span className="text-stone-700 dark:text-stone-200">{PERMISSION_META[p].label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button onClick={() => void save()} disabled={busy} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50">{busy ? "Saving…" : "Save role"}</button>
        <span className="text-xs text-stone-400">{perms.size} selected</span>
        {err && <span className="text-xs text-red-500">{err}</span>}
      </div>
    </div>
  );
}
