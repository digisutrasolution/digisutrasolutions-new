"use client";

import { createElement } from "react";
import { withBase } from "@/lib/base-path";
import { navIcon } from "@/components/nav-icons";

/* Scaled-down stand-in for the header mega panel.
   Panel fields (image, tagline, groups, badges, the featured card) were all
   edited blind in a form, so the only way to see the result was to publish and
   look at the live site. This mirrors the real panel's structure — image rail
   on the left, grouped link columns, featured slot — closely enough to judge
   grouping, ordering and copy length before publishing. */

export type PreviewChild = {
  label: string;
  href: string;
  icon?: string | null;
  group?: string | null;
  badge?: string | null;
  description?: string | null;
};

export default function MegaPanelPreview({
  label,
  panelImage,
  tagline,
  featured,
  items,
}: {
  label: string;
  panelImage?: string | null;
  tagline?: string | null;
  featured?: boolean;
  /** Sub-items. Deliberately not named `children` — it is data, not slot content. */
  items: PreviewChild[];
}) {
  // Same grouping rule as the real panel: grouped columns when any child
  // carries a group, otherwise one flat run.
  const groups = items.some((c) => c.group)
    ? [...new Set(items.map((c) => c.group ?? ""))]
    : null;

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-950">
      <div className="border-b-2 border-[#F26419] bg-stone-50 px-3 py-1.5 dark:bg-stone-900">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
          Mega panel preview · {label || "Untitled"}
        </p>
      </div>

      <div className="flex">
        {panelImage && (
          <div className="relative w-[110px] shrink-0 overflow-hidden bg-stone-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={withBase(panelImage)}
              alt=""
              className="h-full w-full object-cover"
              aria-hidden
            />
            {/* The duotone recipe the real panel uses, so the tagline's
                legibility over the image is judged honestly. */}
            <span className="absolute inset-0 bg-[#F26419]/25 mix-blend-color" aria-hidden />
            <span
              className="absolute inset-0 bg-[linear-gradient(160deg,rgba(124,45,18,0.28),rgba(18,12,8,0.28))] mix-blend-multiply"
              aria-hidden
            />
            {tagline && (
              <p className="absolute bottom-0 left-0 right-0 whitespace-pre-line p-2 text-[9px] font-semibold leading-tight text-white">
                {tagline}
              </p>
            )}
          </div>
        )}

        <div className="min-w-0 flex-1 p-2">
          {items.length === 0 ? (
            <p className="px-1 py-3 text-[11px] text-stone-400">
              No sub-items yet — this opens as a plain link, not a panel.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
              {(groups ?? [""]).map((g) => (
                <div key={g || "_"} className="min-w-0">
                  {g && (
                    <p className="px-1 pb-0.5 pt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-orange-800 dark:text-orange-400">
                      {g}
                    </p>
                  )}
                  {items
                    .filter((c) => (groups ? (c.group ?? "") === g : true))
                    .map((c) => (
                      <div
                        key={`${c.href}-${c.label}`}
                        className="flex items-start gap-1.5 rounded p-1"
                      >
                        <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded bg-stone-100 text-stone-500 dark:bg-stone-800">
                          {createElement(navIcon(c.icon || undefined), { size: 10 })}
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1">
                            <span className="truncate text-[11px] font-medium text-stone-800 dark:text-stone-200">
                              {c.label}
                            </span>
                            {c.badge && (
                              <span className="shrink-0 rounded-full bg-orange-100 px-1 text-[8px] font-bold uppercase text-orange-800 dark:bg-orange-900/50 dark:text-orange-300">
                                {c.badge}
                              </span>
                            )}
                          </span>
                          {c.description && (
                            <span className="block truncate text-[9px] text-stone-500">
                              {c.description}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {featured && (
          <div className="w-[86px] shrink-0 border-l border-stone-200 p-2 dark:border-stone-700">
            <div className="flex h-full flex-col justify-end rounded-lg bg-stone-900 p-1.5">
              <p className="text-[8px] font-bold uppercase tracking-wider text-orange-300">
                Journal
              </p>
              <p className="mt-0.5 text-[9px] leading-tight text-white">
                Latest post card
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
