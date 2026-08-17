"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { withBase } from "@/lib/base-path";

/** Intrinsic size of an uploaded image, when the endpoint reports one. */
export type UploadedDims = { width: number; height: number };

/** Small reusable upload control: pushes a file to an endpoint and hands back
    the stored URL. Reused for blog covers, inline images and video files. */
export default function UploadButton({
  onUploaded,
  accept = "image/*",
  endpoint = "/api/media",
  label = "Upload",
  className = "",
}: {
  /* `dims` is optional on purpose. /api/media has always measured images and
     stored width/height on the MediaAsset — this control simply threw them
     away, which is why the blog hero had to guess at a cover's shape. Callers
     that do not care (avatars, gateway logos, video files) ignore the second
     argument and are unaffected. */
  onUploaded: (url: string, dims?: UploadedDims) => void;
  accept?: string;
  endpoint?: string;
  label?: string;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(withBase(endpoint), { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      const url = json.asset?.url ?? json.url;
      if (!res.ok || !url) {
        setErr(json.error ?? "Upload failed.");
        return;
      }
      const w = json.asset?.width;
      const h = json.asset?.height;
      onUploaded(url, typeof w === "number" && typeof h === "number" ? { width: w, height: h } : undefined);
    } catch {
      setErr("Upload failed.");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-600 transition-colors hover:border-orange-400 hover:text-orange-700 disabled:opacity-60 dark:border-stone-700 dark:text-stone-300 ${className}`}
      >
        <Upload size={13} /> {busy ? "Uploading…" : label}
      </button>
      <input ref={ref} type="file" accept={accept} onChange={onChange} className="hidden" />
      {err && <span className="ml-2 text-xs text-red-600">{err}</span>}
    </>
  );
}
