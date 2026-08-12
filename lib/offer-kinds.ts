/* What an offer IS, along two axes that are deliberately kept apart.

   The obvious move is one "offer type" dropdown holding
   Social follow / Festival / Seasonal / Weekly / Monthly / Special day. That
   list looks coherent and isn't — it mixes three unrelated questions:

     1. what someone must DO to earn the code   → offerType, below
     2. WHY the offer is running                → occasion, below
     3. how often it REPEATS                    → not modelled, see the note

   Collapsed into one field they cancel each other out: you could not express
   "a Diwali offer open to everyone" or "a social-follow offer running all
   year", both of which are ordinary things to want.

   ── On recurrence (Weekly / Monthly) ──────────────────────────────────────
   Those are NOT labels, they are a schedule, and calling them a category
   would be a promise the code does not keep — nothing would actually recur.
   A real "weekly offer" needs a job that reopens or clones the offer on a
   cadence, plus a rule for what happens to unclaimed codes from last week.
   That is its own feature. Until it exists, a weekly promotion is just an
   offer with a 7-day window that someone recreates, and FLASH is the honest
   label for it. */

export type OfferTypeKey = "SOCIAL_FOLLOW" | "OPEN" | "REFERRAL" | "FIRST_TIME";

export type OfferTypeDef = {
  key: OfferTypeKey;
  label: string;
  /** Admin-facing: what picking this actually changes. */
  hint: string;
  /** Heading above the requirement on the public card. Null = no requirement. */
  requirementLabel: string | null;
  /** The public promise under the claim button. */
  claimNote: string;
  /** Does the card show the social profile chips? */
  showsChannels: boolean;
};

export const OFFER_TYPES: OfferTypeDef[] = [
  {
    key: "SOCIAL_FOLLOW",
    label: "Follow us on social",
    hint: "Shows your social profiles on the card. Cannot be verified — no platform exposes follow state.",
    requirementLabel: "Follow us on",
    claimNote:
      "One code per person. We take your word on the follow — we can’t see who follows us.",
    showsChannels: true,
  },
  {
    key: "OPEN",
    label: "Open to everyone",
    hint: "No condition at all. Right for a festival or seasonal sale you want everyone to take.",
    requirementLabel: null,
    claimNote: "One code per person. No conditions — just leave a number so we can apply it.",
    showsChannels: false,
  },
  {
    key: "REFERRAL",
    label: "Refer a business",
    hint: "Framed as a thank-you for an introduction. Honour-based, like the follow — we cannot check it either.",
    requirementLabel: "How to earn it",
    claimNote:
      "One code per person. Tell us who you introduced when you use it and we’ll apply it.",
    showsChannels: false,
  },
  {
    key: "FIRST_TIME",
    label: "New clients only",
    hint: "For people who have not worked with us yet. Stated on the card, checked by you at quotation time — not enforced in code.",
    requirementLabel: "Who it’s for",
    claimNote: "One code per person, for a first engagement with us.",
    showsChannels: false,
  },
];

/** Copy shown under requirementLabel for the types that have no chips. */
export const OFFER_TYPE_REQUIREMENT: Partial<Record<OfferTypeKey, string>> = {
  REFERRAL: "Introduce us to a business that becomes a client.",
  FIRST_TIME: "Businesses that haven’t worked with DigiSutra before.",
};

export type OccasionKey =
  | "FESTIVAL"
  | "SEASONAL"
  | "SPECIAL_DAY"
  | "FLASH"
  | "LAUNCH"
  | "CLEARANCE"
  | "EVERGREEN";

export type OccasionDef = {
  key: OccasionKey;
  label: string;
  /** Shown on the public card as a small ribbon. */
  ribbon: string;
  hint: string;
  /** Tailwind classes for the ribbon — warm for urgent, cool for standing. */
  className: string;
};

export const OCCASIONS: OccasionDef[] = [
  {
    key: "FESTIVAL",
    label: "Festival",
    ribbon: "Festival offer",
    hint: "Diwali, Holi, Eid, Christmas — tied to a festival.",
    className: "bg-orange-100 text-orange-900",
  },
  {
    key: "SEASONAL",
    label: "Seasonal",
    ribbon: "Seasonal",
    hint: "A quarter or a season — new financial year, monsoon, year-end.",
    className: "bg-amber-100 text-amber-900",
  },
  {
    key: "SPECIAL_DAY",
    label: "Special day",
    ribbon: "One day only",
    hint: "A single dated day — Independence Day, an anniversary.",
    className: "bg-rose-100 text-rose-900",
  },
  {
    key: "FLASH",
    label: "Flash / limited window",
    ribbon: "Limited time",
    hint: "A short burst. Use this for a “weekly” push until real recurrence exists.",
    className: "bg-red-100 text-red-900",
  },
  {
    key: "LAUNCH",
    label: "Launch",
    ribbon: "Launch offer",
    hint: "Introducing a new service or package.",
    className: "bg-violet-100 text-violet-900",
  },
  {
    key: "CLEARANCE",
    label: "Capacity / clearance",
    ribbon: "Limited slots",
    hint: "Filling spare capacity in a quiet month.",
    className: "bg-sky-100 text-sky-900",
  },
  {
    key: "EVERGREEN",
    label: "Evergreen",
    ribbon: "Always on",
    hint: "No end date, runs continuously.",
    className: "bg-emerald-100 text-emerald-900",
  },
];

/* Lookups. Both fall back rather than throw: these are text columns precisely
   so the taxonomy can change, which means a row can legitimately hold a value
   this build has never heard of. An unknown offer type behaves as the default
   one; an unknown occasion simply shows no ribbon. */

const TYPE_BY_KEY = new Map(OFFER_TYPES.map((t) => [t.key, t]));
const OCCASION_BY_KEY = new Map(OCCASIONS.map((o) => [o.key, o]));

export function offerType(key: string | null | undefined): OfferTypeDef {
  return TYPE_BY_KEY.get((key ?? "") as OfferTypeKey) ?? OFFER_TYPES[0];
}

export function occasion(key: string | null | undefined): OccasionDef | null {
  if (!key) return null;
  return OCCASION_BY_KEY.get(key as OccasionKey) ?? null;
}

export const OFFER_TYPE_KEYS = OFFER_TYPES.map((t) => t.key);
export const OCCASION_KEYS = OCCASIONS.map((o) => o.key);
