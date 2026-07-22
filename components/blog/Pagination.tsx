import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Numbered pagination with first/last anchors and an ellipsis window, so a
 * reader can jump anywhere instead of clicking "older" repeatedly. Server
 * component — hrefs are built from `basePath`, and <Link> adds the
 * deploy's basePath prefix.
 */
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

const boxCls =
  "flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-semibold transition-colors";

export default function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  basePath,
  label = "articles",
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  basePath: string;
  label?: string;
}) {
  if (totalPages <= 1) return null;
  const href = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`);
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalItems);

  return (
    <nav
      aria-label="Pagination"
      className="mt-6 flex flex-col items-center gap-3 border-t border-stone-100 pt-5 sm:flex-row sm:justify-between"
    >
      <p className="order-2 text-xs text-stone-500 sm:order-1">
        Showing {first}–{last} of {totalItems} {label}
      </p>

      <div className="order-1 flex items-center gap-1 sm:order-2">
        {page > 1 ? (
          <Link
            href={href(page - 1)}
            rel="prev"
            aria-label="Previous page"
            className={`${boxCls} border border-stone-200 text-stone-600 hover:border-[#F26419] hover:text-orange-700`}
          >
            <ChevronLeft size={15} aria-hidden />
          </Link>
        ) : (
          <span
            aria-hidden
            className={`${boxCls} border border-stone-100 text-stone-300`}
          >
            <ChevronLeft size={15} />
          </span>
        )}

        {pageWindow(page, totalPages).map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} className={`${boxCls} text-stone-400`}>
              …
            </span>
          ) : p === page ? (
            <span
              key={p}
              aria-current="page"
              className={`${boxCls} bg-stone-900 text-white`}
            >
              {p}
            </span>
          ) : (
            <Link
              key={p}
              href={href(p)}
              aria-label={`Page ${p}`}
              className={`${boxCls} border border-stone-200 text-stone-600 hover:border-[#F26419] hover:text-orange-700`}
            >
              {p}
            </Link>
          ),
        )}

        {page < totalPages ? (
          <Link
            href={href(page + 1)}
            rel="next"
            aria-label="Next page"
            className={`${boxCls} border border-stone-200 text-stone-600 hover:border-[#F26419] hover:text-orange-700`}
          >
            <ChevronRight size={15} aria-hidden />
          </Link>
        ) : (
          <span
            aria-hidden
            className={`${boxCls} border border-stone-100 text-stone-300`}
          >
            <ChevronRight size={15} />
          </span>
        )}
      </div>
    </nav>
  );
}
