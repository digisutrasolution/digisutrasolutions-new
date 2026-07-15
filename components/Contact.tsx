"use client";

import { useState } from "react";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Reveal from "@/components/Reveal";

const SERVICES = [
  "Digital marketing",
  "Website / e-commerce",
  "Email & SMS marketing",
  "Lead generation",
  "AI automation agents",
  "Other",
];

const BUDGETS = ["Under ₹1L", "₹1L – ₹5L", "₹5L – ₹20L", "₹20L+"];

const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200";
const labelCls = "mb-1.5 block text-xs font-semibold text-stone-700";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const payload = Object.fromEntries(data.entries());
    const name = String(payload.name ?? "").trim();
    const email = String(payload.email ?? "").trim();
    const message = String(payload.message ?? "").trim();
    if (!name || !email || !message) {
      setError("Name, email and message are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(
          json.error ?? "Could not send your message. Try again in a moment.",
        );
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="contact" className="mx-auto max-w-[1280px] px-6 pt-20 sm:pt-24">
      <Reveal>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
          Contact
        </p>
        <h2 className="font-display max-w-xl text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
          Tell us where you want to{" "}
          <span className="font-serif-accent font-medium italic text-orange-600">
            grow
          </span>
        </h2>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Reveal delay={0.05}>
          <div className="rounded-3xl border border-stone-200 bg-white p-7 sm:p-8">
            {submitted ? (
              <div className="flex min-h-72 flex-col items-center justify-center text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl text-green-700">
                  ✓
                </span>
                <h3 className="font-display mt-4 text-lg font-bold text-stone-900">
                  Message received
                </h3>
                <p className="mt-1 max-w-sm text-sm text-stone-500">
                  Thanks — we&apos;ll reply within one business day with next
                  steps and a slot for your free consultation.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className={labelCls}>
                      Name *
                    </label>
                    <input
                      id="name"
                      name="name"
                      autoComplete="name"
                      required
                      placeholder="Ananya Verma"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="company" className={labelCls}>
                      Company
                    </label>
                    <input
                      id="company"
                      name="company"
                      autoComplete="organization"
                      placeholder="Verma Retail Pvt. Ltd."
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className={labelCls}>
                      Email *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="name@company.com"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className={labelCls}>
                      Phone
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+91 98765 43210"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="service" className={labelCls}>
                      Service
                    </label>
                    <select id="service" name="service" className={inputCls}>
                      {SERVICES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="budget" className={labelCls}>
                      Budget
                    </label>
                    <select id="budget" name="budget" className={inputCls}>
                      {BUDGETS.map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="message" className={labelCls}>
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={4}
                    placeholder="Tell us about your project, goals and timeline…"
                    className={inputCls}
                  />
                </div>
                {error && (
                  <p role="alert" className="mt-3 text-sm font-medium text-red-700">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={sending}
                  className="animate-shimmer mt-5 w-full cursor-pointer rounded-full bg-[linear-gradient(120deg,#EA580C,#FB923C,#EA580C)] py-3.5 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:px-10"
                >
                  {sending ? "Sending…" : "Send message ↗"}
                </button>
              </form>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="flex h-full flex-col gap-4">
            <div className="rounded-3xl bg-stone-900 p-7">
              <h3 className="font-display text-base font-bold text-stone-50">
                Office
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-stone-300">
                <li className="flex items-start gap-3">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-orange-400" aria-hidden />
                  DigiSutra Solutions, India — serving 12 countries remote-first
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={16} className="shrink-0 text-orange-400" aria-hidden />
                  +91 98765 43210
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={16} className="shrink-0 text-orange-400" aria-hidden />
                  hello@digisutra.com
                </li>
                <li className="flex items-center gap-3">
                  <Clock size={16} className="shrink-0 text-orange-400" aria-hidden />
                  Mon–Sat, 9:30–18:30 IST
                </li>
              </ul>
            </div>
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between rounded-3xl border border-green-200 bg-green-50 p-6 transition-transform duration-300 hover:-translate-y-1"
            >
              <span>
                <span className="font-display block text-sm font-bold text-green-900">
                  Chat on WhatsApp
                </span>
                <span className="text-xs text-green-800/80">
                  Fastest replies during business hours
                </span>
              </span>
              <MessageCircle
                size={22}
                className="text-green-700 transition-transform duration-300 group-hover:scale-110"
                aria-hidden
              />
            </a>
            <div className="flex flex-1 items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center text-xs text-stone-400">
              Google Map embed goes here
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
