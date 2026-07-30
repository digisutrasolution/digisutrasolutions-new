"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutGrid, List, Route } from "lucide-react";
import LeadsKanban from "@/components/admin/LeadsKanban";
import LeadsManager from "@/components/admin/LeadsManager";

type Assignee = { id: string; name: string };

export default function LeadsWorkspace({ assignees }: { assignees: Assignee[] }) {
  const [view, setView] = useState<"table" | "board">("table");

  const btn = (active: boolean) =>
    `flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
      active
        ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
        : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
    }`;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-full border border-stone-200 p-0.5 dark:border-stone-800">
          <button onClick={() => setView("table")} className={btn(view === "table")}>
            <List size={13} /> Table
          </button>
          <button onClick={() => setView("board")} className={btn(view === "board")}>
            <LayoutGrid size={13} /> Board
          </button>
        </div>
        <Link
          href="/admin/leads/assignment"
          className="flex items-center gap-1.5 rounded-full border border-stone-200 px-3.5 py-1.5 text-xs font-semibold text-stone-500 transition-colors hover:border-orange-400 hover:text-orange-600 dark:border-stone-800 dark:text-stone-400"
        >
          <Route size={13} /> Assignment rules
        </Link>
      </div>
      {view === "table" ? <LeadsManager assignees={assignees} /> : <LeadsKanban assignees={assignees} />}
    </div>
  );
}
