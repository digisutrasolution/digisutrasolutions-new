import { Clock, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { DEPARTMENTS } from "@/lib/contact-channels";

/**
 * Left card on the contact page. A returning client with a support problem
 * should be able to dial the support number without filling anything in,
 * so every address and number is on screen and tappable.
 */
export default function ContactChannels() {
  return (
    <div className="rounded-[2rem] border border-stone-200 bg-white p-7 sm:p-8">
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

      <div className="mt-7 space-y-3 border-t border-stone-100 pt-6">
        <p className="flex items-start gap-2.5 text-sm text-stone-600">
          <Phone size={15} className="mt-0.5 shrink-0 text-[#F26419]" aria-hidden />
          <span>
            USA toll-free{" "}
            <a
              href="tel:+18006445402"
              className="font-semibold text-stone-800 hover:text-orange-700"
            >
              +1 (800) 644-5402
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
