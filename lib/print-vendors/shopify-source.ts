/**
 * lib/print-vendors/shopify-source.ts — Optional Shopify-backed vendor source.
 *
 * One-line role: fetch a `PrintVendor` record from Shopify metaobjects so
 * material/scale/finish edits happen in Shopify admin without a code deploy.
 * Falls back to the hand-curated catalogue when Shopify isn't configured or
 * returns nothing.
 *
 * # State
 * v0.1 is inert by design — `fetchVendorFromShopify` returns null until
 * `SHOPIFY_VENDOR_METAOBJECT_HANDLE` is set on Vercel **and** the Shopify
 * Storefront API token has the `unauthenticated_read_metaobjects` scope
 * granted for the PrintVendor definition.
 *
 * # Admin setup
 * Steps for the user to wire this up in Shopify admin are in
 * `docs/SHOPIFY_METAOBJECTS.md`. Until those steps are completed, the
 * site continues to use `studio-manchester.ts` as the source of truth.
 */

import { createLogger, errToObject } from "lib/log";
import { shopifyFetch } from "lib/shopify/_internal";
import type {
  PrintFinishSlug,
  PrintMaterial,
  PrintMaterialSlug,
  PrintScaleBand,
  PrintScaleSlug,
  PrintVendor,
} from "./_base";

const log = createLogger("print-vendors.shopify-source");

/** The handle of the active vendor metaobject entry in Shopify. */
const VENDOR_HANDLE = process.env.SHOPIFY_VENDOR_METAOBJECT_HANDLE;

/** Shopify metaobject GraphQL — fetch by handle + type. */
const VENDOR_QUERY = /* GraphQL */ `
  query GetPrintVendor($handle: String!) {
    metaobject(handle: { handle: $handle, type: "print_vendor" }) {
      handle
      fields {
        key
        value
        reference {
          ... on Metaobject {
            handle
            type
            fields {
              key
              value
            }
          }
        }
        references(first: 50) {
          edges {
            node {
              ... on Metaobject {
                handle
                type
                fields {
                  key
                  value
                }
              }
            }
          }
        }
      }
    }
  }
`;

type RawField = {
  key: string;
  value?: string;
  reference?: RawMetaobject | null;
  references?: { edges: Array<{ node: RawMetaobject }> } | null;
};

type RawMetaobject = {
  handle: string;
  type: string;
  fields: RawField[];
};

type VendorOperation = {
  data: {
    metaobject: RawMetaobject | null;
  };
  variables: {
    handle: string;
  };
};

/**
 * Fetch a PrintVendor from Shopify metaobjects. Returns null when:
 *   - SHOPIFY_VENDOR_METAOBJECT_HANDLE is unset
 *   - Shopify Storefront API call fails
 *   - The metaobject doesn't exist
 *   - Required fields are missing or malformed
 *
 * Callers (lib/print-vendors/index.ts) should treat null as "use the
 * hand-curated catalogue instead" — never as an error.
 */
export async function fetchVendorFromShopify(): Promise<PrintVendor | null> {
  if (!VENDOR_HANDLE) return null;
  try {
    const res = await shopifyFetch<VendorOperation>({
      query: VENDOR_QUERY,
      variables: { handle: VENDOR_HANDLE },
    });
    const node = res.body?.data?.metaobject;
    if (!node) return null;
    return parseVendor(node);
  } catch (err) {
    log.warn("Shopify fetch failed; using hand-curated", {
      err: errToObject(err),
    });
    return null;
  }
}

// ─── Parsing helpers ─────────────────────────────────────────────────────────

