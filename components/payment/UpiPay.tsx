"use client";

import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, QrCode } from "lucide-react";
import { withBase } from "@/lib/base-path";

/* The one manual method that is safe to publish.

   A UPI ID is receive-only — someone holding it can pay you and nothing else,
   which is why it and the QR are the public half while account numbers and
   SWIFT codes travel with the invoice instead.

   The QR is drawn from the UPI ID on a canvas in the browser rather than
   stored as an image, so it can never fall out of step with the ID: change the
   ID in Settings and the code changes with it. An uploaded image wins when
   present, because a bank-issued QR can encode more than a plain address. */

export default function UpiPay({
  upiId,
  payUrl,
  qrUrl,
}: {
  upiId: string;
  /** upi://pay?... — built server-side by upiPayUrl(). */
  payUrl: string;
  /** Uploaded override; "" means draw it. */
  qrUrl: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || qrUrl || !payUrl) return;
    QRCode.toCanvas(canvas, payUrl, {
      width: 148,
      margin: 1,
      // Brand-dark on white: a tinted QR looks considered and still scans,
      // but only if the contrast stays high — hence stone-900, not orange.
      color: { dark: "#1C1917", light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    })
      .then(() => setDrawn(true))
      .catch(() => setDrawn(false));
  }, [payUrl, qrUrl]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard blocked (http, or a hardened browser). The ID is visible and
         selectable either way, so this failing costs nothing. */
    }
  }

  if (!upiId) return null;

  return (
    <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50/60 p-4">
      <div className="flex flex-wrap items-start gap-4 sm:flex-nowrap">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-orange-800">
            Our UPI ID
          </p>
          <p className="mt-1.5 break-all font-mono text-sm font-semibold text-stone-900 select-all">
            {upiId}
          </p>
          <button
            type="button"
            onClick={copy}
            className="mt-2.5 inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-orange-300 bg-white px-3.5 text-xs font-bold text-orange-900 transition-colors hover:border-[#F26419] hover:bg-orange-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F26419]"
          >
            {copied ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
            {copied ? "Copied" : "Copy UPI ID"}
          </button>
          {/* Says what to do with it — a bare ID assumes the reader knows. */}
          <p className="mt-2 text-[11px] leading-relaxed text-stone-500">
            Pay from any UPI app — GPay, PhonePe, Paytm or your bank&rsquo;s.
          </p>
        </div>

        <div className="shrink-0 text-center">
          {qrUrl ? (
            /* withBase() is mandatory: next/image does not prefix a src, and a
               bare /uploads/... path 404s on a subpath deploy. */
            <Image
              src={withBase(qrUrl)}
              alt={`Scan to pay ${upiId} by UPI`}
              width={148}
              height={148}
              className="rounded-xl border border-orange-200 bg-white p-1.5"
            />
          ) : (
            <canvas
              ref={canvasRef}
              width={148}
              height={148}
              // The ID above is the accessible route to the same information,
              // so the canvas is decoration rather than content to announce.
              aria-hidden
              className={`rounded-xl border border-orange-200 bg-white p-1.5 transition-opacity ${
                drawn ? "opacity-100" : "opacity-0"
              }`}
            />
          )}
          <p className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-orange-800">
            <QrCode size={11} aria-hidden /> Scan &amp; pay
          </p>
        </div>
      </div>
    </div>
  );
}
