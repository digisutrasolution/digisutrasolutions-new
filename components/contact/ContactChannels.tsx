import { ArrowRight, Clock, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { DEPARTMENTS } from "@/lib/contact-channels";

const WA_HREF =
  "https://wa.me/919953900123?text=" +
  encodeURIComponent("Hi DigiSutra! I have a question.");

/* Facts we can stand behind — no invented response-time averages. */
const FACTS = [
  { value: "1 day", label: "Reply time, Mon–Fri" },
  { value: "12", label: "Countries served" },
];

/**
 * Left card on the contact page. A returning client with a support problem
 * should be able to dial the support number without filling anything in,
 * so every address and number is on screen and tappable.
 */
export default function ContactChannels() {
  return (
    <div className="flex h-full flex-col rounded-[2rem] border border-stone-200 bg-white p-7 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
        Contact us
      </p>
      <h2 className="font-display mt-3 text-2xl font-extrabold tracking-tight text-stone-900">
        We&rsquo;re here to help
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        Digital marketing, web development, AI automation and technical
        support — reach the right desk directly.
      </p>

      <div className="mt-7 space-y-6">
        {DEPARTMENTS.map((d) => (
          <div key={d.key} className="border-t border-stone-100 pt-5 first:border-t-0 first:pt-0">
            <p className="font-display flex items-center gap-2.5 text-sm font-bold text-stone-900">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                <d.icon size={16} aria-hidden />
              </span>
              {d.label}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-stone-500">{d.blurb}</p>
            <div className="mt-2.5 flex flex-col gap-1.5 text-sm">
              <a
                href={`mailto:${d.email}`}
                className="flex items-center gap-2 font-medium text-stone-700 transition-colors hover:text-orange-700"
              >
                <Mail size={14} className="shrink-0 text-stone-400" aria-hidden />
                <span className="break-all">{d.email}</span>
              </a>
              <a
                href={d.phoneHref}
                className="flex items-center gap-2 font-medium text-stone-700 transition-colors hover:text-orange-700"
              >
                <Phone size={14} className="shrink-0 text-stone-400" aria-hidden />
                {d.phone}
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* The card is stretched to the form's height, and this block absorbs
          whatever slack is left — otherwise it showed as a hole above the
          hours. A WhatsApp prompt earns that space better than padding. */}
      <div className="mt-auto pt-7">
        <a
          href={WA_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="group block rounded-2xl bg-emerald-50 p-5 transition-colors hover:bg-emerald-100"
        >
          <p className="flex items-center gap-2 text-sm font-bold text-emerald-900">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="#25D366" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Faster on WhatsApp
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-emerald-800/80">
            Send the question straight to a human on +91-9953-900123 — no form
            to fill in.
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-sm font-bold text-emerald-700">
            Start a chat
            <ArrowRight
              size={13}
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            />
          </p>
        </a>

        <dl className="mt-4 grid grid-cols-2 gap-3">
          {FACTS.map((f) => (
            <div key={f.label} className="rounded-xl bg-[#FFFBF7] px-4 py-3">
              <dt className="sr-only">{f.label}</dt>
              <dd className="font-display text-xl font-extrabold tracking-tight text-stone-900">
                {f.value}
              </dd>
              <p className="mt-0.5 text-xs text-stone-500">{f.label}</p>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-7 space-y-3 border-t border-stone-100 pt-6">
        <p className="flex items-start gap-2.5 text-sm text-stone-600">
          <Phone size={15} className="mt-0.5 shrink-0 text-[#F26419]" aria-hidden />
          <span>
            USA toll-free{" "}
            <a
              href="tel:+18886445402"
              className="font-semibold text-stone-800 hover:text-orange-700"
            >
              +1-888-644-5402
            </a>
          </span>
        </p>
        <p className="flex items-start gap-2.5 text-sm text-stone-600">
          <Clock size={15} className="mt-0.5 shrink-0 text-[#F26419]" aria-hidden />
          <span>
            <b className="font-semibold text-stone-800">Monday to Friday, 24 hours.</b>{" "}
            Weekend enquiries are answered on the next working day.
          </span>
        </p>
        <p className="flex items-start gap-2.5 text-sm text-stone-600">
          <MapPin size={15} className="mt-0.5 shrink-0 text-[#F26419]" aria-hidden />
          <span>B-521, iThum Tower B, Sector 62, Noida, Uttar Pradesh 201309, India</span>
        </p>
        <p className="flex items-start gap-2.5 text-sm text-stone-600">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#F26419]" aria-hidden />
          <span>No spam, no reselling — your details stay with us.</span>
        </p>
      </div>
    </div>
  );
}
