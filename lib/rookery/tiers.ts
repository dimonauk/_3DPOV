/**
 * Subscription tiers for the Rookery.
 *
 * Three options: two recurring, one founding-member one-shot. The
 * pricing here is proposed copy until the Stripe gate is wired — every
 * price is rendered through a data-attribute hook on the page so it's
 * obvious at a glance which numbers are live and which are draft.
 *
 * Voice register: Dimona first-person. This is the part of the site
 * where she shakes the visitor's hand directly; the Aura narrator does
 * not enter the room.
 */

/** Status flag for the pricing copy. Flip to "live" once Stripe is wired. */
export const PRICING_STATUS = "proposed" as const;

export type Tier = {
  slug: "perch" | "nest" | "fledge";
  name: string;
  /** e.g. "£6 / month" or "£75 once" */
  price: string;
  /** Status flag for the tier — "recurring" or "one-time" */
  cadence: "recurring" | "one-time";
  /** One- or two-sentence framing line. Dimona voice. */
  blurb: string;
  /** Bulleted list of what's included at this tier. Each item a complete short sentence. */
  includes: string[];
  /** Optional caveat or honest-constraint line shown below the inclusions. */
  caveat?: string;
};

export const tiers: Tier[] = [
  {
    slug: "perch",
    name: "Perch",
    price: "£6 / month",
    cadence: "recurring",
    blurb:
      "The standing-room ticket. Full Rookery access, no asterisks.",
    includes: [
      "Read and post in every thread.",
      "Start your own threads when you’ve got something to say.",
      "Cancel any time; your posts stay where they are.",
    ],
  },
  {
    slug: "nest",
    name: "Nest",
    price: "£12 / month",
    cadence: "recurring",
    blurb:
      "For people who want to back the studio a bit harder than the bare door fee. Same room, same threads — no separate ‘premium’ channel, because that would split the conversation. The extras are studio-side, not Rookery-side.",
    includes: [
      "Everything in Perch.",
      "First-look at edition releases — twelve to twenty-four hours before public.",
      "A monthly dispatch note from the bench — short, by email, what was on the rig this month.",
      "A nine-percent discount on edition prints and resin sculptures.",
    ],
  },
  {
    slug: "fledge",
    name: "Fledge",
    price: "£75 once",
    cadence: "one-time",
    blurb:
      "Available until the gate closes. One charge, lifetime Perch tier, listed as a founding member in the Rookery’s quiet member list. If the studio winds down, the listing stands.",
    includes: [
      "Lifetime Perch access — no recurring charge after this one.",
      "Founding-member listing in the Rookery member directory.",
      "A small printed thank-you card, posted once, with a signed test-strip from the studio.",
    ],
    caveat:
      "Only available until the subscription gate closes. The gate is being wired up; once Stripe is live, the Fledge tier closes.",
  },
];
