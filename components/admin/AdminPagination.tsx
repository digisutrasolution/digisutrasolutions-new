"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

/** Page-number window with ellipses, e.g. [1,'…',4,5,6,'…',20]. */
function windowed(page: number, pages: number): (number | "…")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < pages - 1) out.push("…");
  out.push(pages);
  return out;
}

export default function AdminPagination({
  page,
  pages,
  total,
  pageSize,
  onPage,
  onPageSize,
  pageSizes = [25, 50, 100],
  label = "results",
}: {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
  onPageSize?: (n: number) => void;
  pageSizes?: number[];
  label?: string;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const btn =
    "flex h-8 min-w-8 items-center justify-center rounded-lg border border-stone-200 px-2 text-xs font-semibold text-stone-600 transition-colors hover:border-orange-400 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-700 dark:text-stone-300";

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
        <span>
          Showing <span className="font-semibold tabular-nums text-stone-700 dark:text-stone-200">{from.toLocaleString("en-IN")}–{to.toLocaleString("en-IN")}</span> of{" "}
          <span className="font-semibold tabular-nums text-stone-700 dark:text-stone-200">{total.toLocaleString("en-IN")}</span> {label}
        </span>
        {onPageSize && (
          <label className="flex items-center gap-1.5">
            <span className="hidden sm:inline">Per page</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSize(Number(e.target.value))}
              className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs outline-none focus:border-orange-500 dark:border-stone-700 dark:bg-stone-900"
              aria-label="Rows per page"
            >
              {pageSizes.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center gap-1">
          <button onClick={() => onPage(1)} disabled={page <= 1} className={btn} aria-label="First page"><ChevronsLeft size={14} /></button>
          <button onClick={() => onPage(page - 1)} disabled={page <= 1} className={btn} aria-label="Previous page"><ChevronLeft size={14} /></button>
          {windowed(page, pages).map((n, i) =>
            n === "…" ? (
              <span key={`e${i}`} className="px-1 text-xs text-stone-400">…</span>
            ) : (
              <button
                key={n}
                onClick={() => onPage(n)}
                aria-current={n === page ? "page" : undefined}
                className={`${btn} ${n === page ? "border-orange-500 bg-orange-500 text-white hover:text-white dark:border-orange-500" : ""}`}
              >
                {n}
              </button>
            ),
          )}
          <button onClick={() => onPage(page + 1)} disabled={page >= pages} className={btn} aria-label="Next page"><ChevronRight size={14} /></button>
          <button onClick={() => onPage(pages)} disabled={page >= pages} className={btn} aria-label="Last page"><ChevronsRight size={14} /></button>
        </div>
      )}
    </div>
  );
}
