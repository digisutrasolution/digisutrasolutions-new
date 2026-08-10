"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import type { Role } from "@prisma/client";
import { ROLE_LABELS } from "@/lib/auth/rbac";

/* Searchable assignee picker.

   A plain <select> of names is unusable once the team has shared mailboxes —
   three rows reading "Sales Team" with nothing to tell them apart. This shows
   name + role + email on every row and filters across all three, so the
   operator picks a person rather than guessing between duplicates.

   Every token in the query must match somewhere in the row, so "sales priya"
   and "priya sales" both narrow to the same person. */

export type Assignee = {
  id: string;
  name: string;
  email: string;
  role: Role;
  customRole?: { name: string } | null;
};

/** The role shown on a row — a custom role wins, since that is the one the
    admin defined and the one that carries the real permission set. */
export function assigneeRoleLabel(a: Assignee): string {
  return a.customRole?.name ?? ROLE_LABELS[a.role] ?? a.role;
}

/** A label that is unique within `all`, adding only as much as it takes:
    bare name when nothing collides, name + role when the name repeats, name +
    email when the role repeats too. For compact surfaces (chips, summaries)
    where the picker's full two-line row does not fit. */
export function disambiguate(a: Assignee, all: Assignee[]): string {
  const sameName = all.filter((x) => x.name === a.name);
  if (sameName.length < 2) return a.name;
  const role = assigneeRoleLabel(a);
  const sameRole = sameName.filter((x) => assigneeRoleLabel(x) === role);
  return sameRole.length < 2 ? `${a.name} · ${role}` : `${a.name} · ${a.email}`;
}

/** Everything about a person, for a title attribute. */
export function assigneeTitle(a: Assignee): string {
  return `${a.name} — ${assigneeRoleLabel(a)} · ${a.email}`;
}

function matches(a: Assignee, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  const hay = `${a.name} ${a.email} ${assigneeRoleLabel(a)}`.toLowerCase();
  return tokens.every((t) => hay.includes(t));
}

type LeadingOption = { value: string; label: string };

export default function AssigneePicker({
  assignees,
  value,
  onChange,
  leading = [],
  placeholder = "Select…",
  label,
  disabled = false,
  className = "",
}: {
  assignees: Assignee[];
  /** Selected id, or one of the `leading` values. */
  value: string;
  onChange: (value: string) => void;
  /** Non-person rows pinned above the list, e.g. Anyone / Unassigned. */
  leading?: LeadingOption[];
  placeholder?: string;
  /** Accessible name for the control. */
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const tokens = useMemo(
    () => q.trim().toLowerCase().split(/\s+/).filter(Boolean),
    [q],
  );

  // Leading rows are filtered too, so typing "una" finds Unassigned.
  const rows = useMemo(() => {
    const lead = leading
      .filter((o) => tokens.length === 0 || tokens.every((t) => o.label.toLowerCase().includes(t)))
      .map((o) => ({ kind: "lead" as const, value: o.value, label: o.label }));
    const people = assignees
      .filter((a) => matches(a, tokens))
      .map((a) => ({ kind: "person" as const, value: a.id, person: a }));
    return [...lead, ...people];
  }, [assignees, leading, tokens]);

  const selected = assignees.find((a) => a.id === value);
  const selectedLeading = leading.find((o) => o.value === value);

  // Opening highlights the current selection. Done here rather than in an
  // effect: an effect would re-run on every keystroke and fight the arrows.
  function openPanel() {
    setActive(Math.max(0, rows.findIndex((r) => r.value === value)));
    setOpen(true);
  }

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQ("");
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Keep the highlighted row inside the scroll viewport during arrow-key nav.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function commit(v: string) {
    onChange(v);
    setOpen(false);
    setQ("");
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        openPanel();
        return;
      }
      if (rows.length === 0) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (i + step + rows.length) % rows.length);
    } else if (e.key === "Enter") {
      if (!open) return;
      e.preventDefault();
      const row = rows[active];
      if (row) commit(row.value);
    } else if (e.key === "Escape") {
      if (!open) return;
      e.preventDefault();
      setOpen(false);
      setQ("");
    } else if (e.key === "Tab") {
      setOpen(false);
      setQ("");
    }
  }

  const triggerText = selected
    ? selected.name
    : (selectedLeading?.label ?? placeholder);
  const isPlaceholder = !selected && !selectedLeading;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openPanel())}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-left text-xs outline-none transition-colors hover:border-orange-400 focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
      >
        <span className={`truncate ${isPlaceholder ? "text-stone-400" : ""}`}>{triggerText}</span>
        {selected && (
          <span className="shrink-0 rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-500 dark:bg-stone-800 dark:text-stone-400">
            {assigneeRoleLabel(selected)}
          </span>
        )}
        <ChevronDown size={13} className="ml-auto shrink-0 text-stone-400" aria-hidden />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_18px_50px_rgba(28,25,23,0.18)] dark:border-stone-700 dark:bg-stone-900">
          <div className="flex items-center gap-2 border-b border-stone-100 px-3 py-2 dark:border-stone-800">
            <Search size={13} className="shrink-0 text-stone-400" aria-hidden />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-autocomplete="list"
              aria-label={`Search ${label.toLowerCase()}`}
              placeholder="Search name, role or email…"
              className="w-full bg-transparent text-xs outline-none placeholder:text-stone-400"
            />
            {q && (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
                className="shrink-0 cursor-pointer text-stone-400 hover:text-stone-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div ref={listRef} id={listId} role="listbox" aria-label={label} className="max-h-64 overflow-y-auto py-1">
            {rows.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-stone-500">
                No one matches “{q}”.
              </p>
            )}
            {rows.map((row, i) => {
              const isSel = row.value === value;
              const isActive = i === active;
              return (
                <button
                  key={row.value}
                  type="button"
                  role="option"
                  aria-selected={isSel}
                  data-active={isActive}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => commit(row.value)}
                  className={`flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left transition-colors ${
                    isActive ? "bg-orange-50 dark:bg-stone-800" : ""
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    {row.kind === "lead" ? (
                      <span className="text-xs font-medium text-stone-600 dark:text-stone-300">{row.label}</span>
                    ) : (
                      <>
                        <span className="block truncate text-xs font-semibold text-stone-800 dark:text-stone-100">
                          {row.person.name}
                        </span>
                        <span className="block truncate text-[11px] text-stone-500 dark:text-stone-400">
                          {assigneeRoleLabel(row.person)} · {row.person.email}
                        </span>
                      </>
                    )}
                  </span>
                  {isSel && <Check size={13} className="shrink-0 text-orange-600" aria-hidden />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
