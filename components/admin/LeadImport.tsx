"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Upload } from "lucide-react";
import { withBase } from "@/lib/base-path";
import { IMPORT_FIELDS, guessField, parseCsv, type ImportField } from "@/lib/csv";

const inputCls =
  "rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs outline-none focus:border-orange-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

type Result = { created: number; duplicates: number; skipped: { row: number; reason: string }[] };

export default function LeadImport() {
  const router = useRouter();
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<(ImportField | "")[]>([]);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [err, setErr] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(""); setResult(null);
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.length < 2) { setErr("The file needs a header row and at least one data row."); return; }
    const hs = parsed[0];
    setFileName(file.name);
    setHeaders(hs);
    setRows(parsed.slice(1));
    setMapping(hs.map((h) => guessField(h)));
  }

  const mappedFields = new Set(mapping.filter(Boolean));
  const canImport = mappedFields.has("name") && mappedFields.has("whatsapp") && rows.length > 0;

  function buildRows() {
    const idx: Partial<Record<ImportField, number>> = {};
    mapping.forEach((f, i) => { if (f) idx[f] = i; });
    return rows.map((r) => {
      const get = (f: ImportField) => (idx[f] != null ? (r[idx[f]!] ?? "").trim() : "");
      return {
        name: get("name"),
        whatsapp: get("whatsapp"),
        email: get("email") || undefined,
        company: get("company") || undefined,
        city: get("city") || undefined,
        country: get("country") || undefined,
        budget: get("budget") || undefined,
        services: get("services") || undefined,
        message: get("message") || undefined,
      };
    }).filter((r) => r.name);
  }

  async function doImport() {
    setBusy(true); setErr(""); setResult(null);
    try {
      const res = await fetch(withBase("/api/leads/import"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: buildRows() }),
      });
      const json = await res.json();
      if (json.ok) setResult({ created: json.created, duplicates: json.duplicates, skipped: json.skipped });
      else setErr(json.error ?? "Import failed.");
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      {/* Upload */}
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-stone-300 bg-white p-8 text-center hover:border-orange-400 dark:border-stone-700 dark:bg-stone-900">
        <Upload size={22} className="text-stone-400" />
        <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">{fileName || "Choose a CSV file"}</span>
        <span className="text-xs text-stone-400">First row must be column headers</span>
        <input type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
      </label>

      {err && <p className="text-sm font-medium text-red-600">{err}</p>}

      {/* Mapping */}
      {headers.length > 0 && !result && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold">Map columns <span className="font-normal text-stone-400">({rows.length} rows)</span></h2>
            <button onClick={() => void doImport()} disabled={!canImport || busy} className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50">
              <Upload size={14} /> {busy ? "Importing…" : `Import ${rows.length}`}
            </button>
          </div>
          {!canImport && <p className="mt-1 text-xs text-amber-600">Map at least <strong>Name</strong> and <strong>WhatsApp / phone</strong> to import.</p>}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-stone-400">
                  <th className="py-1.5 pr-3">CSV column</th>
                  <th className="py-1.5 pr-3">Maps to</th>
                  <th className="py-1.5">Sample</th>
                </tr>
              </thead>
              <tbody>
                {headers.map((h, i) => (
                  <tr key={i} className="border-t border-stone-100 dark:border-stone-800">
                    <td className="py-1.5 pr-3 font-medium text-stone-700 dark:text-stone-200">{h || <span className="text-stone-400">Column {i + 1}</span>}</td>
                    <td className="py-1.5 pr-3">
                      <select value={mapping[i] ?? ""} onChange={(e) => setMapping((m) => m.map((v, j) => (j === i ? (e.target.value as ImportField | "") : v)))} className={inputCls}>
                        <option value="">— ignore —</option>
                        {IMPORT_FIELDS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                      </select>
                    </td>
                    <td className="py-1.5 text-stone-500">{(rows[0]?.[i] ?? "").slice(0, 40)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 size={20} /> <h2 className="font-display text-base font-bold">Import complete</h2>
          </div>
          <div className="mt-3 flex flex-wrap gap-6 text-sm">
            <div><span className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">{result.created}</span><p className="text-xs text-stone-500">created</p></div>
            <div><span className="text-2xl font-extrabold text-stone-500">{result.duplicates}</span><p className="text-xs text-stone-500">duplicates skipped</p></div>
            <div><span className="text-2xl font-extrabold text-stone-500">{result.skipped.length}</span><p className="text-xs text-stone-500">rows skipped</p></div>
          </div>
          {result.skipped.length > 0 && (
            <p className="mt-3 text-xs text-stone-400">Skipped rows: {result.skipped.slice(0, 10).map((s) => `#${s.row} (${s.reason})`).join(", ")}{result.skipped.length > 10 ? "…" : ""}</p>
          )}
          <div className="mt-4 flex gap-2">
            <button onClick={() => router.push("/admin/leads")} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500">View leads</button>
            <button onClick={() => { setResult(null); setHeaders([]); setRows([]); setFileName(""); }} className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-600 dark:border-stone-700 dark:text-stone-300">Import another</button>
          </div>
        </div>
      )}
    </div>
  );
}
