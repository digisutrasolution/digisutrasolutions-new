import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { BarRow, DayPoint, Delta } from "@/lib/dashboard";

/**
 * Chart pieces for the dashboard.
 *
 * Every chart here is a single series, so all of them use one hue with
 * more-is-darker never needed — sequential is the safe default and the
 * series identity is carried by the row label, not by colour. No chart
 * pairs two measures on one axis; leads and pageviews get their own
 * panels precisely because their scales differ.
 */

const ACCENT = "#F26419";

export function StatTile({
  label,
  value,
  delta,
  hint,
  series,
}: {
  label: string;
  value: string;
  delta?: Delta;
  hint?: string;
  series?: DayPoint[];
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
      <p className="text-xs font-medium text-stone-500 dark:text-stone-400">{label}</p>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="font-display text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
          {value}
        </span>
        {delta && <DeltaBadge delta={delta} />}
      </div>
      {hint && <p className="mt-1 text-[11px] text-stone-400">{hint}</p>}
      {series && series.length > 1 && <Sparkline points={series} />}
    </div>
  );
}

/* Direction is stated with an icon and a sign, never colour alone. */
function DeltaBadge({ delta }: { delta: Delta }) {
  if (delta.pct === null) {
    return (
      <span className="text-xs font-medium text-stone-400" title="No comparable previous period">
        no baseline
      </span>
    );
  }
  const Icon =
    delta.direction === "up" ? ArrowUpRight : delta.direction === "down" ? ArrowDownRight : Minus;
  const tone =
    delta.direction === "up"
      ? "text-emerald-700 dark:text-emerald-400"
      : delta.direction === "down"
        ? "text-red-700 dark:text-red-400"
        : "text-stone-500";
  return (
    <span className={`flex items-center gap-0.5 text-xs font-semibold ${tone}`}>
      <Icon size={13} aria-hidden />
      {delta.pct > 0 ? "+" : ""}
      {delta.pct}%
    </span>
  );
}

function Sparkline({ points }: { points: DayPoint[] }) {
  const max = Math.max(...points.map((p) => p.value), 1);
  return (
    <div className="mt-3 flex h-8 items-end gap-px" aria-hidden>
      {points.map((p) => (
        <span
          key={p.date}
          title={`${p.date}: ${p.value}`}
          style={{ height: `${Math.max((p.value / max) * 100, 3)}%` }}
          className="flex-1 rounded-t-[2px] bg-orange-200 dark:bg-orange-900/60"
        />
      ))}
    </div>
  );
}

/** Daily column chart: one series, zero-filled, labelled at both ends. */
export function DailyChart({
  title,
  points,
  unit,
}: {
  title: string;
  points: DayPoint[];
  unit: string;
}) {
  const max = Math.max(...points.map((p) => p.value), 1);
  const total = points.reduce((s, p) => s + p.value, 0);
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-sm font-bold text-stone-900 dark:text-stone-100">
          {title}
        </h2>
        <span className="text-xs text-stone-400">
          {total} {unit} · peak {max}
        </span>
      </div>

      {total === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-stone-200 py-8 text-center text-xs text-stone-400 dark:border-stone-800">
          Nothing recorded in this period.
        </p>
      ) : (
        <>
          <div className="mt-4 flex h-28 items-end gap-[2px]">
            {points.map((p) => (
              <div
                key={p.date}
                title={`${fmt(p.date)} — ${p.value} ${unit}`}
                style={{ height: `${Math.max((p.value / max) * 100, 2)}%` }}
                className="flex-1 rounded-t bg-[#F26419] transition-opacity hover:opacity-70"
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-stone-400">
            <span>{fmt(points[0].date)}</span>
            <span>{fmt(points[points.length - 1].date)}</span>
          </div>
        </>
      )}
    </div>
  );
}

/** Horizontal magnitude bars: label, bar, value — identity is the label. */
export function BarList({
  title,
  rows,
  empty,
  format,
}: {
  title: string;
  rows: BarRow[];
  empty: string;
  format?: (label: string) => string;
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
      <h2 className="font-display text-sm font-bold text-stone-900 dark:text-stone-100">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-stone-200 py-6 text-center text-xs text-stone-400 dark:border-stone-800">
          {empty}
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {rows.map((r) => (
            <li key={r.label}>
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="truncate text-stone-700 dark:text-stone-200" title={r.label}>
                  {format ? format(r.label) : r.label}
                </span>
                <span className="shrink-0 font-semibold text-stone-900 tabular-nums dark:text-stone-100">
                  {r.value}
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-stone-100 dark:bg-stone-800">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max((r.value / max) * 100, 2)}%`,
                    background: ACCENT,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
