"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ArrowUp } from "lucide-react";

/* Back-to-top: dark core wrapped in an orange ring that fills with scroll
   progress (the bottom-corner twin of the header's progress bar). Appears
   after ~600px, stacks above the WhatsApp FAB. */

const R = 23;
const C = 2 * Math.PI * R;

export default function BackToTop() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      setVisible(window.scrollY > 600);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <button
      onClick={() =>
        window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })
      }
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-[8.5rem] right-[25px] z-[120] h-[46px] w-[46px] cursor-pointer transition-all duration-300 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <svg viewBox="0 0 52 52" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="26" cy="26" r={R} fill="none" stroke="#F5EDE4" strokeWidth="3.4" />
        <circle
          cx="26"
          cy="26"
          r={R}
          fill="none"
          stroke="#F26419"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - progress)}
        />
      </svg>
      <span className="absolute inset-1.5 flex items-center justify-center rounded-full bg-stone-900 text-[#FDBA74] shadow-[0_8px_20px_rgba(28,25,23,0.3)] transition-transform duration-200 hover:scale-105">
        <ArrowUp size={18} aria-hidden />
      </span>
    </button>
  );
}
