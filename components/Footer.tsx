import Link from "next/link";
import { Landmark } from "lucide-react";
import Image from "next/image";
import { withBase } from "@/lib/base-path";
import { getFooterInfo, getFooterSocials, telDigits } from "@/lib/footer";
import { getLiveNav, type NavChild, type NavNode } from "@/lib/menu";

const PAYMENT_METHODS = [
  { label: "Visa", file: "visa.webp" },
  { label: "Mastercard", file: "mastercard.webp" },
  { label: "PayPal", file: "paypal.webp" },
  { label: "UPI", file: "upi.webp" },
  { label: "Cashfree", file: "cashfree-payments.webp" },
];

/* Brand glyphs by platform key (lucide has no brand icons). Keys match the
   admin Settings social list; unknown keys fall back to initials. */
const SOCIAL_ICONS: Record<string, { viewBox: string; path: string }> = {
  facebook: {
    viewBox: "0 0 512 512",
    path: "M512 256C512 114.6 397.4 0 256 0S0 114.6 0 256C0 376 82.7 476.8 194.2 504.5V334.2H141.4V256h52.8V222.3c0-87.1 39.4-127.5 125-127.5c16.2 0 44.2 3.2 55.7 6.4V172c-6-.6-16.5-1-29.6-1c-42 0-58.2 15.9-58.2 57.2V256h83.6l-14.4 78.2H287V510.1C413.8 494.8 512 386.9 512 256h0z",
  },
  youtube: {
    viewBox: "0 0 576 512",
    path: "M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z",
  },
  linkedin: {
    viewBox: "0 0 448 512",
    path: "M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z",
  },
  x: {
    viewBox: "0 0 512 512",
    path: "M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z",
  },
  instagram: {
    viewBox: "0 0 448 512",
    path: "M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z",
  },
  pinterest: {
    viewBox: "0 0 384 512",
    path: "M204 6.5C101.4 6.5 0 74.9 0 185.6 0 256 39.6 296 63.6 296c9.9 0 15.6-27.6 15.6-35.4 0-9.3-23.7-29.1-23.7-67.8 0-80.4 61.2-137.4 140.4-137.4 68.1 0 118.5 38.7 118.5 109.8 0 53.1-21.3 152.7-90.3 152.7-24.9 0-46.2-18-46.2-43.8 0-37.8 26.4-74.4 26.4-113.4 0-66.2-93.9-54.2-93.9 25.8 0 16.8 2.1 35.4 9.6 50.7-13.8 59.4-42 147.9-42 209.1 0 18.9 2.7 37.5 4.5 56.4 3.4 3.8 1.7 3.4 6.9 1.5 50.4-69 48.6-82.5 71.4-172.8 12.3 23.4 44.1 36 69.3 36 106.2 0 153.9-103.5 153.9-196.8C384 71.3 298.2 6.5 204 6.5z",
  },
  whatsapp: {
    viewBox: "0 0 24 24",
    path: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z",
  },
};

/* Contact methods render as tappable tiles below lg (icon + label on the
   first line, value wrapping underneath via w-full) and collapse back to
   the desktop column's plain icon + value rows from lg. */
const CONTACT_TILE =
  "flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-white/10 bg-black/20 p-3 text-white no-underline transition-colors hover:border-[#F26419] lg:flex-nowrap lg:gap-3 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:hover:border-transparent";
const CONTACT_TILE_WA =
  "flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-white no-underline transition-colors hover:border-emerald-400 lg:flex-nowrap lg:gap-3 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:hover:border-transparent";
const CONTACT_LABEL = "text-[11px] text-stone-400 lg:hidden";
const CONTACT_VALUE_BASE =
  "w-full font-semibold leading-tight text-white lg:w-auto lg:font-normal";
const CONTACT_VALUE = `${CONTACT_VALUE_BASE} text-[0.84rem] lg:text-[0.92rem]`;
/* The address is long, so the email tile drops a step and may wrap. */
const CONTACT_VALUE_EMAIL = `${CONTACT_VALUE_BASE} text-[0.72rem] [overflow-wrap:anywhere] lg:text-[0.92rem]`;

