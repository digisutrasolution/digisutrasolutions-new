import Reveal from "@/components/Reveal";
import { TECHNOLOGIES } from "@/lib/data";

export default function Technologies() {
  return (
    <section className="mx-auto max-w-[1280px] px-6 pt-20 sm:pt-24">
      <Reveal>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
          Technologies
        </p>
        <h2 className="font-display max-w-xl text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
          Modern stack,{" "}
          <span className="font-serif-accent font-medium italic text-orange-600">
            proven
          </span>{" "}
          in production
        </h2>
      </Reveal>
      <div className="mt-10 space-y-5">
        {TECHNOLOGIES.map((group, i) => (
          <Reveal key={group.group} delay={i * 0.05}>
            <div className="flex flex-col gap-3 border-b border-stone-200 pb-5 sm:flex-row sm:items-center">
              <p className="font-display w-28 shrink-0 text-sm font-bold text-stone-900">
                {group.group}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.items.map((tech) => (
                  <span
                    key={tech}
                    className="cursor-default rounded-full border border-stone-200 bg-white px-4 py-1.5 text-sm text-stone-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-800"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
