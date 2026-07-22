"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

/**
 * Token combobox for the services field: chosen services live inside the
 * field as removable chips, typing filters the list. Replaces a 15-chip
 * block that took four rows and dominated the form.
 *
 * Keyboard: ↓/↑ move, Enter toggles, Escape closes, Backspace on an empty
 * input removes the last chip. Focus stays in the text input and the
 * active option is announced with aria-activedescendant, which is what
 * makes a custom listbox usable without a mouse.
 */
export type ServiceOption = { name: string; group?: string };

export default function ServicePicker({
  options,
  value,
  onChange,
  invalid,
}: {
  options: ServiceOption[];
  value: string[];
  onChange: (next: string[]) => void;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  /* Cluster by group so each heading appears once, without forcing the
     admin to keep same-group services adjacent in the services list.
     Group order follows first appearance; ungrouped services fall last. */
  const ordered = useMemo(() => {
    const groups: string[] = [];
    for (const o of options) {
      if (o.group && !groups.includes(o.group)) groups.push(o.group);
    }
    const rank = (o: ServiceOption) =>
      o.group ? groups.indexOf(o.group) : groups.length;
    return options
      .map((o, i) => ({ o, i }))
      .sort((a, b) => rank(a.o) - rank(b.o) || a.i - b.i)
      .map(({ o }) => o);
  }, [options]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? ordered.filter((o) => o.name.toLowerCase().includes(q))
      : ordered;
  }, [ordered, query]);

  /* A heading is drawn whenever the group changes down the list, so the
     admin's own order decides the grouping — services with no group set
     simply render without one. */
  const rows = useMemo(
    () =>
      filtered.map((o, i) => ({
        ...o,
        index: i,
        heading: o.group && o.group !== filtered[i - 1]?.group ? o.group : null,
      })),
    [filtered],
  );

  // Close on outside click / Escape anywhere.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const toggle = (name: string) => {
    onChange(
      value.includes(name) ? value.filter((v) => v !== name) : [...value, name],
    );
  };

  const openList = () => {
    if (!open) {
      setOpen(true);
      setActive(0);
    }
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "Backspace" && query === "" && value.length > 0) {
      onChange(value.slice(0, -1));
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActive(0);
        return;
      }
      setActive((i) => {
        const n = filtered.length;
        if (n === 0) return 0;
        return e.key === "ArrowDown" ? (i + 1) % n : (i - 1 + n) % n;
      });
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const opt = filtered[active];
      if (opt) {
        toggle(opt.name);
        setQuery("");
      }
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
          I&rsquo;m interested in *
        </span>
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="cursor-pointer text-xs font-semibold text-stone-400 transition-colors hover:text-orange-700"
          >
            Clear {value.length}
          </button>
        )}
      </div>

      {/* Field */}
      <div
        onClick={openList}
        className={`flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border bg-white px-2.5 py-2 transition-colors ${
          invalid
            ? "border-red-400"
            : open
              ? "border-[#F26419]"
              : value.length > 0
                ? "border-emerald-500"
                : "border-stone-200"
        }`}
      >
        {value.map((name) => (
          <span
            key={name}
            className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 py-1 pl-3 pr-1.5 text-xs font-semibold text-white"
          >
            {name}
            <button
              type="button"
              aria-label={`Remove ${name}`}
              onClick={(e) => {
                e.stopPropagation();
                toggle(name);
              }}
              className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-white/25"
            >
              <X size={11} aria-hidden />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && filtered[active] ? `${listId}-${active}` : undefined}
          aria-label="Search services"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={value.length === 0 ? "Pick one or more services…" : "Add another…"}
          className="min-w-32 flex-1 bg-transparent px-1 py-1 text-sm text-stone-900 outline-none placeholder:text-stone-300"
        />
        <ChevronDown
          size={16}
          aria-hidden
          className={`shrink-0 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {/* List */}
      {open && (
        <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_16px_40px_rgba(28,25,23,0.12)]">
          <div className="flex items-center gap-2 border-b border-stone-100 px-3 py-2 text-xs text-stone-400">
            <Search size={13} aria-hidden />
            {filtered.length} of {options.length} services
          </div>
          <ul id={listId} role="listbox" aria-multiselectable className="max-h-64 overflow-y-auto py-1">
            {rows.map((o) => {
              const on = value.includes(o.name);
              return (
                <li key={o.name}>
                  {o.heading && (
                    <p
                      role="presentation"
                      className="px-3 pb-1 pt-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400"
                    >
                      {o.heading}
                    </p>
                  )}
                  <button
                    type="button"
                    id={`${listId}-${o.index}`}
                    role="option"
                    aria-selected={on}
                    onMouseEnter={() => setActive(o.index)}
                    onClick={() => {
                      toggle(o.name);
                      setQuery("");
                      inputRef.current?.focus();
                    }}
                    className={`flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                      o.index === active ? "bg-[#FFF7F0]" : ""
                    } ${on ? "font-semibold text-stone-900" : "text-stone-600"}`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                        on
                          ? "border-[#F26419] bg-[#F26419] text-white"
                          : "border-stone-300 bg-white"
                      }`}
                    >
                      {on && <Check size={11} strokeWidth={3} aria-hidden />}
                    </span>
                    {o.name}
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-stone-400">
                No service matches “{query}”. Describe it in the message instead.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
