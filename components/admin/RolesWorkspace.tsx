"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check, ChevronDown, Layers, Lock, Pencil, Plus, RotateCcw, Save, Search, ShieldCheck, Sparkles, Table2, Trash2, Users,
} from "lucide-react";
import { withBase } from "@/lib/base-path";
import RolesMatrix from "@/components/admin/RolesMatrix";
import {
  ALL_PERMISSIONS, EDITABLE_ROLES, PERMISSION_GROUPS, PERMISSION_META, ROLE_LABELS,
  type Permission, type PermissionGroup,
} from "@/lib/auth/rbac";

type EditableRole = (typeof EDITABLE_ROLES)[number];
type Matrix = Record<EditableRole, Permission[]>;
type CustomRole = { id: string; name: string; permissions: string[]; userCount: number };
type Sel =
  | { kind: "super" }
  | { kind: "system"; role: EditableRole }
  | { kind: "custom"; id: string }
  | { kind: "new" };

const AVATAR = ["bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300", "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300", "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300", "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300", "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300"];
const initials = (s: string) => s.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

function RoleRow({ active, avatar, name, sub, onClick, badge, locked }: { active: boolean; avatar: React.ReactNode; name: string; sub: string; onClick: () => void; badge?: string; locked?: boolean }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-colors ${active ? "border-orange-300 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/40" : "border-transparent hover:bg-stone-50 dark:hover:bg-stone-800/50"}`}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold">{avatar}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-stone-800 dark:text-stone-100">{name}{locked && <Lock size={11} className="text-stone-400" />}{badge && <span className="rounded-full bg-stone-200 px-1.5 py-0.5 text-[10px] font-bold text-stone-500 dark:bg-stone-700">{badge}</span>}</span>
        <span className="block truncate text-[11px] text-stone-400">{sub}</span>
      </span>
    </button>
  );
}

export default function RolesWorkspace({ initialMatrix, systemCounts }: { initialMatrix: Matrix; systemCounts: Record<string, number> }) {
  const [matrix, setMatrix] = useState<Matrix>(initialMatrix);
  const [savedMatrix, setSavedMatrix] = useState<Matrix>(initialMatrix);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [sel, setSel] = useState<Sel>({ kind: "system", role: "DEVELOPER" });
  const [draft, setDraft] = useState<{ name: string; perms: Set<Permission> }>({ name: "", perms: new Set() });
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<PermissionGroup>>(new Set());
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");
  const [compare, setCompare] = useState(false);

  const loadRoles = useCallback(async () => {
    const res = await fetch(withBase("/api/roles"));
    const json = await res.json();
    if (json.ok) setCustomRoles(json.roles);
  }, []);
  useEffect(() => { const t = setTimeout(() => void loadRoles(), 0); return () => clearTimeout(t); }, [loadRoles]);

  // Load the editing draft whenever a custom/new role is selected.
  function select(next: Sel) {
    setSel(next); setFlash("");
    if (next.kind === "custom") {
      const r = customRoles.find((c) => c.id === next.id);
      setDraft({ name: r?.name ?? "", perms: new Set((r?.permissions ?? []) as Permission[]) });
    } else if (next.kind === "new") {
      setDraft({ name: "", perms: new Set() });
    }
  }

  // The permission set the right pane shows for the current selection.
  const activePerms: Set<Permission> = useMemo(() => {
    if (sel.kind === "super") return new Set(ALL_PERMISSIONS);
    if (sel.kind === "system") return new Set(matrix[sel.role]);
    return draft.perms;
  }, [sel, matrix, draft]);

  const readOnly = sel.kind === "super";

  function toggle(perm: Permission) {
    if (readOnly) return;
    if (sel.kind === "system") {
      setMatrix((m) => {
        const set = new Set(m[sel.role]);
        if (set.has(perm)) set.delete(perm); else set.add(perm);
        return { ...m, [sel.role]: [...set] };
      });
    } else {
      setDraft((d) => { const perms = new Set(d.perms); if (perms.has(perm)) perms.delete(perm); else perms.add(perm); return { ...d, perms }; });
    }
  }
  function toggleGroup(group: PermissionGroup, on: boolean) {
    if (readOnly) return;
    const inGroup = ALL_PERMISSIONS.filter((p) => PERMISSION_META[p].group === group);
    if (sel.kind === "system") {
      setMatrix((m) => { const set = new Set(m[sel.role]); inGroup.forEach((p) => on ? set.add(p) : set.delete(p)); return { ...m, [sel.role]: [...set] }; });
    } else {
      setDraft((d) => { const perms = new Set(d.perms); inGroup.forEach((p) => on ? perms.add(p) : perms.delete(p)); return { ...d, perms }; });
    }
  }

  const dirty = useMemo(() => {
    if (sel.kind === "system") {
      const a = new Set(matrix[sel.role]); const b = new Set(savedMatrix[sel.role]);
      if (a.size !== b.size) return true;
      for (const p of a) if (!b.has(p)) return true;
      return false;
    }
    if (sel.kind === "new") return draft.name.trim().length > 0 || draft.perms.size > 0;
    if (sel.kind === "custom") {
      const r = customRoles.find((c) => c.id === sel.id);
      if (!r) return false;
      if (draft.name !== r.name) return true;
      const b = new Set(r.permissions);
      if (draft.perms.size !== b.size) return true;
      for (const p of draft.perms) if (!b.has(p)) return true;
      return false;
    }
    return false;
  }, [sel, matrix, savedMatrix, draft, customRoles]);

  async function save() {
    setBusy(true); setFlash("");
    try {
      if (sel.kind === "system") {
        const res = await fetch(withBase("/api/settings/rbac"), { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ matrix }) });
        const json = await res.json();
        if (json.ok) { setMatrix(json.matrix); setSavedMatrix(json.matrix); setFlash("Saved."); } else setFlash(json.error ?? "Save failed.");
      } else if (sel.kind === "new" || sel.kind === "custom") {
        if (!draft.name.trim()) { setFlash("Name is required."); return; }
        const body = JSON.stringify({ name: draft.name.trim(), permissions: [...draft.perms] });
        const res = sel.kind === "new"
          ? await fetch(withBase("/api/roles"), { method: "POST", headers: { "Content-Type": "application/json" }, body })
          : await fetch(withBase(`/api/roles/${sel.id}`), { method: "PATCH", headers: { "Content-Type": "application/json" }, body });
        const json = await res.json();
        if (json.ok) { await loadRoles(); setFlash("Saved."); if (sel.kind === "new" && json.id) select({ kind: "custom", id: json.id }); }
        else setFlash(json.error ?? "Save failed.");
      }
    } finally { setBusy(false); }
  }
  function revert() {
    if (sel.kind === "system") setMatrix(savedMatrix);
    else if (sel.kind === "custom") { const r = customRoles.find((c) => c.id === sel.id); setDraft({ name: r?.name ?? "", perms: new Set((r?.permissions ?? []) as Permission[]) }); }
    else setDraft({ name: "", perms: new Set() });
    setFlash("");
  }
  async function loadStarter() {
    setBusy(true);
    try { await fetch(withBase("/api/roles/seed"), { method: "POST" }); await loadRoles(); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (sel.kind !== "custom") return;
    const r = customRoles.find((c) => c.id === sel.id);
    if (!window.confirm(`Delete role "${r?.name}"?${r && r.userCount > 0 ? ` ${r.userCount} user(s) fall back to their system role.` : ""}`)) return;
    await fetch(withBase(`/api/roles/${sel.id}`), { method: "DELETE" });
    await loadRoles();
    select({ kind: "system", role: "DEVELOPER" });
  }

  const grouped = useMemo(() => {
    const g = {} as Record<PermissionGroup, Permission[]>;
    for (const gr of PERMISSION_GROUPS) g[gr] = [];
    for (const p of ALL_PERMISSIONS) g[PERMISSION_META[p].group].push(p);
    return g;
  }, []);
  const q = search.trim().toLowerCase();
  const roleName = sel.kind === "super" ? "Super Admin" : sel.kind === "system" ? ROLE_LABELS[sel.role] : draft.name || "New role";

  if (compare) {
    return (
      <div>
        <button onClick={() => setCompare(false)} className="mb-4 flex items-center gap-1.5 rounded-lg border border-stone-300 px-3.5 py-2 text-sm font-semibold text-stone-600 hover:border-orange-400 hover:text-orange-600 dark:border-stone-700 dark:text-stone-300"><Layers size={15} /> Back to editor</button>
        <RolesMatrix initialMatrix={savedMatrix} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      {/* Left: roles */}
      <div className="w-full shrink-0 rounded-2xl border border-stone-200 bg-white p-2.5 lg:w-64 dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-stone-400">Roles</span>
          <button onClick={() => setCompare(true)} title="Compare all roles" className="flex items-center gap-1 text-[11px] font-semibold text-stone-400 hover:text-orange-600"><Table2 size={12} /> Compare</button>
        </div>
        <div className="space-y-0.5">
          <RoleRow active={sel.kind === "super"} locked avatar={<ShieldCheck size={15} className="text-stone-400" />} name={ROLE_LABELS.SUPER_ADMIN} sub={`All access · ${systemCounts.SUPER_ADMIN ?? 0} user${(systemCounts.SUPER_ADMIN ?? 0) === 1 ? "" : "s"}`} onClick={() => select({ kind: "super" })} />
          {EDITABLE_ROLES.map((r, i) => (
            <RoleRow key={r} active={sel.kind === "system" && sel.role === r} avatar={<span className={`flex h-full w-full items-center justify-center rounded-lg ${AVATAR[i % AVATAR.length]}`}>{initials(ROLE_LABELS[r])}</span>} name={ROLE_LABELS[r]} sub={`${matrix[r].length} permissions · ${systemCounts[r] ?? 0} user${(systemCounts[r] ?? 0) === 1 ? "" : "s"}`} onClick={() => select({ kind: "system", role: r })} />
          ))}
          {customRoles.length > 0 && <div className="px-2 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-stone-300">Custom</div>}
          {customRoles.map((c, i) => (
            <RoleRow key={c.id} active={sel.kind === "custom" && sel.id === c.id} badge="custom" avatar={<span className={`flex h-full w-full items-center justify-center rounded-lg ${AVATAR[(i + 2) % AVATAR.length]}`}>{initials(c.name)}</span>} name={c.name} sub={`${c.permissions.length} permissions · ${c.userCount} user${c.userCount === 1 ? "" : "s"}`} onClick={() => select({ kind: "custom", id: c.id })} />
          ))}
          <button onClick={() => select({ kind: "new" })} className={`mt-1 flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-semibold transition-colors ${sel.kind === "new" ? "bg-orange-50 text-orange-700 dark:bg-orange-950/40" : "text-orange-600 hover:bg-orange-50 dark:hover:bg-stone-800/50"}`}>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950"><Plus size={15} /></span> New role
          </button>
          {!customRoles.some((c) => c.name === "Sales Member") && (
            <button onClick={() => void loadStarter()} disabled={busy} className="mt-0.5 flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-[11px] font-semibold text-stone-400 hover:text-orange-600 disabled:opacity-50">
              <Sparkles size={13} className="ml-1.5" /> Add “Sales Member” starter
            </button>
          )}
        </div>
      </div>

      {/* Right: editor */}
      <div className="min-w-0 flex-1 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-start gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${sel.kind === "super" ? "bg-stone-100 text-stone-400 dark:bg-stone-800" : AVATAR[0]}`}>{sel.kind === "super" ? <ShieldCheck size={18} /> : initials(roleName || "N")}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {sel.kind === "custom" || sel.kind === "new" ? (
                <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Role name (e.g. Sales Member)" className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-lg font-bold outline-none focus:border-orange-500 dark:border-stone-700 dark:bg-stone-900" />
              ) : (
                <div className="flex min-w-0 flex-1 items-center gap-2 text-lg font-bold">{roleName}{sel.kind === "super" && <Lock size={14} className="shrink-0 text-stone-400" />}</div>
              )}
              {sel.kind === "custom" && <button onClick={() => void remove()} className="shrink-0 rounded-lg border border-stone-300 p-2.5 text-stone-400 transition-colors hover:border-red-400 hover:text-red-600 dark:border-stone-700" aria-label="Delete role" title="Delete role"><Trash2 size={15} /></button>}
            </div>
            <p className="mt-1.5 text-xs text-stone-500">{activePerms.size} of {ALL_PERMISSIONS.length} permissions{sel.kind === "super" && " · always all"}</p>
          </div>
        </div>

        {readOnly && <p className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs text-stone-500 dark:border-stone-800 dark:bg-stone-950/40">Super Admin always holds every permission and can&apos;t be limited — this keeps you from locking yourself out.</p>}

        {/* Search */}
        <div className="relative mt-4">
          <Search size={15} className="absolute left-3 top-2.5 text-stone-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search permissions" className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-500 dark:border-stone-700 dark:bg-stone-900" />
        </div>

        {/* Groups */}
        <div className="mt-3 space-y-2">
          {PERMISSION_GROUPS.map((group) => {
            const perms = grouped[group].filter((p) => !q || PERMISSION_META[p].label.toLowerCase().includes(q));
            if (perms.length === 0) return null;
            const onCount = grouped[group].filter((p) => activePerms.has(p)).length;
            const isCollapsed = collapsed.has(group) && !q;
            const allOn = onCount === grouped[group].length;
            return (
              <div key={group} className="rounded-xl border border-stone-200 dark:border-stone-800">
                <div className="flex items-center justify-between px-3.5 py-2.5">
                  <button onClick={() => setCollapsed((c) => { const n = new Set(c); if (n.has(group)) n.delete(group); else n.add(group); return n; })} className="flex items-center gap-2 text-sm font-semibold">
                    <ChevronDown size={15} className={`text-stone-400 transition-transform ${isCollapsed ? "-rotate-90" : ""}`} /> {group}
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-500 dark:bg-stone-800">{onCount}/{grouped[group].length}</span>
                  </button>
                  {!readOnly && <button onClick={() => toggleGroup(group, !allOn)} className="text-[11px] font-semibold text-stone-400 hover:text-orange-600">{allOn ? "Clear" : "Select all"}</button>}
                </div>
                {!isCollapsed && (
                  <div className="border-t border-stone-100 px-3.5 dark:border-stone-800/60">
                    {perms.map((p) => {
                      const on = activePerms.has(p);
                      return (
                        <div key={p} className="flex items-center gap-3 border-b border-stone-50 py-2.5 last:border-0 dark:border-stone-800/40">
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-stone-800 dark:text-stone-100">{PERMISSION_META[p].label}</span>
                            <span className="block font-mono text-[10px] text-stone-400">{p}</span>
                          </span>
                          <button onClick={() => toggle(p)} disabled={readOnly} role="switch" aria-checked={on} aria-label={PERMISSION_META[p].label} className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-60 ${on ? "bg-orange-500" : "bg-stone-300 dark:bg-stone-700"}`}>
                            <span className={`absolute top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white transition-all ${on ? "left-4" : "left-0.5"}`}>{on && <Check size={10} className="text-orange-600" />}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Save bar */}
        {!readOnly && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-3 dark:border-stone-800">
            <button onClick={() => void save()} disabled={busy || !dirty} className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50">
              {sel.kind === "new" ? <Plus size={15} /> : <Save size={15} />} {busy ? "Saving…" : sel.kind === "new" ? "Create role" : "Save role"}
            </button>
            <button onClick={revert} disabled={busy || !dirty} className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3.5 py-2 text-sm font-semibold text-stone-500 hover:text-stone-800 disabled:opacity-40 dark:border-stone-700"><RotateCcw size={14} /> Revert</button>
            {dirty && !flash && <span className="flex items-center gap-1 text-xs font-semibold text-amber-600"><Pencil size={12} /> Unsaved changes</span>}
            {flash && <span className="text-xs font-semibold text-green-600">{flash}</span>}
            {sel.kind === "custom" && <span className="ml-auto flex items-center gap-1 text-[11px] text-stone-400"><Users size={12} /> {customRoles.find((c) => c.id === sel.id)?.userCount ?? 0} assigned</span>}
          </div>
        )}
      </div>
    </div>
  );
}