function parseVendor(raw: RawMetaobject): PrintVendor | null {
  const fields = indexFields(raw.fields);
  const id = fields["id"]?.value as PrintVendor["id"] | undefined;
  const name = fields["name"]?.value;
  const blurb = fields["blurb"]?.value;
  const vendorHomepage = fields["vendor_homepage"]?.value;
  const country = fields["country"]?.value as PrintVendor["country"] | undefined;
  if (!id || !name || !blurb || !vendorHomepage || !country) return null;

  const materialNodes = fields["materials"]?.references?.edges.map((e) => e.node) ?? [];
  const scaleBandNodes = fields["scale_bands"]?.references?.edges.map((e) => e.node) ?? [];
  const leadTimeNode = fields["lead_time"]?.reference;

  const materials = materialNodes
    .map(parseMaterial)
    .filter((m): m is PrintMaterial => m !== null);
  const scaleBands = scaleBandNodes
    .map(parseScaleBand)
    .filter((s): s is PrintScaleBand => s !== null);
  const leadTime = leadTimeNode ? parseLeadTime(leadTimeNode) : null;
  const finishSurchargeGBP = parseFinishSurcharges(fields["finish_surcharge_gbp"]?.value);
  if (!materials.length || !scaleBands.length || !leadTime || !finishSurchargeGBP) {
    return null;
  }
  return {
    id,
    name,
    blurb,
    vendorHomepage,
    country,
    materials,
    scaleBands,
    finishSurchargeGBP,
    leadTime,
  };
}

function parseMaterial(raw: RawMetaobject): PrintMaterial | null {
  const f = indexFields(raw.fields);
  const slug = f["slug"]?.value as PrintMaterialSlug | undefined;
  const label = f["label"]?.value;
  const finishesRaw = f["finishes"]?.value;
  const basePriceRaw = f["base_price_per_cm3_gbp"]?.value;
  const blurb = f["blurb"]?.value;
  if (!slug || !label || !finishesRaw || !basePriceRaw || !blurb) return null;
  const finishes = parseJsonArray<PrintFinishSlug>(finishesRaw);
  const basePricePerCm3GBP = parseFloat(basePriceRaw);
  if (!finishes || !Number.isFinite(basePricePerCm3GBP)) return null;
  return { slug, label, finishes, basePricePerCm3GBP, blurb };
}

function parseScaleBand(raw: RawMetaobject): PrintScaleBand | null {
  const f = indexFields(raw.fields);
  const slug = f["slug"]?.value as PrintScaleSlug | undefined;
  const label = f["label"]?.value;
  const minRaw = f["longest_edge_min_mm"]?.value;
  const maxRaw = f["longest_edge_max_mm"]?.value;
  const multRaw = f["price_multiplier"]?.value;
  if (!slug || !label || !minRaw || !maxRaw || !multRaw) return null;
  const min = parseFloat(minRaw);
  const max = parseFloat(maxRaw);
  const priceMultiplier = parseFloat(multRaw);
  if (![min, max, priceMultiplier].every(Number.isFinite)) return null;
  return {
    slug,
    label,
    longestEdgeMm: { min, max },
    priceMultiplier,
  };
}

function parseLeadTime(
  raw: RawMetaobject,
): PrintVendor["leadTime"] | null {
  const f = indexFields(raw.fields);
  const printDays = parseFloat(f["print_days"]?.value ?? "");
  const shipDaysUK = parseFloat(f["ship_days_uk"]?.value ?? "");
  const shipsFrom = f["ships_from"]?.value;
  if (![printDays, shipDaysUK].every(Number.isFinite) || !shipsFrom) return null;
  return { printDays, shipDaysUK, shipsFrom };
}

function parseFinishSurcharges(
  raw: string | undefined,
): PrintVendor["finishSurchargeGBP"] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    const required: PrintFinishSlug[] = ["raw", "sanded", "polished", "painted"];
    if (!required.every((k) => typeof parsed[k] === "number")) return null;
    return {
      raw: parsed["raw"]!,
      sanded: parsed["sanded"]!,
      polished: parsed["polished"]!,
      painted: parsed["painted"]!,
    };
  } catch {
    return null;
  }
}

function indexFields(fields: RawField[]): Record<string, RawField> {
  const out: Record<string, RawField> = {};
  for (const f of fields) out[f.key] = f;
  return out;
}

function parseJsonArray<T>(s: string): T[] | null {
  try {
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    return null;
  }
}
