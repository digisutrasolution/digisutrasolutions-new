import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Clock,
  CreditCard,
  Earth,
  FileCheck,
  IndianRupee,
  Landmark,
  MessageCircle,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
import { withBase } from "@/lib/base-path";
import { getPublicPayments } from "@/lib/payments";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payment Options: UPI, Cards, PayPal & International Wire",
  description:
    "Pay DigiSutra Solutions your way — UPI and bank transfer in India, cards via Cashfree, PayPal for USD, and SWIFT wire for USA, UK, Australia, Dubai and worldwide. GST invoices on every payment.",
  alternates: { canonical: `${SITE_URL}/payment` },
};

const WA_HREF =
  "https://wa.me/919953900123?text=" +
  encodeURIComponent("Hi DigiSutra! Please share the invoice / payment link for my project.");

const ACCEPT_CHIPS = [
  { src: "/payment-methods/upi.webp", label: "UPI" },
  { src: "/payment-methods/visa.webp", label: "Visa" },
  { src: "/payment-methods/mastercard.webp", label: "Mastercard" },
  { src: "/payment-methods/cashfree-payments.webp", label: "Cashfree Payments" },
  { src: "/payment-methods/paypal.webp", label: "PayPal" },
  { src: "/payment-methods/bank-transfer.webp", label: "Bank transfer" },
];

const METHODS = [
  {
    key: "upi" as const,
    icon: Smartphone,
    title: "UPI & Indian bank transfer",
    region: "India · ₹",
    copy: "Instant and free — pay to our UPI ID or by NEFT / IMPS / RTGS. The UPI ID and account details arrive with your invoice, along with a scan-and-pay QR code.",
    points: ["Settles instantly", "Zero payment fees", "GST tax invoice within 24h"],
  },
  {
    key: "cashfree" as const,
    icon: CreditCard,
    title: "Cards, netbanking & wallets — via Cashfree",
    region: "India · ₹",
    copy: "Every invoice can carry a secure Cashfree payment link: credit and debit cards (Visa, Mastercard, RuPay), netbanking across major banks, and popular wallets.",
    points: ["PCI-DSS secure checkout", "We never see or store card details", "Link valid until paid"],
  },
  {
    key: "paypal" as const,
    icon: Wallet,
    title: "PayPal",
    region: "International · $",
    copy: "The easiest route for clients in the USA, UK, Australia and Europe. We invoice in USD directly through PayPal — pay with your PayPal balance or any linked card.",
    points: ["USD invoicing", "PayPal buyer protection", "No Indian bank account needed"],
  },
  {
    key: "wire" as const,
    icon: Landmark,
    title: "International wire (SWIFT)",
    region: "USD · AED · GBP · EUR",
    copy: "For larger projects and retainers worldwide — including Dubai and the wider Gulf. SWIFT details are shared with your invoice; transfers typically clear in 1–3 business days.",
    points: ["USD, AED, GBP or EUR", "Best for ₹1L+ engagements", "FIRC provided on request"],
  },
];

const CURRENCIES = [
  {
    icon: IndianRupee,
    title: "INR — India",
    copy: "UPI, cards, netbanking or bank transfer. Every payment gets a GST tax invoice.",
  },
  {
    icon: Earth,
    title: "USD — worldwide",
    copy: "PayPal or SWIFT wire. Pricing shows USD too — use the $ toggle on the pricing page.",
  },
  {
    icon: Banknote,
    title: "AED & others — Dubai / Gulf",
    copy: "Wire in AED or your local currency; the invoice states the converted amount up front.",
  },
];

const STEPS = [
  {
    icon: ReceiptText,
    title: "1 · Invoice with your method",
    copy: "Approve the proposal and tell us how you'd like to pay — the invoice arrives with the right link or account details.",
  },
  {
    icon: ShieldCheck,
    title: "2 · Pay securely",
    copy: "UPI, Cashfree link, PayPal or wire — payments go through the gateway or your bank, never through shared card numbers.",
  },
  {
    icon: FileCheck,
    title: "3 · Receipt & kick-off",
    copy: "GST tax invoice and receipt within 24 hours, and your project or campaign starts on schedule.",
  },
];

