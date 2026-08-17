"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, FileText, Image as ImageIcon, Paperclip, Trash2, Upload } from "lucide-react";
import { withBase } from "@/lib/base-path";

type Attachment = {
  id: string; originalName: string; mimeType: string; size: number; url: string;
  uploadedByName: string | null; createdAt: string;
};

const IMG = new Set(["png", "jpg", "jpeg", "gif", "webp"]);
const extOf = (n: string) => (n.split(".").pop() ?? "").toLowerCase();
function fmtSize(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}
const hrefFor = (url: string) => (url.startsWith("http") ? url : withBase(url));

export default function Attachments({
  leadId,
  quotationId,
  canEdit = true,
}: {
  leadId?: string;
  quotationId?: string;
  canEdit?: boolean;
}) {
  const [items, setItems] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const qs = leadId ? `leadId=${leadId}` : `quotationId=${quotationId}`;

  const load = useCallback(async () => {
    const res = await fetch(withBase(`/api/attachments?${qs}`));
    const json = await res.json().catch(() => ({}));
    if (json.ok) setItems(json.attachments);
  }, [qs]);
  useEffect(() => { const t = setTimeout(() => void load(), 0); return () => clearTimeout(t); }, [load]);

  async function upload(files: FileList | File[]) {
    setErr("");
    for (const file of Array.from(files)) {
      setBusy(true);
      const fd = new FormData();
      fd.append("file", file);
      if (leadId) fd.append("leadId", leadId);
      if (quotationId) fd.append("quotationId", quotationId);
      try {
        const res = await fetch(withBase("/api/attachments"), { method: "POST", body: fd });
        const json = await res.json().catch(() => ({}));
        if (!json.ok) setErr(json.error ?? "Upload failed.");
      } finally {
        setBusy(false);
      }
    }
    await load();
  }

  async function remove(a: Attachment) {
    if (!window.confirm(`Delete "${a.originalName}"?`)) return;
    await fetch(withBase(`/api/attachments/${a.id}`), { method: "DELETE" });
    await load();
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
      <h2 className="flex items-center gap-1.5 font-display text-sm font-bold">
        <Paperclip size={15} className="text-orange-500" /> Files{items.length > 0 && <span className="text-stone-400">· {items.length}</span>}
      </h2>

      {canEdit && (
        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files.length) void upload(e.dataTransfer.files); }}
          className={`mt-3 flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed p-4 text-center transition-colors ${drag ? "border-orange-400 bg-orange-50/60 dark:bg-stone-800/60" : "border-stone-200 hover:border-orange-300 dark:border-stone-700"}`}
        >
          <Upload size={18} className="text-stone-400" />
          <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">{busy ? "Uploading…" : "Drop files or click to upload"}</span>
          <span className="text-[10px] text-stone-400">PDF, docs, images, spreadsheets · up to 15 MB each</span>
          {/* `multiple`: upload() already loops, and drag-and-drop of several
              files always worked — only the click path was one-at-a-time. */}
          <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) void upload(e.target.files); e.target.value = ""; }} />
        </label>
      )}

      {err && <p className="mt-2 text-xs text-red-500">{err}</p>}

      <ul className="mt-3 space-y-2">
        {items.length === 0 && <li className="text-xs text-stone-400">No files yet.</li>}
        {items.map((a) => {
          const isImg = IMG.has(extOf(a.originalName));
          return (
            <li key={a.id} className="flex items-center gap-3 rounded-xl border border-stone-200 p-2.5 dark:border-stone-800">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500 dark:bg-stone-800">
                {isImg ? <ImageIcon size={16} /> : <FileText size={16} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-800 dark:text-stone-100">{a.originalName}</p>
                <p className="text-[11px] text-stone-400">{fmtSize(a.size)} · {a.uploadedByName ?? "—"} · {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
              </div>
              <a href={hrefFor(a.url)} download={a.originalName} target="_blank" rel="noopener noreferrer" title="Download" className="rounded-lg border border-stone-200 p-1.5 text-stone-500 hover:border-orange-400 hover:text-orange-600 dark:border-stone-700">
                <Download size={14} />
              </a>
              {canEdit && (
                <button onClick={() => void remove(a)} title="Delete" className="rounded-lg border border-stone-200 p-1.5 text-stone-400 hover:border-red-400 hover:text-red-600 dark:border-stone-700">
                  <Trash2 size={14} />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
