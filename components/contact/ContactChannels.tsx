import Image from "next/image";
import { Clock, MapPin, Phone, ShieldCheck } from "lucide-react";
import { withBase } from "@/lib/base-path";
import { DEPARTMENTS } from "@/lib/contact-channels";

const WA_HREF =
  "https://wa.me/919953900123?text=" +
  encodeURIComponent("Hi DigiSutra! I have a question.");

/**
 * Top card of the contact page: duotone photo on the left third, the
 * three desks as compact rows beside it — every email and number tappable
 * before the form starts — then the WhatsApp strip and the practical
 * details. Kept short so the form card below stays above the fold.
 */
export default function ContactChannels() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white lg:grid lg:grid-cols-[minmax(0,0.34fr)_minmax(0,1fr)]">
      <div className="relative h-40 bg-stone-900 sm:h-48 lg:h-auto">
        <Image
          src={withBase("/contact-hero.jpg")}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 420px"
          className="object-cover"
        />
        <span className="absolute inset-0 bg-[#F26419]/25 mix-blend-color" aria-hidden />
        <span
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,10,5,0.35),rgba(18,10,5,0.55))]"
          aria-hidden
        />
      </div>

      <div className="p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
          Contact us
        </p>
        <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight text-stone-900">
          We&rsquo;re here to help
        </h2>

        <div className="mt-4 divide-y divide-stone-100">
          {DEPARTMENTS.map((d) => (
            <div
              key={d.key}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5"
            >
              <span className="font-display flex items-center gap-2 text-sm font-bold text-stone-900">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  <d.icon size={14} aria-hidden />
                </span>
                {d.label}
              </span>
              <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-xs">
                <a
                  href={`mailto:${d.email}`}
                  className="max-w-full truncate font-medium text-stone-500 transition-colors hover:text-orange-700"
                >
                  {d.email}
                </a>
                <span aria-hidden className="text-stone-300">
                  ·
                </span>
                <a
                  href={d.phoneHref}
                  className="font-medium text-stone-500 transition-colors hover:text-orange-700"
                >
                  {d.phone}
                </a>
              </span>
            </div>
          ))}
        </div>

        <a
          href={WA_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center gap-2.5 rounded-xl bg-emerald-50 px-4 py-3 transition-colors hover:bg-emerald-100"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="#25D366" aria-hidden className="shrink-0">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          <span className="min-w-0 flex-1 text-sm font-semibold text-emerald-900">
            Faster on WhatsApp{" "}
            <span className="font-normal text-emerald-800/80">— start a chat →</span>
          </span>
        </a>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-stone-100 pt-4 text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <Phone size={12} className="shrink-0 text-[#F26419]" aria-hidden />
            USA toll-free{" "}
            <a
              href="tel:+18886445402"
              className="font-semibold text-stone-700 hover:text-orange-700"
            >
              +1-888-644-5402
            </a>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={12} className="shrink-0 text-[#F26419]" aria-hidden />
            Monday to Friday, 24 hours
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={12} className="shrink-0 text-[#F26419]" aria-hidden />
            B-521, iThum Tower B, Sector 62, Noida 201309
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={12} className="shrink-0 text-[#F26419]" aria-hidden />
            No spam, no reselling
          </span>
        </div>
      </div>
    </div>
  );
}
