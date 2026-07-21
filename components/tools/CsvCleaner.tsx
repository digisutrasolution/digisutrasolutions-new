"use client";

import { useState } from "react";
import { Download, Upload } from "lucide-react";

/* CSV cleaner — parses in the browser (no upload), trims whitespace,
   drops empty rows, removes duplicates and normalises headers. Handles
   quoted fields and embedded commas/newlines. */

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (c !== "\r") cell += c;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

const toCsv = (rows: string[][]) =>
  rows
    .map((r) => r.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(","))
    .join("\n");

const snake = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "column";

export default function CsvCleaner() {
  const [raw, setRaw] = useState("");
  const [opts, setOpts] = useState({ trim: true, dropEmpty: true, dedupe: true, headers: true });
  const [report, setReport] = useState<string | null>(null);
  const [cleaned, setCleaned] = useState<string>("");

  function clean(input: string) {
    const rows = parseCsv(input);
    if (rows.length === 0) {
      setReport("Nothing to clean — paste some CSV first.");
      setCleaned("");
      return;
    }
    const before = rows.length;
    let head = rows[0];
    let body = rows.slice(1);

    if (opts.trim) {
      head = head.map((c) => c.trim());
      body = body.map((r) => r.map((c) => c.trim().replace(/\s+/g, " ")));
    }
    if (opts.headers) head = head.map(snake);
    if (opts.dropEmpty) body = body.filter((r) => r.some((c) => c !== ""));

    let removedDupes = 0;
    if (opts.dedupe) {
      const seen = new Set<string>();
      body = body.filter((r) => {
        const key = r.join("");
        if (seen.has(key)) {
          removedDupes++;
          return false;
        }
        seen.add(key);
        return true;
      });
    }

    setCleaned(toCsv([head, ...body]));
    setReport(
      `${before - 1} rows in → ${body.length} rows out · ${before - 1 - body.length - removedDupes} empty removed · ${removedDupes} duplicates removed · ${head.length} columns`,
    );
  }

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setRaw(text);
      clean(text);
    };
    reader.readAsText(file);
  };

  const download = () => {
    const blob = new Blob([cleaned], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cleaned.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="rounded-[2rem] bg-[#FFF6EF] p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-4">
        {(
          [
            ["trim", "Trim spaces"],
            ["dropEmpty", "Drop empty rows"],
            ["dedupe", "Remove duplicates"],
            ["headers", "Tidy headers"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={opts[key]}
              onChange={(e) => setOpts((o) => ({ ...o, [key]: e.target.checked }))}
              className="h-4 w-4 accent-[#F26419]"
            />
            {label}
          </label>
        ))}
      </div>

      <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 bg-white py-4 text-sm font-semibold text-stone-600 transition-colors hover:border-[#F26419] hover:text-orange-700">
        <Upload size={15} aria-hidden /> Choose a CSV file
        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
      </label>

      <p className="mt-4 text-sm font-semibold text-stone-700">…or paste it here</p>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder={"name, email\n  Priya , priya@example.com\n\nPriya, priya@example.com"}
        className="mt-2 min-h-32 w-full rounded-xl border border-stone-300 bg-white p-3 font-mono text-xs outline-none focus:border-orange-500"
      />

      <button
        onClick={() => clean(raw)}
        disabled={!raw.trim()}
        className="mt-3 cursor-pointer rounded-full bg-[#F26419] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
      >
        Clean it
      </button>

      {report && <p className="mt-4 text-sm font-medium text-stone-700">{report}</p>}

      {cleaned && (
        <div className="mt-3">
          <textarea
            readOnly
            value={cleaned}
            className="min-h-40 w-full rounded-xl border border-stone-300 bg-white p-3 font-mono text-xs"
          />
          <button
            onClick={download}
            className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-bold text-stone-800 transition-colors hover:border-[#F26419] hover:text-orange-700"
          >
            <Download size={15} aria-hidden /> Download cleaned.csv
          </button>
        </div>
      )}

      <p className="mt-5 text-xs leading-relaxed text-stone-500">
        Your file never leaves this browser — parsing happens locally, so customer data stays with
        you.
      </p>
    </div>
  );
}
