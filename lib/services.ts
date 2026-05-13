/**
 * The studio's full commercial surface — every line that names a price,
 * invites a transaction, or signposts a paid-for thing, drawn together
 * so a visitor can see what the bench actually offers at a glance.
 *
 * Voice register: each service carries two voices side by side. `pitch`
 * is Aura — the catalogue narrator who names what the offer is in one
 * line. `honestLine` is Dimona first-person — what currently works,
 * what's calendar-gated, what's pre-order, what's still on the bench.
 *
 * Source of truth: `docs/COMMERCE_ROADMAP.md`. Where the roadmap names
 * a price, that price is reproduced verbatim. The `pricingStatus` flag
 * is mirrored to the `data-pricing` attribute on the page so it's
 * obvious at a glance which numbers are live and which are draft.
 */

export type ServiceTier = {
  name: string;
  /** Already-formatted display string, e.g. "from £180". */
  price: string;
  cadence?: "one-time" | "commission" | "subscription" | "per-unit";
  includes: string[];
};

export type ServiceCategory =
  | "editions"
  | "commission"
  | "kits-and-products"
  | "workshop-and-courses"
  | "community";

export type Service = {
  slug: string;
  name: string;
  category: ServiceCategory;
  /** One-line pitch — Aura voice. */
  pitch: string;
  /** Honest current-state line — Dimona voice. Names what works, what's pre-order, what's calendar-gated, etc. */
  honestLine: string;
  /** Optional tiers — for services with multiple price points. */
  tiers?: ServiceTier[];
  /** Single-tier price summary — used when tiers[] is absent. */
  price?: string;
  /** The pricing-status flag. */
  pricingStatus: "live" | "proposed" | "interest-list" | "calendar-gated";
  /** Existing dedicated page if there is one. */
  href?: string;
  /** Whether bookable via /contact?intent=X */
  contactIntent?: string;
  /** Hangar source / readiness — what would need to exist before this can be shipped. */
  readiness: "live" | "scaffold" | "blueprint" | "concept";
};

