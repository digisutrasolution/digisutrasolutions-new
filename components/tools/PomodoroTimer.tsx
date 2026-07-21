"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

const MODES = {
  focus: { label: "Focus", minutes: 25, tone: "#F26419" },
  short: { label: "Short break", minutes: 5, tone: "#16A34A" },
  long: { label: "Long break", minutes: 15, tone: "#0EA5E9" },
} as const;

type Mode = keyof typeof MODES;

export default function PomodoroTimer() {
  const [mode, setMode] = useState<Mode>("focus");
  const [left, setLeft] = useState(MODES.focus.minutes * 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  // Mirrors of state the interval reads, so every setState below happens
  // inside the tick callback rather than in the effect body.
  const leftRef = useRef(MODES.focus.minutes * 60);
  const modeRef = useRef<Mode>("focus");

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const next = Math.max(0, leftRef.current - 1);
      leftRef.current = next;
      setLeft(next);
      if (next === 0) {
        clearInterval(id);
        setRunning(false);
        if (modeRef.current === "focus") setDone((d) => d + 1);
        document.title = "Time's up — DigiSutra";
      }
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const pick = (m: Mode) => {
    setMode(m);
    modeRef.current = m;
    leftRef.current = MODES[m].minutes * 60;
    setLeft(MODES[m].minutes * 60);
    setRunning(false);
  };

  const total = MODES[mode].minutes * 60;
  const progress = 1 - left / total;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const R = 86;
  const C = 2 * Math.PI * R;

  return (
    <div className="rounded-[2rem] bg-[#FFF6EF] p-6 text-center sm:p-8">
      <div className="flex flex-wrap justify-center gap-2">
        {(Object.keys(MODES) as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => pick(m)}
            aria-pressed={mode === m}
            className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              mode === m
                ? "bg-stone-900 text-white"
                : "border border-stone-300 bg-white text-stone-700 hover:border-[#F26419]"
            }`}
          >
            {MODES[m].label} · {MODES[m].minutes}m
          </button>
        ))}
      </div>

      <div className="relative mx-auto mt-8 h-[200px] w-[200px]">
        <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
          <circle cx="100" cy="100" r={R} fill="none" stroke="#F0D9C4" strokeWidth="10" />
          <circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            stroke={MODES[mode].tone}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-5xl font-extrabold tabular-nums text-stone-900">
            {mm}:{ss}
          </span>
          <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
            {MODES[mode].label}
          </span>
        </div>
      </div>

      <div className="mt-7 flex items-center justify-center gap-3">
        <button
          onClick={() => setRunning((r) => !r)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#F26419] px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600"
        >
          {running ? <Pause size={15} aria-hidden /> : <Play size={15} aria-hidden />}
          {running ? "Pause" : left === total ? "Start" : "Resume"}
        </button>
        <button
          onClick={() => pick(mode)}
          aria-label="Reset"
          className="cursor-pointer rounded-full border border-stone-300 bg-white p-3 text-stone-600 transition-colors hover:border-[#F26419] hover:text-orange-700"
        >
          <RotateCcw size={16} aria-hidden />
        </button>
      </div>

      <p className="mt-5 text-sm text-stone-600">
        {done === 0 ? "No focus sessions finished yet today." : `${done} focus session${done > 1 ? "s" : ""} done — nice.`}
      </p>
      <p className="mt-1 text-xs text-stone-500">
        Keep this tab open; the timer pauses if the browser suspends the tab.
      </p>
    </div>
  );
}