/* Fallback when no social profiles are configured in admin Settings. */
const DEFAULT_SOCIALS: { key: string; label: string; url: string }[] = [
  { key: "facebook", label: "Facebook", url: "https://www.facebook.com/profile.php?id=61585578555272" },
  { key: "youtube", label: "YouTube", url: "https://www.youtube.com/@DigiSutraSolutions" },
  { key: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/company/digisutrasolutionsofficial/" },
  { key: "x", label: "X", url: "https://x.com/Digisutra__" },
  { key: "instagram", label: "Instagram", url: "https://www.instagram.com/digisutrasolutions" },
  { key: "pinterest", label: "Pinterest", url: "https://in.pinterest.com/digisutrasolutionsofficial/" },
];

/* Internal hrefs must render through <Link> so Next prefixes basePath on
   subpath deploys (a raw <a href="/about"> escapes the site root and 404s
   at Apache); external hrefs open in a new tab. */
function FooterLink({ label, href, newTab }: { label: string; href: string; newTab?: boolean }) {
  const cls =
    "group relative inline-block text-[0.88rem] text-white no-underline transition-colors duration-200 hover:text-white sm:text-[0.92rem]";
  const underline = (
    <span
      className="absolute -bottom-0.5 left-0 h-[1.5px] w-full origin-left scale-x-0 rounded-full bg-[#F26419] transition-transform duration-200 group-hover:scale-x-100"
      aria-hidden
    />
  );
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={cls} {...(newTab ? { target: "_blank" } : {})}>
        {label}
        {underline}
      </Link>
    );
  }
  return (
    <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
      {label}
      {underline}
    </a>
  );
}

/* Sub-items below a footer link, indented one step per level — recursive so
   however deep the menu is built in admin, the footer renders it. */
function FooterSubList({ nodes }: { nodes: NavChild[] }) {
  return (
    <ul className="mt-2 space-y-2 border-l border-white/15 pl-3">
      {nodes.map((n) => (
        <li key={n.href + n.label}>
          <FooterLink label={n.label} href={n.href} newTab={n.newTab} />
          {n.children?.length ? <FooterSubList nodes={n.children} /> : null}
        </li>
      ))}
    </ul>
  );
}

function PaymentChips({ compact }: { compact?: boolean }) {
  /* Logos render at 20px (16px compact) from ~2x source requests so the
     optimizer never ships a blurry 44px asset. */
  const chip = `flex cursor-default items-center justify-center rounded-lg border border-white/10 bg-white ${
    compact ? "h-8 px-2" : "h-9 px-2.5 transition-transform duration-200 hover:scale-105"
  }`;
  return (
    <>
      {PAYMENT_METHODS.map((m) => (
        <div key={m.file} className={chip}>
          <Image
            src={withBase(`/payment-methods/${m.file}`)}
            alt={m.label}
            width={90}
            height={40}
            className={`${compact ? "h-4" : "h-5"} w-auto object-contain`}
          />
        </div>
      ))}
      {/* The bank-transfer source graphic is a square upscale that blurs at
          chip size, so this one is drawn in code and stays crisp. */}
      <div className={`${chip} gap-1.5`}>
        <Landmark size={compact ? 13 : 15} aria-hidden className="shrink-0 text-[#1b3f8f]" />
        <span
          aria-label="Bank transfer"
          className={`flex flex-col font-black uppercase leading-[1.05] tracking-tight ${
            compact ? "text-[8px]" : "text-[9px]"
          }`}
        >
          <span className="text-[#1b3f8f]">Bank</span>
          <span className="text-[#0a9bb5]">Transfer</span>
        </span>
      </div>
    </>
  );
}

