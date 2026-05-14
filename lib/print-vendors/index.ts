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
import { fetchVendorFromShopify } from "./shopify-source";
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
 *
 * Synchronous — uses the hand-curated catalogue. Use
 * `defaultVendorForAsync` when you want to consult the Shopify-backed
 * source (returns the same record when Shopify is unconfigured).
 */
export function defaultVendorFor(country?: "GB" | "FR" | "US" | "DE"): PrintVendor {
  void country;
  return studioManchester;
}

/**
 * Async variant of `defaultVendorFor`: tries `fetchVendorFromShopify`
 * first, falls back to the hand-curated record. Server-component-only
 * (uses the Shopify Storefront API). See docs/SHOPIFY_METAOBJECTS.md
 * for the admin setup that activates the Shopify path.
 */
export async function defaultVendorForAsync(
  country?: "GB" | "FR" | "US" | "DE",
): Promise<PrintVendor> {
  void country;
  const fromShopify = await fetchVendorFromShopify();
  return fromShopify ?? studioManchester;
}
