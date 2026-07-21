import { ChevronRight } from "lucide-react";

/* Collapsible settings block. Native <details> so it works without JS and
   keeps the page short — the summary chip shows the current state, so you
   can read every setting without opening anything. */
export default function AdminSection({
  title,
  hint,
  chip,
  defaultOpen = false,
  children,
}: {
  title: string;
  hint?: string;
  chip?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
        <ChevronRight
          size={15}
          aria-hidden
          className="shrink-0 text-stone-400 transition-transform duration-200 group-open:rotate-90"
        />
        <span className="font-display text-sm font-bold text-stone-900 dark:text-stone-100">
          {title}
        </span>
        {chip && (
          <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-500 dark:bg-stone-800 dark:text-stone-400">
            {chip}
          </span>
        )}
      </summary>
      <div className="border-t border-stone-200 px-4 py-4 dark:border-stone-800">
        {hint && (
          <p className="mb-4 text-sm leading-relaxed text-stone-500 dark:text-stone-400">{hint}</p>
        )}
        {children}
      </div>
    </details>
  );
}
