/**
 * lib/print-vendors/index.ts — Vendor registry.
 *
 * One-line role: enumerate the studio's drop-ship + bureau partners the same
 * way `lib/capabilities/index.ts` enumerates the atoms. Helpers for lookup
 * + default-vendor selection by country.
 *
 * Full purpose in index.PURPOSE.md.
 */

import type { PrintVendor, PrintVendorId } from "./_base";
import { studioManchester } from "./studio-manchester";

export * from "./_base";

const vendors: Record<PrintVendorId, PrintVendor | null> = {
  "studio-manchester": studioManchester,
  // Stubs — registered when partner contracts land in the Stripe wave.
  shapeways: null,
  sculpteo: null,
  treatstock: null,
};

export function listVendors(): PrintVendor[] {
  return Object.values(vendors).filter((v): v is PrintVendor => v !== null);
}

export function getVendor(id: PrintVendorId): PrintVendor | undefined {
  return vendors[id] ?? undefined;
}

/**
 * Pick the default vendor for a visitor whose country we know.
 * UK/EU traffic routes to Manchester (the only registered vendor for now);
 * future US/EU partners override per-region.
 */
export function defaultVendorFor(country?: "GB" | "FR" | "US" | "DE"): PrintVendor {
  void country;
  return studioManchester;
}
