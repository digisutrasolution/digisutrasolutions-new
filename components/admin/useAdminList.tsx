"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

/**
 * Client-side search + pagination for admin lists. The managers already
 * load their full row set, so filtering and paging happen in memory — no
 * extra round trips. Each caller supplies how to turn a row into its
 * searchable text; everything else (debounce-free live filter, page math,
 * reset-to-page-1 on a new query) is shared.
 */
export function useAdminList<T>(
  items: T[],
  toText: (item: T) => string,
  opts?: { pageSize?: number },
) {
  const [pageSize, setPageSizeState] = useState(opts?.pageSize ?? 25);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const setPageSize = (n: number) => { setPageSizeState(n); setPage(1); };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    // Space-separated terms all have to match — cheap "advanced" search.
    const terms = q.split(/\s+/);
    return items.filter((item) => {
      const text = toText(item).toLowerCase();
      return terms.every((t) => text.includes(t));
    });
  }, [items, query, toText]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice((current - 1) * pageSize, current * pageSize);

  const onQuery = (v: string) => {
    setQuery(v);
    setPage(1);
  };

  return {
    query,
    setQuery: onQuery,
    page: current,
    setPage,
    pageItems,
    filtered,
    total: filtered.length,
    grandTotal: items.length,
    totalPages,
    pageSize,
    setPageSize,
  };
}

const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white py-2 pl-9 pr-9 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

export function AdminSearch({
  value,
  onChange,
  placeholder,
  count,
  grandTotal,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  count: number;
  grandTotal: number;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="relative min-w-56 flex-1">
        <Search
          size={15}
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label="Search"
          className={inputCls}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            <X size={15} />
          </button>
        )}
      </div>
      <span className="text-xs text-stone-500 dark:text-stone-400">
        {value ? `${count} of ${grandTotal}` : `${grandTotal} total`}
      </span>
    </div>
  );
}