export default async function Footer() {
  const [columns, legal, info, socialSetting] = await Promise.all([
    getLiveNav("FOOTER"),
    getLiveNav("FOOTER_LEGAL"),
    getFooterInfo(),
    getFooterSocials(),
  ]);
  const socials = socialSetting ?? DEFAULT_SOCIALS;
  const [firstColumn, ...restColumns] = columns;

  const linkColumn = (col: NavNode) => (
    <div key={col.label} className="order-1 lg:order-none">
      <h3 className="mb-4 text-[1rem] font-black uppercase tracking-wide text-[#F26419] sm:mb-5">
        {col.label}
      </h3>
      <ul className="space-y-2.5 sm:space-y-3">
        {(col.children ?? []).map((l) => (
          <li key={l.href + l.label}>
            <FooterLink label={l.label} href={l.href} newTab={l.newTab} />
            {l.children?.length ? <FooterSubList nodes={l.children} /> : null}
          </li>
        ))}
        {col.href && col.href !== "#" && (
          <li className="pt-1">
            <Link
              href={col.href}
              className="inline-flex items-center gap-1.5 text-[0.88rem] font-bold text-[#F26419] no-underline transition-colors duration-200 hover:text-white"
            >
              See All {col.label} <span>→</span>
            </Link>
          </li>
        )}
      </ul>
    </div>
  );

  return (
    <footer className="font-condensed relative bg-stone-800">
      <div className="h-[3px] bg-[#F26419]" />
      <div className="relative overflow-hidden">
        {/* Giant watermark */}
        <div
          className="pointer-events-none absolute inset-0 hidden select-none items-center overflow-hidden pl-[20%] lg:flex"
          aria-hidden
        >
          <div className="inline-block">
            <div
              className="whitespace-nowrap font-black leading-none tracking-tighter text-white"
              style={{ fontSize: "clamp(7rem, 17vw, 15rem)", opacity: 0.05 }}
            >
              DIGISUTRA
            </div>
            <div
              className="whitespace-nowrap text-right font-black text-white"
              style={{
                fontSize: "clamp(1.2rem, 2.8vw, 2.6rem)",
                opacity: 0.08,
                letterSpacing: "0.28em",
                marginTop: "0.2rem",
              }}
            >
              SOLUTIONS
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-[1280px] px-4 py-12 sm:px-6 sm:py-16">
          {/* Below lg the footer leads with the link columns side by side,
              then contact full width, and closes with a compact brand
              sign-off (CSS order only — DOM order stays brand-first so the
              lg column layout and crawlers are unaffected). */}
          <div
            className="footer-grid grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-2 sm:gap-8 lg:gap-10"
            style={
              {
                "--footer-cols": `1.5fr ${"1fr ".repeat(columns.length)}1fr`,
              } as React.CSSProperties
            }
          >
            {/* Brand — sign-off row at the end below lg, first column on lg */}
            <div className="order-3 col-span-2 border-t border-white/10 pt-6 lg:order-none lg:col-span-1 lg:border-0 lg:pt-0">
              <div className="flex items-center justify-between gap-4 lg:block">
                <div className="min-w-0">
                  <Image
                    src={withBase("/footer-logo.webp")}
                    alt="Digisutra Solutions"
                    width={260}
                    height={90}
                    className="h-10 w-auto object-contain lg:mb-6 lg:ml-1 lg:h-16"
                  />
                  <p className="mt-2 line-clamp-2 text-[0.82rem] leading-relaxed text-white lg:mb-5 lg:ml-4 lg:mt-0 lg:line-clamp-none lg:text-[0.92rem]">
                    {info.description}
                  </p>
                </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2.5 lg:ml-4 lg:justify-start">
                {socials.map((s) => {
                  const icon = SOCIAL_ICONS[s.key];
                  return (
                    <a
                      key={s.key}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 text-white transition-all duration-200 hover:border-[#F26419] hover:bg-[#F26419]/10 hover:text-white"
                    >
                      {icon ? (
                        <svg
                          viewBox={icon.viewBox}
                          height="15"
                          width="15"
                          fill="currentColor"
                          aria-hidden
                        >
                          <path d={icon.path} />
                        </svg>
                      ) : (
                        <span className="text-[10px] font-bold">
                          {s.label.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </a>
                  );
                })}
              </div>
              </div>
              <div className="mt-6 hidden lg:ml-4 lg:block">
                <p className="mb-3 text-[0.85rem] font-black uppercase tracking-wide text-[#F26419]">
                  We Accept
                </p>
                <div className="flex max-w-[290px] flex-wrap gap-1.5">
                  <PaymentChips />
                </div>
              </div>
            </div>

            {firstColumn && linkColumn(firstColumn)}
            {restColumns.map(linkColumn)}

            {/* Contact column — content managed in /admin/settings */}
            <div className="order-2 col-span-2 lg:order-none lg:col-span-1">
              <h3 className="mb-5 text-[1rem] font-black uppercase tracking-wide text-[#F26419]">
                Contact
              </h3>
              <div className="space-y-3.5">
                <div className="flex items-start gap-3 text-[0.92rem] text-white">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="mt-0.5 shrink-0"
                    aria-hidden
                  >
                    <path
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                  <span>
                    {info.address.split("\n").map((line, i) => (
                      <span key={i}>
                        {i > 0 && <br />}
                        {line}
                      </span>
                    ))}
                  </span>
                </div>
                {/* Below lg each contact method is a tappable tile in a 2×2
                    grid (no half-empty row); on lg they return to the plain
                    icon + value rows of the desktop column. */}
                <div className="grid grid-cols-2 gap-2.5 lg:block lg:space-y-3.5">
                <a
                  href={`tel:+${telDigits(info.phoneIndia)}`}
                  className={CONTACT_TILE}
                >
                  <svg width="20" height="14" viewBox="0 0 20 14" className="shrink-0" aria-hidden>
                    <rect width="20" height="4.67" fill="#FF9933" />
                    <rect y="4.67" width="20" height="4.67" fill="#fff" />
                    <rect y="9.33" width="20" height="4.67" fill="#138808" />
                    <circle cx="10" cy="7" r="1.6" fill="none" stroke="#000080" strokeWidth="0.4" />
                    <circle cx="10" cy="7" r="0.35" fill="#000080" />
                  </svg>
                  <span className={CONTACT_LABEL}>India</span>
                  <span className={CONTACT_VALUE}>{info.phoneIndia}</span>
                </a>
                <a
                  href={`tel:+${telDigits(info.phoneUs)}`}
                  className={CONTACT_TILE}
                >
                  <svg width="20" height="14" viewBox="0 0 20 14" className="shrink-0" aria-hidden>
                    <rect width="20" height="14" fill="#B22234" />
                    <rect width="20" height="1.08" y="1.08" fill="#fff" />
                    <rect width="20" height="1.08" y="3.23" fill="#fff" />
                    <rect width="20" height="1.08" y="5.38" fill="#fff" />
                    <rect width="20" height="1.08" y="7.54" fill="#fff" />
                    <rect width="20" height="1.08" y="9.69" fill="#fff" />
                    <rect width="20" height="1.08" y="11.85" fill="#fff" />
                    <rect width="8" height="7.54" fill="#3C3B6E" />
                  </svg>
                  <span className={CONTACT_LABEL}>USA</span>
                  <span className={CONTACT_VALUE}>{info.phoneUs}</span>
                </a>
                <a
                  href={`https://wa.me/${telDigits(info.whatsapp)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={CONTACT_TILE_WA}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366" className="shrink-0" aria-hidden>
                    <path d={SOCIAL_ICONS.whatsapp.path} />
                  </svg>
                  <span className={`${CONTACT_LABEL} text-emerald-300/90`}>WhatsApp</span>
                  <span className={CONTACT_VALUE}>{info.whatsapp}</span>
                </a>
                <a
                  href={`mailto:${info.email}`}
                  className={CONTACT_TILE}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
                    <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M2 7l10 7 10-7" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                  <span className={CONTACT_LABEL}>Email</span>
                  <span className={CONTACT_VALUE_EMAIL}>{info.email}</span>
                </a>
                </div>
              </div>
            </div>
          </div>

          {/* We Accept — mobile: label and chips share one wrapping row */}
          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/10 pt-5 lg:hidden">
            <p className="text-[0.85rem] font-black uppercase tracking-wide text-[#F26419]">
              We Accept
            </p>
            <div className="flex flex-wrap gap-1.5">
              <PaymentChips compact />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 bg-[lab(59_54.93_67_/_0.91)]">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-center gap-y-2 px-3 py-4 sm:px-6">
          <span className="whitespace-nowrap text-[0.92rem] font-medium text-white">
            © {new Date().getFullYear()} – Digisutra Solutions
          </span>
          {legal.map((l) => (
            <span key={l.href + l.label} className="flex items-center text-[0.92rem] text-white">
              <span className="mx-2 text-white/30">/</span>
              <FooterLegalLink href={l.href} label={l.label} newTab={l.newTab} />
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}

/* The bottom bar sits on brand orange, so hovering to #F26419 made links
   invisible — they darken to charcoal with a matching underline instead. */
function FooterLegalLink({ label, href, newTab }: { label: string; href: string; newTab?: boolean }) {
  const cls =
    "group relative font-medium text-white no-underline transition-colors duration-200 hover:text-stone-900";
  const underline = (
    <span
      className="absolute -bottom-0.5 left-0 h-[2px] w-full origin-left scale-x-0 rounded-full bg-stone-900 transition-transform duration-200 group-hover:scale-x-100"
      aria-hidden
    />
  );
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={cls} {...(newTab ? { target: "_blank" } : {})}>
        {label}
        {underline}
      </Link>
    );
  }
  return (
    <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
      {label}
      {underline}
    </a>
  );
}
