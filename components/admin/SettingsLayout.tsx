"use client";

/* Two-pane settings shell: the settings cards on the left (capped width) and a
   sticky context rail on the right that uses the otherwise-empty space for a
   live preview, a setup checklist and status. Stacks on small screens. */
export default function SettingsLayout({
  children,
  rail,
}: {
  children: React.ReactNode;
  rail?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="w-full space-y-4 lg:max-w-2xl lg:flex-1">{children}</div>
      {rail && (
        <aside className="w-full space-y-3 lg:w-80 lg:shrink-0 lg:sticky lg:top-24">{rail}</aside>
      )}
    </div>
  );
}

/** A titled card for the context rail. */
export function RailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 dark:border-stone-800 dark:bg-stone-950/40">
      <p className="mb-2.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-400">{title}</p>
      {children}
    </div>
  );
}

/** A single checklist row (✓ done / ○ next step). */
export function ChecklistItem({ done, label, hint }: { done: boolean; label: string; hint?: string }) {
  return (
    <div className="flex items-start gap-2.5 border-t border-stone-200 py-2 first:border-t-0 dark:border-stone-800">
      <span
        className={`mt-0.5 flex h-[17px] w-[17px] flex-none items-center justify-center rounded-full text-[10px] ${
          done ? "bg-emerald-500 text-white" : "border-[1.5px] border-stone-300 text-stone-400 dark:border-stone-600"
        }`}
      >
        {done ? "✓" : ""}
      </span>
      <span className="text-xs leading-snug">
        <span className="font-semibold text-stone-700 dark:text-stone-200">{label}</span>
        {hint && <span className="text-stone-500 dark:text-stone-400"> · {hint}</span>}
      </span>
    </div>
  );
}
