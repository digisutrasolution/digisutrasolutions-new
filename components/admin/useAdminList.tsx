"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";

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
  const pageSize = opts?.pageSize ?? 15;
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

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

const pageBtn =
  "flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-lg border border-stone-300 px-2 text-xs font-semibold text-stone-600 transition-colors hover:border-orange-400 hover:text-orange-700 disabled:cursor-default disabled:opacity-40 disabled:hover:border-stone-300 disabled:hover:text-stone-600 dark:border-stone-700 dark:text-stone-300";

function pageWindow(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "gap")[] = [1];
  const from = Math.max(2, current - 1);
  const to = Math.min(total - 1, current + 1);
  if (from > 2) out.push("gap");
  for (let p = from; p <= to; p += 1) out.push(p);
  if (to < total - 1) out.push("gap");
  out.push(total);
  return out;
}

export function AdminPager({
  page,
  totalPages,
  total,
  pageSize,
  onPage,
  label = "items",
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
  label?: string;
}) {
  if (totalPages <= 1) return null;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  return (
    <div className="mt-3 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
      <span className="text-xs text-stone-500 dark:text-stone-400">
        {first}–{last} of {total} {label}
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page" className={pageBtn}>
          <ChevronLeft size={14} />
        </button>
        {pageWindow(page, totalPages).map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} className="px-1 text-xs text-stone-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              aria-current={p === page ? "page" : undefined}
              className={
                p === page
                  ? "flex h-8 min-w-8 items-center justify-center rounded-lg bg-stone-900 px-2 text-xs font-semibold text-white dark:bg-stone-100 dark:text-stone-900"
                  : pageBtn
              }
            >
              {p}
            </button>
          ),
        )}
        <button onClick={() => onPage(page + 1)} disabled={page >= totalPages} aria-label="Next page" className={pageBtn}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
