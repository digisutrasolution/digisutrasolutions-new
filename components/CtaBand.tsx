import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { withBase } from "@/lib/base-path";

/* The dark "talk to us" band used at the end of most pages. Sits on a
   duotone stock photo under a heavy scrim so the copy keeps its contrast
   — same recipe as the pricing hero. */
export default function CtaBand({
  title,
  body,
  cta = "Claim your free expert call",
  href = "/contact",
  image = "/cta-band.jpg",
  className = "mt-14",
  children,
}: {
  title: React.ReactNode;
  body: React.ReactNode;
  cta?: string;
  href?: string;
  image?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`relative overflow-hidden rounded-[2rem] bg-stone-900 ${className}`}>
      <Image
        src={withBase(image)}
        alt=""
        fill
        sizes="(max-width: 1280px) 100vw, 1280px"
        className="object-cover"
      />
      <span className="absolute inset-0 bg-[#F26419]/25 mix-blend-color" aria-hidden />
      <span
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,10,5,0.92),rgba(18,10,5,0.86)_55%,rgba(18,10,5,0.94))]"
        aria-hidden
      />
      <div className="relative px-6 py-10 text-center sm:px-12">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          {title}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-stone-300">{body}</p>
        {children ?? (
          <Link
            href={href}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#F26419] px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600"
          >
            {cta} <ArrowRight size={14} aria-hidden />
          </Link>
        )}
      </div>
    </div>
  );
}
