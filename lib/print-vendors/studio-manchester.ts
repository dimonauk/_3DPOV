/**
 * lib/print-vendors/studio-manchester.ts — The first concrete vendor entry.
 *
 * One-line role: a hand-curated mock of a Manchester-based drop-ship farm —
 * the studio's local partner. Pricing in v0.1 is plausible-not-quoted; live
 * partner-API pricing lands behind the same shape in the Stripe wave.
 *
 * Full purpose in studio-manchester.PURPOSE.md.
 */

import type { PrintVendor } from "./_base";

export const studioManchester: PrintVendor = {
  id: "studio-manchester",
  name: "The Studio's Manchester Partner",
  blurb:
    "Salford drop-ship farm; resin + nylon + PLA on bench, sintered metal via subcontract. The default route for UK shipments.",
  vendorHomepage: "https://holoflow.co.uk/print-partners/manchester",
  country: "GB",
  materials: [
    {
      slug: "resin-grey",
      label: "Grey resin",
      finishes: ["raw", "sanded", "polished", "painted"],
      basePricePerCm3GBP: 0.42,
      blurb:
        "Standard 405nm photopolymer. Crisp detail; default for sculptures under shelf-scale.",
    },
    {
      slug: "resin-clear",
      label: "Clear resin",
      finishes: ["raw", "sanded", "polished"],
      basePricePerCm3GBP: 0.55,
      blurb:
        "Optically clear photopolymer. Light passes through — strange-attractor pieces glow from within.",
    },
    {
      slug: "pla-white",
      label: "White PLA",
      finishes: ["raw", "sanded", "painted"],
      basePricePerCm3GBP: 0.18,
      blurb:
        "Bio-plastic, FDM. The budget route; visible layer lines unless sanded. Largest scale band before steel.",
    },
    {
      slug: "nylon-mjf",
      label: "MJF nylon (PA12)",
      finishes: ["raw", "sanded", "polished"],
      basePricePerCm3GBP: 0.74,
      blurb:
        "Multi-jet fusion polyamide. Tough, isotropic, slightly granular surface. Recommended for desktop + shelf.",
    },
    {
      slug: "steel-stainless",
      label: "Stainless steel (sintered)",
      finishes: ["raw", "polished", "painted"],
      basePricePerCm3GBP: 3.6,
      blurb:
        "Binder-jetted, infiltrated, polished. The editioned route; subcontracted to a sintering bureau.",
    },
    {
      slug: "bronze-sintered",
      label: "Sintered bronze",
      finishes: ["raw", "polished"],
      basePricePerCm3GBP: 4.1,
      blurb:
        "Bronze-matrix infiltration. The same form, in something that catches light like a votive.",
    },
  ],
  scaleBands: [
    {
      slug: "palm",
      label: "Palm (≤100mm)",
      longestEdgeMm: { min: 40, max: 100 },
      priceMultiplier: 1,
    },
    {
      slug: "desktop",
      label: "Desktop (100–200mm)",
      longestEdgeMm: { min: 100, max: 200 },
      priceMultiplier: 2.5,
    },
    {
      slug: "shelf",
      label: "Shelf (200–400mm)",
      longestEdgeMm: { min: 200, max: 400 },
      priceMultiplier: 6,
    },
    {
      slug: "wall",
      label: "Wall (400–900mm)",
      longestEdgeMm: { min: 400, max: 900 },
      priceMultiplier: 14,
    },
  ],
  finishSurchargeGBP: {
    raw: 0,
    sanded: 12,
    polished: 38,
    painted: 55,
  },
  leadTime: {
    printDays: 5,
    shipDaysUK: 2,
    shipsFrom: "Manchester",
  },
};
