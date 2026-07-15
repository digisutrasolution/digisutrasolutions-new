"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Trash2, Upload } from "lucide-react";

type Asset = {
  id: string;
  url: string;
  alt: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  uploadedByName: string | null;
  createdAt: string;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaManager({
  assets,
  canUpload,
}: {
  assets: Asset[];
  canUpload: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/media", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Upload failed.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function saveAlt(id: string, alt: string) {
    await fetch(`/api/media/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alt }),
    }).catch(() => {});
  }

  async function remove(asset: Asset) {
    if (!window.confirm(`Delete ${asset.originalName}? Pages using it will show a broken image.`)) return;
    setBusy(true);
    const res = await fetch(`/api/media/${asset.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  function copyUrl(asset: Asset) {
    void navigator.clipboard.writeText(asset.url).then(() => {
      setCopied(asset.id);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        {canUpload ? (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f);
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="flex cursor-pointer items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-500 disabled:opacity-60"
            >
              <Upload size={15} aria-hidden />
              {busy ? "Uploading…" : "Upload image"}
            </button>
          </>
        ) : (
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Read-only view for your role.
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      {assets.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-stone-300 py-16 text-center text-sm text-stone-500 dark:border-stone-700">
          No media yet — upload your first image.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.url}
                alt={asset.alt || asset.originalName}
                loading="lazy"
                className="h-32 w-full bg-stone-100 object-cover dark:bg-stone-800"
              />
              <div className="p-3">
                <p className="truncate text-xs font-medium" title={asset.originalName}>
                  {asset.originalName}
                </p>
                <p className="text-[11px] text-stone-400">
                  {formatSize(asset.size)}
                  {asset.width ? ` · ${asset.width}×${asset.height}` : ""}
                </p>
                <label htmlFor={`alt-${asset.id}`} className="sr-only">
                  ALT text for {asset.originalName}
                </label>
                <input
                  id={`alt-${asset.id}`}
                  defaultValue={asset.alt}
                  placeholder="ALT text…"
                  disabled={!canUpload}
                  onBlur={(e) => void saveAlt(asset.id, e.target.value.trim())}
                  className="mt-2 w-full rounded-lg border border-stone-200 bg-transparent px-2.5 py-1.5 text-xs outline-none focus:border-orange-500 dark:border-stone-700"
                />
                <div className="mt-2 flex justify-end gap-1">
                  <button
                    onClick={() => copyUrl(asset)}
                    aria-label={`Copy URL for ${asset.originalName}`}
                    title="Copy URL"
                    className="cursor-pointer rounded-lg p-1.5 text-stone-500 transition-colors hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-stone-800"
                  >
                    {copied === asset.id ? (
                      <span className="text-[10px] font-bold text-green-600">✓</span>
                    ) : (
                      <Copy size={13} aria-hidden />
                    )}
                  </button>
                  {canUpload && (
                    <button
                      onClick={() => void remove(asset)}
                      aria-label={`Delete ${asset.originalName}`}
                      title="Delete"
                      className="cursor-pointer rounded-lg p-1.5 text-stone-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-stone-800"
                    >
                      <Trash2 size={13} aria-hidden />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
