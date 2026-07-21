"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, Link2, QrCode as QrIcon, Smartphone } from "lucide-react";

type Kind = "link" | "upi" | "text";

const PRESETS: { key: Kind; label: string; icon: typeof Link2; placeholder: string }[] = [
  { key: "link", label: "Website link", icon: Link2, placeholder: "https://digisutrasolutions.com" },
  { key: "upi", label: "UPI payment", icon: Smartphone, placeholder: "yourbusiness@okhdfcbank" },
  { key: "text", label: "Plain text", icon: QrIcon, placeholder: "Any text or message" },
];

/* QR generator — renders on a canvas in the browser, so nothing is
   uploaded anywhere. UPI mode builds a standard upi:// intent that any
   Indian payment app can scan. */
export default function QrGenerator() {
  const [kind, setKind] = useState<Kind>("link");
  const [value, setValue] = useState("https://digisutrasolutions.com");
  const [payee, setPayee] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const payload =
    kind === "upi"
      ? `upi://pay?pa=${encodeURIComponent(value.trim())}${
          payee ? `&pn=${encodeURIComponent(payee.trim())}` : ""
        }${amount ? `&am=${encodeURIComponent(amount.trim())}&cu=INR` : "&cu=INR"}`
      : value.trim();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!payload) {
      canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    let cancelled = false;
    QRCode.toCanvas(canvas, payload, {
      width: 260,
      margin: 2,
      color: { dark: "#1C1917", light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    })
      .then(() => {
        if (!cancelled) setError("");
      })
      .catch(() => {
        if (!cancelled) setError("That value is too long for a QR code — try something shorter.");
      });
    return () => {
      cancelled = true;
    };
  }, [payload]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `digisutra-qr-${kind}.png`;
    a.click();
  };

  const preset = PRESETS.find((p) => p.key === kind)!;

  return (
    <div className="grid gap-6 rounded-[2rem] bg-[#FFF6EF] p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:gap-10">
      <div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => {
                setKind(p.key);
                setValue(p.key === "upi" ? "" : p.key === "link" ? "https://" : "");
              }}
              aria-pressed={kind === p.key}
              className={`flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                kind === p.key
                  ? "bg-[#F26419] text-white"
                  : "border border-stone-300 bg-white text-stone-700 hover:border-[#F26419]"
              }`}
            >
              <p.icon size={14} aria-hidden /> {p.label}
            </button>
          ))}
        </div>

        <label className="mt-5 block">
          <span className="text-sm font-semibold text-stone-700">
            {kind === "upi" ? "Your UPI ID" : kind === "link" ? "Link" : "Text"}
          </span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={preset.placeholder}
            className="mt-2 h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm text-stone-900 outline-none transition-colors focus:border-orange-500"
          />
        </label>

        {kind === "upi" && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-stone-700">Business name (optional)</span>
              <input
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                placeholder="DigiSutra Solutions"
                className="mt-2 h-11 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none focus:border-orange-500"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-stone-700">Amount ₹ (optional)</span>
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Leave blank to let them enter it"
                className="mt-2 h-11 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none focus:border-orange-500"
              />
            </label>
          </div>
        )}

        <p className="mt-5 text-xs leading-relaxed text-stone-500">
          The code is generated in your browser — nothing is uploaded or stored. Print it, add it
          to a menu, or put it on your counter.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-5">
        <canvas ref={canvasRef} className="h-[260px] w-[260px]" aria-label="QR code preview" />
        {error ? (
          <p className="mt-3 max-w-[240px] text-center text-xs text-red-600">{error}</p>
        ) : (
          <button
            onClick={download}
            disabled={!payload}
            className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#F26419] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
          >
            <Download size={15} aria-hidden /> Download PNG
          </button>
        )}
      </div>
    </div>
  );
}