export const services: Service[] = [
  // ──────────────────────────────────────────────────────────────────
  // EDITIONS
  // ──────────────────────────────────────────────────────────────────
  {
    slug: "signed-photograph-editions",
    name: "Signed archival photograph editions",
    category: "editions",
    pitch:
      "Single-frame long-exposure light-painting photographs, signed, numbered, A3 and A2 on Photo Rag or Canson Baryta.",
    honestLine:
      "Nine seed editions in the catalogue at /photographs, three variants each. The Shopify code path is production-ready; the admin is being seeded right now, so the cart is live as the products land.",
    price: "from £180",
    pricingStatus: "live",
    href: "/photographs",
    readiness: "live",
  },
  {
    slug: "aerial-light-painting-prints",
    name: "Aerial light-painting editioned prints",
    category: "editions",
    pitch:
      "Drone-mounted persistence-of-vision arrays flown on slow programmed paths after sundown, captured single-frame from a partner ground camera. Editioned and signed.",
    honestLine:
      "The technique is in first-flight testing. The print line opens for commission once I trust the rig in the air; the calendar gate is honest, not coy.",
    price: "from £350/A2",
    pricingStatus: "calendar-gated",
    href: "/aerial",
    readiness: "scaffold",
  },

  // ──────────────────────────────────────────────────────────────────
  // COMMISSION
  // ──────────────────────────────────────────────────────────────────
  {
    slug: "aerial-commissions",
    name: "Aerial commission line",
    category: "commission",
    pitch:
      "Five-airframe CAA-registered aerial line. Editorial stills, follow-cam B-roll, 360° fly-throughs, FPV cinewhoop, and the LED-modified light-painting airframes when the brief calls for them.",
    honestLine:
      "I fly the fleet myself. Standard aerial work is bookable today; light-painting commissions sit behind the calendar gate while the airframes finish first-flight testing.",
    tiers: [
      {
        name: "Half-day shoot",
        price: "from £450",
        cadence: "commission",
        includes: [
          "Up to four hours on location, one airframe matched to the brief.",
          "Graded stills as TIFF/JPEG, motion as ProRes/H.265.",
          "Travel from Salford at HMRC mileage rates.",
        ],
      },
      {
        name: "Full-day shoot",
        price: "from £750",
        cadence: "commission",
        includes: [
          "Up to eight hours, multi-airframe where the brief justifies it.",
          "360° equirectangular delivery option for fly-throughs.",
          "Recce visit included on commissions inside the M60.",
        ],
      },
      {
        name: "Editioned aerial print",
        price: "from £350/A2",
        cadence: "one-time",
        includes: [
          "Single-frame LED-airframe light-painting print.",
          "Signed and numbered; edition size set per piece.",
          "Available once the rig clears first-flight testing.",
        ],
      },
    ],
    pricingStatus: "proposed",
    href: "/aerial",
    contactIntent: "aerial",
    readiness: "scaffold",
  },
  {
    slug: "bureau-external-commissions",
    name: "Print bureau — external commissions",
    category: "commission",
    pitch:
      "A2 and A3 archival prints for other photographers, profiled to the bureau’s reference light, proof-then-run discipline, signed sign-off before the production batch.",
    honestLine:
      "The studio’s own editions are the primary use of the bench; external commissions are calendar-gated and I will say no to a brief that won’t fit the queue rather than do it badly.",
    tiers: [
      {
        name: "A2 archival print",
        price: "from £85/A2",
        cadence: "per-unit",
        includes: [
          "Canon Pro Platinum, Pro Lustre, or metallic photo paper.",
          "Test print and reference-light sign-off included.",
          "Insured shipping in archival tubes or crated flat.",
        ],
      },
      {
        name: "A3 archival print",
        price: "from £110/A3",
        cadence: "per-unit",
        includes: ["Same paper choice and proof-then-run discipline as A2."],
      },
      {
        name: "Test print (A4)",
        price: "£25",
        cadence: "per-unit",
        includes: [
          "Single A4 reference proof for paper-choice and colour decisions.",
          "Held against final balance if the run goes ahead.",
        ],
      },
    ],
    pricingStatus: "calendar-gated",
    href: "/bureau",
    contactIntent: "print",
    readiness: "scaffold",
  },
  {
    slug: "bespoke-waveguide-sculpture",
    name: "Bespoke waveguide sculpture from a recorded gesture",
    category: "commission",
    pitch:
      "The buyer sends a five-second video of a hand gesture. The studio breeds a 30–120 mm waveguide sculpture from it through the genetic-algorithm engine, prints it in clear or tinted resin, signs and numbers it.",
    honestLine:
      "Six-week pipeline. The breeding engine exists on the bench, the customer-facing intake does not yet — commissions today route through the contact form and I quote per brief.",
    price: "from £450 – £1400",
    pricingStatus: "proposed",
    href: "/articles/how-the-studio-breeds-sculptures",
    contactIntent: "sculpture",
    readiness: "blueprint",
  },
  {
    slug: "belt-printed-wall-reliefs",
    name: "Made-to-measure belt-printed wall reliefs",
    category: "commission",
    pitch:
      "Architectural-finish parametric reliefs cut to the buyer’s wall dimensions, hung on a slim aluminium rail system. Pattern family, colour, and seed are chosen at brief; the dimensions are taken from the room.",
    honestLine:
      "Belt-printer side of the bench is running; the pattern-family catalogue and the dimension calculator are still in build. Commissions today are bespoke-by-brief, not self-serve.",
    price: "from £180 – £280 per linear metre",
    pricingStatus: "proposed",
    contactIntent: "relief",
    readiness: "blueprint",
  },
  {
    slug: "looking-glass-quilts",
    name: "Looking Glass volumetric trail quilts",
    category: "commission",
    pitch:
      "The buyer sends footage of a light-trail; the studio outputs a Looking Glass Portrait-compatible quilt file. Ships as a file, or bundled with a Portrait as a complete volumetric object.",
    honestLine:
      "File-side pipeline is wired; the Portrait-bundle option waits on the reseller arrangement. Delivered with a secured download link and, if hardware’s in the bundle, calibrated against the unit before it ships.",
    tiers: [
      {
        name: "File-only quilt",
        price: "from £120",
        cadence: "commission",
        includes: [
          "Server-side video-to-quilt conversion.",
          "Secured download URL on delivery.",
        ],
      },
      {
        name: "Quilt with Looking Glass Portrait bundled",
        price: "from £580",
        cadence: "commission",
        includes: [
          "Same quilt file as above.",
          "Looking Glass Portrait hardware, calibrated against the file before ship.",
        ],
      },
    ],
    pricingStatus: "proposed",
    href: "/services/looking-glass-quilts",
    contactIntent: "looking-glass",
    readiness: "blueprint",
  },

  // ──────────────────────────────────────────────────────────────────
  // KITS AND PRODUCTS
  // ──────────────────────────────────────────────────────────────────
  {
    slug: "bezel-clip-controllers",
    name: "Bezel-Clip controllers for Quest 3 and Steam Frame",
    category: "kits-and-products",
    pitch:
      "A small programmable LED ring that clips to a Quest 3 or Steam Frame controller. The same persistence-of-vision logic the studio’s photographic rigs use, miniaturised onto the thing already in your hand.",
    honestLine:
      "Interest list is open. The electronics line is settled; the controller-mount mechanical and the headset-SDK plumbing are the parts I’m still finishing. Pre-orders fund the rest of the build.",
    tiers: [
      {
        name: "Single bezel",
        price: "£249",
        cadence: "one-time",
        includes: [
          "One bezel for Quest 3 or Steam Frame.",
          "Small spares pack.",
          "UK shipping included.",
        ],
      },
      {
        name: "Matched pair",
        price: "£449",
        cadence: "one-time",
        includes: [
          "Two bezels, matched per-batch.",
          "Spares pack and UK shipping included.",
        ],
      },
    ],
    pricingStatus: "interest-list",
    href: "/bezel",
    contactIntent: "bezel",
    readiness: "scaffold",
  },

  // ──────────────────────────────────────────────────────────────────
  // WORKSHOP AND COURSES
  // ──────────────────────────────────────────────────────────────────
  {
    slug: "nine-seconds-workshop",
    name: "Nine Seconds workshop in Salford",
    category: "workshop-and-courses",
    pitch:
      "Half-day in the studio: prompt → SDXL → SAM2 → STL → print. The visitor leaves with a printed sculpture of their own prompt and the file to remake it.",
    honestLine:
      "Two to four seats per cohort. One seat per cohort is held back on a sliding scale — write to me if cost is the constraint and we’ll talk.",
    price: "£180 – £280 per seat",
    pricingStatus: "proposed",
    contactIntent: "workshop",
    readiness: "blueprint",
  },
  {
    slug: "holoflow-loop-course",
    name: "Holoflow Loop — the six-rung course",
    category: "workshop-and-courses",
    pitch:
      "The studio’s curriculum, taught in sequence rather than browsed: long-exposure photograph → capture → voxel → mesh → print → wear/display.",
    honestLine:
      "Course architecture exists as the free curriculum at /learn. The paid version layers video, source files, and a small cohort group; it lands once the recordings are made.",
    price: "from £180 – £280",
    pricingStatus: "proposed",
    contactIntent: "course",
    readiness: "blueprint",
  },

  // ──────────────────────────────────────────────────────────────────
  // COMMUNITY
  // ──────────────────────────────────────────────────────────────────
  {
    slug: "rookery-perch",
    name: "Rookery — Perch tier",
    category: "community",
    pitch:
      "The standing-room ticket to the studio’s forum. Read and post in every thread, no separate “premium” channel splitting the conversation.",
    honestLine:
      "The door fee is a bouncer, not a barrier. The /rookery/about FAQ holds a comp tier for people whose budget can’t carry it — named there explicitly so it doesn’t feel like a favour to ask.",
    price: "£6 / month",
    pricingStatus: "proposed",
    href: "/rookery/tiers",
    readiness: "scaffold",
  },
  {
    slug: "rookery-nest",
    name: "Rookery — Nest tier",
    category: "community",
    pitch:
      "Perch plus the bench-side extras: first-look at edition releases, a monthly dispatch note from the rig, and a nine-percent discount on edition prints and resin sculptures.",
    honestLine:
      "Same room as Perch, same threads. The Nest extras are studio-side, not Rookery-side, so the conversation in the forum stays one room.",
    price: "£12 / month",
    pricingStatus: "proposed",
    href: "/rookery/tiers",
    readiness: "scaffold",
  },
  {
    slug: "rookery-fledge",
    name: "Rookery — Fledge founding membership",
    category: "community",
    pitch:
      "One charge, lifetime Perch tier, listed as a founding member in the Rookery’s quiet member list. A small printed thank-you card with a signed test-strip posts once.",
    honestLine:
      "Available until the subscription gate closes. The gate is being wired; once Stripe is live, the Fledge tier closes for good.",
    price: "£75 one-time",
    pricingStatus: "proposed",
    href: "/rookery/tiers",
    readiness: "scaffold",
  },
];

