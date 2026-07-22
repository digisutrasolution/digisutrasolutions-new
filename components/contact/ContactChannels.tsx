import Image from "next/image";
import { Clock, MapPin, Phone, ShieldCheck } from "lucide-react";
import { withBase } from "@/lib/base-path";
import { DEPARTMENTS } from "@/lib/contact-channels";

/**
 * Photo band at the top of the single contact card: duotone office shot
 * with the three desks as white tiles on it, so every email and number is
 * tappable before the form even starts. The heavy scrim is what keeps the
 * small light-on-dark footer line readable over the photo.
 */
export default function ContactChannels() {
  return (
    <div className="relative overflow-hidden bg-stone-900">
      <Image
        src={withBase("/contact-hero.jpg")}
        alt=""
        fill
        sizes="(max-width: 1280px) 100vw, 1232px"
        className="object-cover"
      />
      <span className="absolute inset-0 bg-[#F26419]/25 mix-blend-color" aria-hidden />
      <span
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,10,5,0.92),rgba(18,10,5,0.8)_55%,rgba(18,10,5,0.92))]"
        aria-hidden
      />

      <div className="relative p-6 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FDBA74]">
          Contact us
        </p>
        <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          We&rsquo;re here to help
        </h2>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {DEPARTMENTS.map((d) => (
            <div key={d.key} className="rounded-xl bg-white/95 p-4">
              <p className="font-display flex items-center gap-2 text-sm font-bold text-stone-900">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  <d.icon size={14} aria-hidden />
                </span>
                {d.label}
              </p>
              <div className="mt-2.5 flex flex-col gap-1 text-xs">
                <a
                  href={`mailto:${d.email}`}
                  className="block truncate font-medium text-stone-600 transition-colors hover:text-orange-700"
                >
                  {d.email}
                </a>
                <a
                  href={d.phoneHref}
                  className="block font-medium text-stone-600 transition-colors hover:text-orange-700"
                >
                  {d.phone}
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-stone-300">
          <span className="flex items-center gap-1.5">
            <Phone size={13} className="shrink-0 text-[#FDBA74]" aria-hidden />
            USA toll-free{" "}
            <a href="tel:+18886445402" className="font-semibold text-white hover:text-[#FDBA74]">
              +1-888-644-5402
            </a>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={13} className="shrink-0 text-[#FDBA74]" aria-hidden />
            Monday to Friday, 24 hours
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={13} className="shrink-0 text-[#FDBA74]" aria-hidden />
            B-521, iThum Tower B, Sector 62, Noida 201309
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="shrink-0 text-[#FDBA74]" aria-hidden />
            No spam, no reselling
          </span>
        </div>
      </div>
    </div>
  );
}
