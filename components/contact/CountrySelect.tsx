"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { CountryCode } from "libphonenumber-js/min";

export type CountryEntry = { code: CountryCode; name: string; dial: string };

/* flagcdn serves ~300-byte PNGs; emoji flags render as bare letters on
   Windows, so images are the only way the flag actually shows everywhere. */
const flagSrc = (code: string) => `https://flagcdn.com/w20/${code.toLowerCase()}.png`;

/**
 * Searchable country-code picker for the phone field: flag + dial code
 * trigger, popover with a search box filtering by name, ISO code or dial
 * code. Keyboard: ↓/↑ move, Enter selects, Escape closes.
 */
export default function CountrySelect({
  value,
  onChange,
  countries,
}: {
  value: CountryCode;
  onChange: (code: CountryCode) => void;
  countries: CountryEntry[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const selected = countries.find((c) => c.code === value) ?? countries[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase() === q ||
        c.dial.startsWith(q.replace(/^\+/, "")),
    );
  }, [countries, query]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const pick = (code: CountryCode) => {
    onChange(code);
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => {
        const n = filtered.length;
        if (n === 0) return 0;
        return e.key === "ArrowDown" ? (i + 1) % n : (i - 1 + n) % n;
      });
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const c = filtered[active];
      if (c) pick(c.code);
    }
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Country code: ${selected.name} +${selected.dial}`}
        onClick={() => {
          setOpen((o) => !o);
          setActive(0);
          setQuery("");
        }}
        className="flex h-full items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-2.5 py-2.5 text-sm text-stone-900 transition-colors hover:border-orange-300 focus:border-[#F26419] focus:outline-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- 300-byte external flag PNG; next/image would proxy it through the app for zero gain */}
        <img src={flagSrc(selected.code)} alt="" width={20} height={14} />
        +{selected.dial}
        <ChevronDown
          size={13}
          aria-hidden
          className={`text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-64 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_16px_40px_rgba(28,25,23,0.12)]">
          <div className="flex items-center gap-2 border-b border-stone-100 px-3 py-2">
            <Search size={13} aria-hidden className="shrink-0 text-stone-400" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Search country…"
              aria-label="Search country"
              className="w-full bg-transparent py-1 text-sm text-stone-900 outline-none placeholder:text-stone-300"
            />
          </div>
          <ul id={listId} role="listbox" className="max-h-60 overflow-y-auto py-1">
            {filtered.map((c, i) => (
              <li key={c.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={c.code === value}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(c.code)}
                  className={`flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                    i === active ? "bg-[#FFF7F0]" : ""
                  } ${c.code === value ? "font-semibold text-stone-900" : "text-stone-700"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- see trigger note */}
                  <img src={flagSrc(c.code)} alt="" width={20} height={14} loading="lazy" />
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  <span className="shrink-0 text-stone-400">+{c.dial}</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-5 text-center text-sm text-stone-400">
                No country matches “{query}”
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
