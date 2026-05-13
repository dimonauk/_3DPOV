/**
 * lib/capabilities/commerce/print-order.ts — Capability `commerce.print-order`.
 *
 * One-line role: synchronous typed quote function over the print-vendor
 * catalogue + request-quote stub for the future Stripe-wave order route.
 *
 * # Purpose
 * The print-bar component (`components/three/print-bar.tsx`) re-quotes on
 * every dropdown change. v0.1 quoting is pure: read the vendor catalogue,
 * apply scale multiplier + finish surcharge, return a typed `PrintQuote`.
 * v0.2 will swap the same surface for live partner-API calls when the
 * Stripe wave lands.
 *
 * # Why this shape
 * The bar must feel live — every dropdown nudge updates the price band
 * without a network round-trip. Returning a synchronous quote keeps the
 * dropdown UX honest. The submit step (`requestPrintQuote`) is the seam
 * where Stripe + the vendor's order API will wire in later; for now it
 * captures intent and returns a mock order id the calling page can echo
 * back to the visitor.
 *
 * Full purpose in print-order.PURPOSE.md.
 */

import {
  defaultVendorFor,
  getVendor,
  type PrintMaterial,
  type PrintQuote,
  type PrintQuoteRequest,
  type PrintScaleBand,
  type PrintVendor,
  type PrintVendorId,
} from "lib/print-vendors";

/** v0.1: pure quote function over the vendor catalogue. */
export function quotePrint(req: PrintQuoteRequest): PrintQuote {
  const vendor = getVendor(req.vendorId);
  if (!vendor) {
    return unavailable(req, `vendor ${req.vendorId} is not registered`);
  }
  const material = findMaterial(vendor, req);
  if (!material) {
    return unavailable(req, `material ${req.material} not stocked by ${vendor.name}`);
  }
  if (!material.finishes.includes(req.finish)) {
    return unavailable(
      req,
      `${vendor.name} does not offer ${req.finish} on ${material.label}`,
    );
  }
  const band = findScaleBand(vendor, req);
  if (!band) {
    return unavailable(req, `scale ${req.scale} not offered by ${vendor.name}`);
  }
  const referenceCm3 = estimateReferenceVolumeCm3(band);
  const materialCost =
    material.basePricePerCm3GBP * referenceCm3 * band.priceMultiplier;
  const finishSurcharge = vendor.finishSurchargeGBP[req.finish];
  const priceGBP = round2(materialCost + finishSurcharge);
  return {
    request: req,
    priceGBP,
    currency: "GBP",
    leadTime: vendor.leadTime,
    available: true,
  };
}

/**
 * Stub of the order-submission entry point. v0.1 returns a mock order id
 * after a microtask; the calling page renders "Order received — we'll be
 * in touch within one bench-day to confirm the piece." Live Stripe +
 * partner routing replaces this body in the Stripe wave.
 */
export async function requestPrintQuote(req: PrintQuoteRequest): Promise<{
  status: "received" | "unavailable";
  orderId?: string;
  reason?: string;
}> {
  const quote = quotePrint(req);
  if (!quote.available) {
    return { status: "unavailable", reason: quote.unavailableReason };
  }
  await Promise.resolve();
  return { status: "received", orderId: `mock_${cryptoRandomId()}` };
}

/**
 * Convenience: build a default-everything quote request for a geometry id.
 * The bar opens with this state until the visitor changes a dropdown.
 */
export function defaultQuoteRequest(geometryId: string): PrintQuoteRequest {
  const vendor = defaultVendorFor("GB");
  const material = vendor.materials[0] ?? { slug: "resin-grey" as const };
  const band = vendor.scaleBands[0] ?? { slug: "palm" as const };
  return {
    geometryId,
    vendorId: vendor.id,
    material: material.slug,
    scale: band.slug,
    finish: "raw",
  };
}

function findMaterial(
  vendor: PrintVendor,
  req: PrintQuoteRequest,
): PrintMaterial | undefined {
  return vendor.materials.find((m) => m.slug === req.material);
}

function findScaleBand(
  vendor: PrintVendor,
  req: PrintQuoteRequest,
): PrintScaleBand | undefined {
  return vendor.scaleBands.find((s) => s.slug === req.scale);
}

/**
 * Reference volume in cm³ used by the v0.1 quote. The bar does not yet
 * read live geometry — pieces vary in volume — so we estimate from the
 * scale band's midpoint longest-edge with a chunky-mid-density factor.
 * Replace with live mesh-volume reading when the geometry pipeline ships.
 */
function estimateReferenceVolumeCm3(band: PrintScaleBand): number {
  const midMm = (band.longestEdgeMm.min + band.longestEdgeMm.max) / 2;
  const midCm = midMm / 10;
  // 0.18 captures "sculpture not solid block" — about 18% of the cube
  // a longest-edge box would imply.
  return Math.pow(midCm, 3) * 0.18;
}

function unavailable(req: PrintQuoteRequest, reason: string): PrintQuote {
  const vendor = getVendor(req.vendorId);
  return {
    request: req,
    priceGBP: 0,
    currency: "GBP",
    leadTime: vendor?.leadTime ?? { printDays: 0, shipDaysUK: 0, shipsFrom: "—" },
    available: false,
    unavailableReason: reason,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  }
  return Math.random().toString(36).slice(2, 14);
}