// ──────────────────────────────────────────────────────────────────────
// Grouping helpers
// ──────────────────────────────────────────────────────────────────────

export type ServiceGroup = {
  category: ServiceCategory;
  /** Chrome-label group title. */
  label: string;
  /** h2 section title. */
  title: string;
  /** One-line Aura-voice intro for the group. */
  intro: string;
};

export const serviceGroups: ServiceGroup[] = [
  {
    category: "editions",
    label: "Catalogue",
    title: "Editioned prints.",
    intro:
      "Single-frame photographs, signed, numbered, on archival paper. The catalogue end of the bench.",
  },
  {
    category: "commission",
    label: "Bespoke",
    title: "Commissions.",
    intro:
      "Work made to a brief — aerial, bureau, sculpture, wall relief, volumetric quilt. Calendar-gated where the queue calls for it.",
  },
  {
    category: "kits-and-products",
    label: "Hardware",
    title: "Kits and products.",
    intro:
      "Objects the studio designs, builds, and ships. Open by interest list while the bench finishes them.",
  },
  {
    category: "workshop-and-courses",
    label: "Teaching",
    title: "Workshops and courses.",
    intro:
      "The bench taught in person and in sequence. Salford-based, small cohorts, sliding-scale seat per cohort named where it applies.",
  },
  {
    category: "community",
    label: "Forum",
    title: "Rookery membership.",
    intro:
      "The studio’s forum, gated by a door fee that funds the room rather than extracts from it. Three tiers, one founding-member close.",
  },
];

export function servicesByCategory(category: ServiceCategory): Service[] {
  return services.filter((s) => s.category === category);
}

/** Readiness label for the chrome-label flag on each card. */
export function readinessLabel(readiness: Service["readiness"]): string {
  switch (readiness) {
    case "live":
      return "Live";
    case "scaffold":
      return "Scaffold";
    case "blueprint":
      return "Blueprint";
    case "concept":
      return "Concept";
  }
}

/** Pricing-status badge text. */
export function pricingStatusLabel(
  status: Service["pricingStatus"],
): string {
  switch (status) {
    case "live":
      return "Price live";
    case "proposed":
      return "Price proposed";
    case "interest-list":
      return "Interest list";
    case "calendar-gated":
      return "Calendar-gated";
  }
}
