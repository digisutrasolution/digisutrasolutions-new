"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, Download, ExternalLink } from "lucide-react";

/* Google review link generator — turns a Place ID into the direct
   "write a review" URL, plus a scannable QR for counters and invoices.
   Everything happens in the browser. */
export default function ReviewLinkGenerator() {
  const [placeId, setPlaceId] = useState("");
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const id = placeId.trim();
  const link = id ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(id)}` : "";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!link) {
      canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    QRCode.toCanvas(canvas, link, {
      width: 220,
      margin: 2,
      color: { dark: "#1C1917", light: "#FFFFFF" },
    }).catch(() => {});
  }, [link]);

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the field is selectable anyway */
    }
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas || !link) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "google-review-qr.png";
    a.click();
  };

  return (
    <div className="rounded-[2rem] bg-[#FFF6EF] p-6 sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:gap-10">
        <div>
          <label className="block">
            <span className="text-sm font-semibold text-stone-700">Your Google Place ID</span>
            <input
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              placeholder="ChIJ… (paste it here)"
              className="mt-2 h-12 w-full rounded-xl border border-stone-300 bg-white px-4 font-mono text-sm text-stone-900 outline-none transition-colors focus:border-orange-500"
            />
          </label>
          <a
            href="https://developers.google.com/maps/documentation/places/web-service/place-id"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#F26419] hover:underline"
          >
            Find your Place ID <ExternalLink size={11} aria-hidden />
          </a>

          {link && (
            <div className="mt-5">
              <p className="text-sm font-semibold text-stone-700">Your review link</p>
              <div className="mt-2 flex gap-2">
                <input
                  readOnly
                  value={link}
                  onFocus={(e) => e.currentTarget.select()}
                  className="h-11 w-full min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-3.5 text-xs text-stone-700 outline-none"
                />
                <button
                  onClick={copy}
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-[#F26419] px-4 text-sm font-bold text-white transition-colors hover:bg-orange-600"
                >
                  {copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-stone-500">
                Send it after a job is done — the link opens the review box directly, so customers
                don&rsquo;t have to hunt for your listing. Never offer incentives for reviews;
                Google removes them and can penalise the listing.
              </p>
            </div>
          )}
        </div>

        {link && (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-5">
            <canvas ref={canvasRef} className="h-[220px] w-[220px]" aria-label="Review link QR code" />
            <button
              onClick={download}
              className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-xs font-bold text-stone-800 transition-colors hover:border-[#F26419] hover:text-orange-700"
            >
              <Download size={14} aria-hidden /> Download QR
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
