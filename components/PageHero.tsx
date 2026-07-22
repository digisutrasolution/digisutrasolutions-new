import Image from "next/image";
import { withBase } from "@/lib/base-path";

/* Dark page banner on a duotone stock photo. `image` is optional so a
   page can still render the plain charcoal band. */
export default function PageHero({
  eyebrow,
  title,
  titleAccent,
  intro,
  image,
  children,
}: {
  eyebrow: string;
  title: string;
  titleAccent?: string;
  intro?: React.ReactNode;
  image?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden bg-stone-900">
      {image && (
        <>
          <Image
            src={withBase(image)}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <span className="absolute inset-0 bg-[#F26419]/25 mix-blend-color" aria-hidden />
          <span
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,10,5,0.93),rgba(18,10,5,0.84)_55%,rgba(18,10,5,0.93))]"
            aria-hidden
          />
        </>
      )}
      <div className="relative mx-auto max-w-[1280px] px-6 pb-14 pt-10 text-center sm:pb-16 sm:pt-12">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#FDBA74]">
          {eyebrow}
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          {title}
          {titleAccent && (
            <>
              {" "}
              <span className="font-serif-accent font-medium italic text-[#F26419]">
                {titleAccent}
              </span>
            </>
          )}
        </h1>
        {intro && (
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-stone-300 sm:text-base">
            {intro}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