export default async function PaymentPage() {
  // Only advertise methods that are switched on in admin Settings.
  const enabled = await getPublicPayments();
  const methods = METHODS.filter((m) => enabled[m.key]?.enabled !== false);
  const extraNote = (key: keyof typeof enabled) => enabled[key]?.note?.trim() || null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Payment Options", item: `${SITE_URL}/payment` },
    ],
  };

  return (
    <div className="pb-12 sm:pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Dark hero */}
      <div className="bg-stone-900">
        <div className="mx-auto max-w-[1280px] px-6 pb-14 pt-10 text-center sm:pb-16 sm:pt-12">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#FDBA74]">
            Payment options
          </p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Pay your way —{" "}
            <span className="font-serif-accent font-medium italic text-[#F26419]">
              ₹, $ or AED
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-stone-400 sm:text-base">
            UPI and cards in India, PayPal and wire transfers for the USA, UK,
            Australia, Dubai and everywhere else we work. Every payment comes
            with a proper GST tax invoice.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {ACCEPT_CHIPS.map((c) => (
              <span
                key={c.label}
                className="flex h-10 items-center rounded-lg bg-white px-3 py-1.5"
              >
                <Image
                  src={withBase(c.src)}
                  alt={c.label}
                  width={64}
                  height={28}
                  className="h-6 w-auto object-contain"
                />
              </span>
            ))}
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-[1280px] px-6">
        {/* Methods */}
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {methods.map((m) => (
            <div
              key={m.title}
              className="group rounded-2xl border border-stone-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#F26419] hover:shadow-[0_16px_40px_rgba(28,25,23,0.08)] sm:p-7"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition-colors duration-300 group-hover:bg-[#F26419] group-hover:text-white">
                  <m.icon size={20} aria-hidden />
                </span>
                <div>
                  <h2 className="font-display text-lg font-bold text-stone-900">{m.title}</h2>
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-800">
                    {m.region}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-stone-600">{m.copy}</p>
              {extraNote(m.key) && (
                <p className="mt-2 rounded-lg bg-orange-50 px-3 py-2 text-xs font-medium text-orange-900">
                  {extraNote(m.key)}
                </p>
              )}
              <ul className="mt-4 space-y-1.5">
                {m.points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-stone-700">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Currencies */}
        <h2 className="font-display mt-16 text-center text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
          Billed in the currency{" "}
          <span className="font-serif-accent font-medium italic text-orange-600">
            that suits you
          </span>
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {CURRENCIES.map((c) => (
            <div key={c.title} className="rounded-2xl bg-[#FFF6EF] p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-orange-600">
                <c.icon size={18} aria-hidden />
              </span>
              <h3 className="font-display mt-3 text-base font-bold text-stone-900">{c.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{c.copy}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <h2 className="font-display mt-16 text-center text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
          How payment{" "}
          <span className="font-serif-accent font-medium italic text-orange-600">works</span>
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.title} className="rounded-2xl border border-stone-200 bg-white p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <s.icon size={18} aria-hidden />
              </span>
              <h3 className="font-display mt-3 text-base font-bold text-stone-900">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{s.copy}</p>
            </div>
          ))}
        </div>

        {/* Trust strip */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-dashed border-stone-200 pt-6 text-sm text-stone-600">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={15} className="text-[#F26419]" aria-hidden /> Card details never touch
            our servers
          </span>
          <span className="flex items-center gap-1.5">
            <ReceiptText size={15} className="text-[#F26419]" aria-hidden /> GST tax invoice on every
            payment
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={15} className="text-[#F26419]" aria-hidden /> Milestone billing on projects
          </span>
          <Link
            href="/refund-policy"
            className="flex items-center gap-1.5 font-semibold text-[#F26419] hover:underline"
          >
            Refund policy →
          </Link>
        </div>

        {/* CTA */}
        <div className="mt-14 rounded-[2rem] bg-stone-900 px-6 py-10 text-center sm:px-12">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Ready to pay or need an invoice?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-stone-400">
            Message us on WhatsApp and the payment link or account details are
            with you in minutes — or start a new project with a free expert call.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href={WA_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#F26419] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600"
            >
              <MessageCircle size={15} aria-hidden /> Request my payment link
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-stone-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:border-[#F26419] hover:text-[#FDBA74]"
            >
              Claim your free expert call <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
