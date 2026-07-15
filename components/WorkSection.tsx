"use client";

import { useState } from "react";
import {
  ShoppingCart,
  HeartPulse,
  Factory,
  Smartphone,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Reveal from "@/components/Reveal";
import { WORK_ITEMS, type WorkCategory, type WorkItem } from "@/lib/data";

const ICONS = {
  cart: ShoppingCart,
  health: HeartPulse,
  factory: Factory,
  phone: Smartphone,
  chart: TrendingUp,
  wallet: Wallet,
} as const;

const FILTERS: Array<"All" | WorkCategory> = [
  "All",
  "Web",
  "Marketing",
  "AI",
];

function WorkCard({ item, index }: { item: WorkItem; index: number }) {
  const Icon = ICONS[item.icon];

  return (
    <Reveal delay={(index % 2) * 0.08}>
      <article className="group cursor-pointer">
        <div className="relative h-48 overflow-hidden rounded-2xl sm:h-56">
          <div
            className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${item.gradient} transition-transform duration-500 ease-out group-hover:scale-[1.07]`}
          >
            <Icon size={40} className="text-white/85" aria-hidden />
          </div>
          <span className="absolute left-3 top-3 rounded-full bg-orange-50/95 px-3 py-1 text-xs font-semibold text-orange-950">
            {item.categoryLabel}
          </span>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <h3 className="font-display text-base font-bold text-stone-900">
            {item.title}
          </h3>
          <span className="font-display text-xs text-stone-400">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-stone-500">{item.stack}</p>
      </article>
    </Reveal>
  );
}

export default function WorkSection({
  limit,
  showFilters = false,
}: {
  limit?: number;
  showFilters?: boolean;
}) {
  const [filter, setFilter] = useState<"All" | WorkCategory>("All");

  const items = WORK_ITEMS.filter(
    (item) => filter === "All" || item.category === filter,
  ).slice(0, limit ?? WORK_ITEMS.length);

  return (
    <div>
      {showFilters && (
        <div className="mb-8 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-stone-900 text-white"
                  : "border border-stone-200 bg-white text-stone-600 hover:border-orange-400 hover:text-orange-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2">
        {items.map((item, i) => (
          <WorkCard key={item.slug} item={item} index={i} />
        ))}
      </div>
      {items.length === 0 && (
        <p className="py-16 text-center text-sm text-stone-500">
          No projects in this category yet — check back soon.
        </p>
      )}
    </div>
  );
}
