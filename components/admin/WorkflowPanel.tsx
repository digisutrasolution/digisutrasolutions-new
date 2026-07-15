"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bug, CheckCircle2, MessageSquare, Send } from "lucide-react";
import type { BugSeverity, BugStatus, WorkflowStage } from "@prisma/client";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/cms/workflow";

type ActionDef = { action: string; label: string; requiresNote: boolean };
type Transition = {
  id: string;
  from: WorkflowStage;
  to: WorkflowStage;
  note: string | null;
  byName: string | null;
  createdAt: string;
};
type Comment = {
  id: string;
  body: string;
  stageAtTime: WorkflowStage;
  authorName: string | null;
  createdAt: string;
};
type BugRow = {
  id: string;
  title: string;
  description: string;
  severity: BugSeverity;
  status: BugStatus;
  screenshotUrl: string | null;
  reportedByName: string | null;
  createdAt: string;
};

type WorkflowData = {
  stage: WorkflowStage;
  actions: ActionDef[];
  canReportBug: boolean;
  canResolveBug: boolean;
  transitions: Transition[];
  comments: Comment[];
  bugs: BugRow[];
};

const SEVERITY_STYLE: Record<BugSeverity, string> = {
  LOW: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300",
  MEDIUM: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";
const cardCls =
  "rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900";

export default function WorkflowPanel({ pageId }: { pageId: string }) {
  const router = useRouter();
  const [data, setData] = useState<WorkflowData | null>(null);
  const [comment, setComment] = useState("");
  const [showBugForm, setShowBugForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/pages/${pageId}/workflow`);
    const json = await res.json().catch(() => ({}));
    if (json.ok) setData(json);
  }, [pageId]);

  useEffect(() => {
    // Defer the initial fetch past commit (react-hooks/set-state-in-effect).
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  async function post(
    path: string,
    body: unknown,
    method: "POST" | "PATCH" = "POST",
  ): Promise<boolean> {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Request failed.");
        return false;
      }
      await load();
      router.refresh();
      return true;
    } catch {
      setError("Network error.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function runAction(def: ActionDef) {
    let note: string | undefined;
    if (def.requiresNote) {
      const value = window.prompt(`${def.label} — add a note (required):`);
      if (!value?.trim()) return;
      note = value.trim();
    }
    await post(`/api/pages/${pageId}/workflow`, { action: def.action, note });
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    const ok = await post(`/api/pages/${pageId}/comments`, { body: comment });
    if (ok) setComment("");
  }

  async function reportBug(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const screenshot = String(fd.get("screenshotUrl") ?? "").trim();
    const ok = await post(`/api/pages/${pageId}/bugs`, {
      title: fd.get("title"),
      description: fd.get("description"),
      severity: fd.get("severity"),
      ...(screenshot ? { screenshotUrl: screenshot } : {}),
    });
    if (ok) {
      form.reset();
      setShowBugForm(false);
    }
  }

  if (!data) {
    return <p className="mt-5 text-sm text-stone-500">Loading workflow…</p>;
  }

  const currentIndex = STAGE_ORDER.indexOf(data.stage);

  return (
    <div className="mt-5 space-y-4">
      {error && (
        <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
          {error}
        </p>
      )}

      <div className={cardCls}>
        <div className="flex flex-wrap items-center gap-2">
          {STAGE_ORDER.map((stage, i) => (
            <div key={stage} className="flex items-center gap-2">
              <span
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                  i < currentIndex
                    ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                    : i === currentIndex
                      ? "bg-orange-600 text-white"
                      : "bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500"
                }`}
              >
                {i < currentIndex && "✓ "}
                {STAGE_LABELS[stage]}
              </span>
              {i < STAGE_ORDER.length - 1 && (
                <span className="text-stone-300 dark:text-stone-600">→</span>
              )}
            </div>
          ))}
        </div>
        {data.actions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-4 dark:border-stone-800">
            {data.actions.map((def) => (
              <button
                key={def.action}
                onClick={() => void runAction(def)}
                disabled={busy}
                className={`cursor-pointer rounded-full px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
                  def.action.includes("fail") || def.action.includes("reject")
                    ? "border border-red-300 text-red-700 hover:bg-red-50 dark:text-red-400"
                    : "bg-stone-900 text-white hover:bg-stone-700 dark:bg-orange-600 dark:hover:bg-orange-500"
                }`}
              >
                {def.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={cardCls}>
          <h3 className="font-display flex items-center gap-2 text-sm font-bold">
            <MessageSquare size={14} className="text-orange-600" aria-hidden />
            Comments
          </h3>
          <div className="mt-4 max-h-72 space-y-3 overflow-y-auto">
            {data.comments.length === 0 && (
              <p className="text-sm text-stone-500">No comments yet.</p>
            )}
            {data.comments.map((c) => (
              <div key={c.id} className="rounded-xl bg-stone-50 p-3 dark:bg-stone-800">
                <p className="text-sm leading-relaxed">{c.body}</p>
                <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
                  {c.authorName ?? "Unknown"} · {STAGE_LABELS[c.stageAtTime]} ·{" "}
                  {new Date(c.createdAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            ))}
          </div>
          <form onSubmit={addComment} className="mt-4 flex gap-2">
            <label htmlFor="wf-comment" className="sr-only">
              Add comment
            </label>
            <input
              id="wf-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a comment…"
              className={inputCls}
            />
            <button
              type="submit"
              disabled={busy || !comment.trim()}
              aria-label="Send comment"
              className="shrink-0 cursor-pointer rounded-xl bg-orange-600 px-4 text-white transition-colors hover:bg-orange-500 disabled:opacity-50"
            >
              <Send size={14} aria-hidden />
            </button>
          </form>
        </div>

        <div className={cardCls}>
          <div className="flex items-center justify-between">
            <h3 className="font-display flex items-center gap-2 text-sm font-bold">
              <Bug size={14} className="text-orange-600" aria-hidden />
              Bug reports
            </h3>
            {data.canReportBug && (
              <button
                onClick={() => setShowBugForm(!showBugForm)}
                className="cursor-pointer rounded-full border border-stone-300 px-3.5 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:border-orange-500 hover:text-orange-700 dark:border-stone-700 dark:text-stone-300"
              >
                {showBugForm ? "Close" : "Report bug"}
              </button>
            )}
          </div>

          {showBugForm && (
            <form onSubmit={reportBug} className="mt-4 space-y-2 rounded-xl bg-stone-50 p-3 dark:bg-stone-800">
              <input name="title" required minLength={3} placeholder="Bug title" className={inputCls} />
              <textarea name="description" required minLength={3} rows={2} placeholder="Steps to reproduce / what's wrong" className={inputCls} />
              <div className="flex gap-2">
                <select name="severity" defaultValue="MEDIUM" className={inputCls} aria-label="Severity">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
                <input name="screenshotUrl" type="url" placeholder="Screenshot URL (optional)" className={inputCls} />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="cursor-pointer rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-60"
              >
                File bug
              </button>
            </form>
          )}

          <div className="mt-4 max-h-72 space-y-3 overflow-y-auto">
            {data.bugs.length === 0 && (
              <p className="text-sm text-stone-500">No bugs reported.</p>
            )}
            {data.bugs.map((b) => (
              <div key={b.id} className="rounded-xl border border-stone-100 p-3 dark:border-stone-800">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold ${b.status !== "OPEN" ? "line-through opacity-60" : ""}`}>
                    {b.title}
                  </p>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${SEVERITY_STYLE[b.severity]}`}>
                    {b.severity.toLowerCase()}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                  {b.description}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-stone-400">
                  <span>
                    {b.reportedByName ?? "Unknown"} ·{" "}
                    {new Date(b.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                  {b.screenshotUrl && (
                    <a href={b.screenshotUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-orange-700 hover:underline dark:text-orange-400">
                      Screenshot ↗
                    </a>
                  )}
                  {b.status === "OPEN" && data.canResolveBug ? (
                    <span className="flex gap-2">
                      <button
                        onClick={() =>
                          void post(`/api/bugs/${b.id}`, { status: "RESOLVED" }, "PATCH")
                        }
                        className="cursor-pointer font-semibold text-green-700 hover:underline dark:text-green-400"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() =>
                          void post(`/api/bugs/${b.id}`, { status: "WONT_FIX" }, "PATCH")
                        }
                        className="cursor-pointer font-semibold text-stone-500 hover:underline"
                      >
                        Won&apos;t fix
                      </button>
                    </span>
                  ) : b.status !== "OPEN" ? (
                    <span className="flex items-center gap-1 font-semibold text-green-700 dark:text-green-400">
                      <CheckCircle2 size={11} aria-hidden />
                      {b.status === "RESOLVED" ? "Resolved" : "Won't fix"}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={cardCls}>
        <h3 className="font-display text-sm font-bold">Stage history</h3>
        <ul className="mt-3 space-y-2">
          {data.transitions.length === 0 && (
            <li className="text-sm text-stone-500">No transitions yet.</li>
          )}
          {data.transitions.map((t) => (
            <li key={t.id} className="flex items-baseline justify-between gap-3 text-sm">
              <span>
                <span className="font-medium">{t.byName ?? "System"}</span>{" "}
                <span className="text-stone-500 dark:text-stone-400">
                  {STAGE_LABELS[t.from]} → {STAGE_LABELS[t.to]}
                </span>
                {t.note && (
                  <span className="block text-xs italic text-stone-500 dark:text-stone-400">
                    “{t.note}”
                  </span>
                )}
              </span>
              <span className="shrink-0 text-[11px] text-stone-400">
                {new Date(t.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
