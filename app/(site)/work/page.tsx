import type { Metadata } from "next";
import WorkSection from "@/components/WorkSection";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Selected projects by DigiSutra Solutions — e-commerce, AI automation agents, lead generation and growth marketing programs.",
};

export default function WorkPage() {
  return (
    <section className="mx-auto max-w-[1280px] px-6 pt-12 sm:pt-16">
      <Reveal>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
          Selected work
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
          Proof, not{" "}
          <span className="font-serif-accent font-medium italic text-orange-600">
            promises
          </span>
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-stone-600 sm:text-base">
          Every project below shipped on time and moved a number that matters —
          revenue, traffic, retention or cost.
        </p>
      </Reveal>
      <div className="mt-10">
        <WorkSection showFilters />
      </div>
    </section>
  );
}
