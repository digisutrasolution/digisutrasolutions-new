"use client";

import { useMemo, useState } from "react";
import { Check, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { withBase } from "@/lib/base-path";
import {
  ALL_PERMISSIONS,
  EDITABLE_ROLES,
  PERMISSION_GROUPS,
  PERMISSION_META,
  ROLE_LABELS,
  type Permission,
  type PermissionGroup,
} from "@/lib/auth/rbac";

type EditableRole = (typeof EDITABLE_ROLES)[number];
type Matrix = Record<EditableRole, Permission[]>;

export default function RolesMatrix({ initialMatrix }: { initialMatrix: Matrix }) {
  // Work on Sets for cheap toggles; serialise back to arrays on save.
  const toSets = (m: Matrix): Record<EditableRole, Set<Permission>> =>
    Object.fromEntries(EDITABLE_ROLES.map((r) => [r, new Set(m[r])])) as Record<EditableRole, Set<Permission>>;

  const [saved, setSaved] = useState<Matrix>(initialMatrix);
  const [sets, setSets] = useState(() => toSets(initialMatrix));
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");

  const grouped = useMemo(() => {
    const g: Record<PermissionGroup, Permission[]> = {
      Leads: [], Content: [], "Site setup": [], Audience: [], System: [],
    };
    for (const p of ALL_PERMISSIONS) g[PERMISSION_META[p].group].push(p);
    return g;
  }, []);

  const dirty = useMemo(() => {
    for (const r of EDITABLE_ROLES) {
      const a = sets[r];
      const b = new Set(saved[r]);
      if (a.size !== b.size) return true;
      for (const p of a) if (!b.has(p)) return true;
    }
    return false;
  }, [sets, saved]);

  function toggle(role: EditableRole, perm: Permission) {
    setSets((prev) => {
      const next = { ...prev, [role]: new Set(prev[role]) };
      if (next[role].has(perm)) next[role].delete(perm);
      else next[role].add(perm);
      return next;
    });
  }

  function reset() {
    setSets(toSets(saved));
    setFlash("");
  }

  async function save() {
    setBusy(true);
    setFlash("");
    const matrix = Object.fromEntries(
      EDITABLE_ROLES.map((r) => [r, [...sets[r]]]),
    ) as Matrix;
    try {
      const res = await fetch(withBase("/api/settings/rbac"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matrix }),
      });
      const json = await res.json();
      if (json.ok) {
        setSaved(json.matrix);
        setSets(toSets(json.matrix));
        setFlash("Saved. Permissions updated.");
      } else {
        setFlash(json.error ?? "Save failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  const th = "px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wide";

  return (
    <div>
      {/* Action bar */}
      <div className="sticky top-0 z-10 mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-white/90 p-3 backdrop-blur dark:border-stone-800 dark:bg-stone-900/90">
        <button onClick={() => void save()} disabled={busy || !dirty} className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50">
          <Save size={15} /> {busy ? "Saving…" : "Save changes"}
        </button>
        <button onClick={reset} disabled={busy || !dirty} className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3.5 py-2 text-sm font-semibold text-stone-500 hover:text-stone-800 disabled:opacity-40 dark:border-stone-700 dark:text-stone-400">
          <RotateCcw size={14} /> Revert
        </button>
        {dirty && !flash && <span className="text-xs font-semibold text-amber-600">Unsaved changes</span>}
        {flash && <span className="text-xs font-semibold text-green-600">{flash}</span>}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-stone-200 dark:border-stone-800">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-900">
              <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-stone-500">Permission</th>
              <th className={`${th} text-stone-400`}>
                <span className="inline-flex items-center gap-1"><ShieldCheck size={13} /> {ROLE_LABELS.SUPER_ADMIN}</span>
              </th>
              {EDITABLE_ROLES.map((r) => (
                <th key={r} className={`${th} text-stone-600 dark:text-stone-300`}>{ROLE_LABELS[r]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_GROUPS.map((group) => (
              <GroupRows
                key={group}
                group={group}
                perms={grouped[group]}
                sets={sets}
                onToggle={toggle}
              />
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-stone-400">
        Super Admin is shown for reference only — it always has everything.
        Scoped access: give a role <strong>Work leads</strong> without{" "}
        <strong>See all leads</strong> and they&apos;ll only see leads assigned
        to them.
      </p>
    </div>
  );
}

function GroupRows({
  group,
  perms,
  sets,
  onToggle,
}: {
  group: PermissionGroup;
  perms: Permission[];
  sets: Record<EditableRole, Set<Permission>>;
  onToggle: (role: EditableRole, perm: Permission) => void;
}) {
  if (perms.length === 0) return null;
  return (
    <>
      <tr className="bg-stone-100/70 dark:bg-stone-800/50">
        <td colSpan={2 + EDITABLE_ROLES.length} className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-500">
          {group}
        </td>
      </tr>
      {perms.map((perm) => (
        <tr key={perm} className="border-b border-stone-100 last:border-0 hover:bg-orange-50/40 dark:border-stone-800/60 dark:hover:bg-stone-800/40">
          <td className="px-3 py-2 text-stone-700 dark:text-stone-200">{PERMISSION_META[perm].label}</td>
          {/* Super Admin — always on, not editable */}
          <td className="px-3 py-2 text-center">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-stone-200 text-stone-400 dark:bg-stone-700" title="Always granted">
              <Check size={13} />
            </span>
          </td>
          {EDITABLE_ROLES.map((role) => {
            const on = sets[role].has(perm);
            return (
              <td key={role} className="px-3 py-2 text-center">
                <button
                  onClick={() => onToggle(role, perm)}
                  role="checkbox"
                  aria-checked={on}
                  aria-label={`${PERMISSION_META[perm].label} for ${ROLE_LABELS[role]}`}
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
                    on
                      ? "border-orange-500 bg-orange-500 text-white"
                      : "border-stone-300 text-transparent hover:border-orange-400 dark:border-stone-600"
                  }`}
                >
                  <Check size={13} />
                </button>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
