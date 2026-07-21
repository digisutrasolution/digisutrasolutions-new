import type { Metadata } from "next";
import PomodoroTimer from "@/components/tools/PomodoroTimer";
import ToolShell from "@/components/tools/ToolShell";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pomodoro Timer: Free 25-Minute Focus Timer",
  description:
    "A free Pomodoro timer — 25 minutes of focus, then a short break. Runs in your browser with no signup and no ads.",
  alternates: { canonical: `${SITE_URL}/free-tools/pomodoro-timer` },
};

export default function PomodoroPage() {
  return (
    <ToolShell
      slug="pomodoro-timer"
      title="Pomodoro"
      titleAccent="timer"
      intro="Twenty-five minutes of focus, then a break. No signup, no ads, no tab-hopping."
    >
      <PomodoroTimer />
    </ToolShell>
  );
}
