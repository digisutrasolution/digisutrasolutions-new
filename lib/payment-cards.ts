/* Default wording for the method cards on /payment.

   Lives here rather than in the page so the settings screen can show the same
   strings as placeholders — an admin should be able to see what a box will say
   if they leave it blank without opening the site in another tab. Duplicating
   them into the admin would guarantee the two drift.

   Text only. The icons stay in the page, because a React component cannot be
   a placeholder and has no business in a client-safe module. */

export type PaymentCardKey = "upi" | "cashfree" | "paypal" | "wire";

export type PaymentCardDefaults = {
  key: PaymentCardKey;
  title: string;
  region: string;
  copy: string;
  points: string[];
};

export const PAYMENT_CARD_DEFAULTS: PaymentCardDefaults[] = [
  {
    key: "upi",
    title: "UPI & Indian bank transfer",
    region: "India · ₹",
    copy: "Instant and free — pay to our UPI ID or by NEFT / IMPS / RTGS. The UPI ID and account details arrive with your invoice, along with a scan-and-pay QR code.",
    points: ["Settles instantly", "Zero payment fees", "GST tax invoice within 24h"],
  },
  {
    key: "cashfree",
    title: "Cards, netbanking & wallets — via Cashfree",
    region: "India · ₹",
    copy: "Every invoice can carry a secure Cashfree payment link: credit and debit cards (Visa, Mastercard, RuPay), netbanking across major banks, and popular wallets.",
    points: [
      "PCI-DSS secure checkout",
      "We never see or store card details",
      "Link valid until paid",
    ],
  },
  {
    key: "paypal",
    title: "PayPal",
    region: "International · $",
    copy: "The easiest route for clients in the USA, UK, Australia and Europe. We invoice in USD directly through PayPal — pay with your PayPal balance or any linked card.",
    points: ["USD invoicing", "PayPal buyer protection", "No Indian bank account needed"],
  },
  {
    key: "wire",
    title: "International wire (SWIFT)",
    region: "USD · AED · GBP · EUR",
    copy: "For larger projects and retainers worldwide — including Dubai and the wider Gulf. SWIFT details are shared with your invoice; transfers typically clear in 1–3 business days.",
    points: ["USD, AED, GBP or EUR", "Best for ₹1L+ engagements", "FIRC provided on request"],
  },
];

export const paymentCardDefaults = (key: PaymentCardKey): PaymentCardDefaults =>
  PAYMENT_CARD_DEFAULTS.find((c) => c.key === key) ?? PAYMENT_CARD_DEFAULTS[0];
