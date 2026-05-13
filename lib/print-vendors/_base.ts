/**
 * lib/print-vendors/_base.ts — Typed contract for the drop-ship print catalogue.
 *
 * One-line role: the substrate every print-bar capability reads. Defines a
 * vendor + material × finish × scale catalogue + the typed quote shape that
 * the React print-bar renders and the (future) order route posts.
 *
 * Full purpose in _base.PURPOSE.md.
 */

/** A vendor — Sculpteo / Shapeways / a Manchester farm / etc. */
export type PrintVendorId = "studio-manchester" | "shapeways" | "sculpteo" | "treatstock";

/**
 * Material slug. Kebab-case. Specific enough to price; the human label lives
 * in `PrintMaterial.label`.
 */
export type PrintMaterialSlug =
  | "resin-grey"
  | "resin-clear"
  | "pla-white"
  | "nylon-mjf"
  | "steel-stainless"
  | "bronze-sintered";

/** Finish applied after print (vendor-side or studio-side). */
export type PrintFinishSlug = "raw" | "sanded" | "polished" | "painted";

/**
 * Scale band. Maps to a longest-edge range; vendor.scaleBands carries the
 * mm bounds + indicative cost multiplier. Names match the brief
 * ("palm / desktop / shelf / wall").
 */
export type PrintScaleSlug = "palm" | "desktop" | "shelf" | "wall";

/** A material the vendor stocks, with the finishes they offer for it. */
export type PrintMaterial = {
  slug: PrintMaterialSlug;
  /** Human label rendered in the dropdown. */
  label: string;
  /** Allowed finishes for this material (others are filtered out at quote time). */
  finishes: PrintFinishSlug[];
  /** Base £/cm³ price for the smallest scale band. */
  basePricePerCm3GBP: number;
  /** One-line "what this looks like" copy for hovers/tooltips. */
  blurb: string;
};

/** A scale band, with mm bounds and an indicative price multiplier. */
export type PrintScaleBand = {
  slug: PrintScaleSlug;
  /** Human label rendered in the dropdown. */
  label: string;
  /** Longest-edge target in millimetres (inclusive). */
  longestEdgeMm: { min: number; max: number };
  /**
   * Price multiplier vs. `basePricePerCm3GBP`. Convention: palm = 1,
   * desktop ≈ 2.5, shelf ≈ 6, wall ≈ 14 — non-linear because larger pieces
   * use more material and longer machine time per unit.
   */
  priceMultiplier: number;
};

/** Lead time + shipping notes the print-bar surfaces below the price. */
export type PrintLeadTime = {
  /** Working-days before the piece leaves the bench. */
  printDays: number;
  /** Working-days from leaves-bench to door (UK default). */
  shipDaysUK: number;
  /** Origin the bar names ("ships from Manchester"). */
  shipsFrom: string;
};

export type PrintVendor = {
  id: PrintVendorId;
  /** Human label rendered in the bar's vendor strip. */
  name: string;
  /** One-line description of who they are (renders under the dropdowns). */
  blurb: string;
  /** External page or product URL (the "vendor route" the order posts to). */
  vendorHomepage: string;
  /** Country, for tax + shipping defaults. */
  country: "GB" | "FR" | "US" | "DE";
  /** All materials the vendor stocks. */
  materials: PrintMaterial[];
  /** Scale bands the vendor prints in. */
  scaleBands: PrintScaleBand[];
  /**
   * Finish surcharges, additive on top of `basePricePerCm3GBP × multiplier`.
   * Indexed by finish slug; "raw" is 0 by convention.
   */
  finishSurchargeGBP: Record<PrintFinishSlug, number>;
  /** Lead time + shipping defaults the bar renders next to the price. */
  leadTime: PrintLeadTime;
};

/**
 * A quote request. Geometry id + vendor + (material, scale, finish) combo.
 * The print-bar emits these on every dropdown change; the capability returns
 * a typed `PrintQuote` synchronously (v0.1; live partner-API quotes land
 * behind the same surface in the Stripe wave).
 */
export type PrintQuoteRequest = {
  /** Stable id for the underlying 3D object — sculpture id, capability id, etc. */
  geometryId: string;
  vendorId: PrintVendorId;
  material: PrintMaterialSlug;
  scale: PrintScaleSlug;
  finish: PrintFinishSlug;
};

/** The bar reads this; later, the order route posts it. */
export type PrintQuote = {
  /** Echo of the request, so consumers can render context. */
  request: PrintQuoteRequest;
  /** Final price the bar shows. */
  priceGBP: number;
  /** Currency code; the bar formats accordingly. */
  currency: "GBP";
  /** Lead time the bar shows under the price. */
  leadTime: PrintLeadTime;
  /** Whether the combination is even buildable (e.g. "polished" not allowed on this material). */
  available: boolean;
  /** When `available === false`, the reason the bar shows in red. */
  unavailableReason?: string;
};

/**
 * The "pay-to-download" delivery options. Each is a file format the visitor
 * can buy without ordering a physical piece.
 */
export type DownloadDelivery = {
  /** File format slug, rendered in the action dropdown. */
  format: "stl" | "3mf" | "glb" | "usdz";
  /** Indicative price for the digital download. */
  priceGBP: number;
  /** Whether C2PA provenance is signed in. */
  signedProvenance: boolean;
};
