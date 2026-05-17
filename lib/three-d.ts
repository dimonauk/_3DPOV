import type { Product } from "./shopify/types";

/**
 * 3D model URL resolvers for products.
 *
 * Two paths, in priority order:
 *
 *   1. **Metafield** — when a product has `custom.model_3d` (or
 *      `custom.model_3d_usdz`) set in Shopify admin, the resolved URL
 *      from that metafield wins. This is the operator-facing default
 *      once a model is uploaded: the file lives on Shopify's CDN and
 *      the storefront just reads it.
 *
 *   2. **Tag + handle convention** — for products with the `3d` tag
 *      but no metafield set yet, fall through to a deterministic URL:
 *      `${NEXT_PUBLIC_MODEL_BASE_URL}/models/{handle}.glb` (or `.usdz`).
 *      The dev default has files served from `public/models/`. Set
 *      `NEXT_PUBLIC_MODEL_BASE_URL` to point at a CDN (Vercel Blob,
 *      Cloudflare R2) in production.
 *
 * Both paths degrade gracefully — the viewer HEAD-checks the URL and
 * renders a tinted stub if the file is missing. Per the handoff
 * brief, `lib/shopify/*` is extended (the `productFragment` now
 * requests the two metafields) rather than replaced.
 */

const modelBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_MODEL_BASE_URL?.replace(/\/$/, "") ?? "";
};

const hasTag = (product: Product, tag: string): boolean => {
  return product.tags?.some((t) => t.toLowerCase() === tag) ?? false;
};

export function resolveGlbUrl(product: Product): string | undefined {
  if (product.model3dUrl) return product.model3dUrl;
  if (!hasTag(product, "3d")) return undefined;
  return `${modelBaseUrl()}/models/${product.handle}.glb`;
}

/**
 * USDZ URL for Apple AR Quick Look on iOS. Used by `<GLBViewer />` to
 * render a "View in AR" button when the visitor is on iOS Safari /
 * iPadOS. Apple's AR Quick Look launches when the user taps an
 * `<a rel="ar" href="*.usdz">` anchor — no JavaScript or WebXR
 * required.
 *
 * Convention: a separate `custom.model_3d_usdz` metafield, OR a USDZ
 * file at `${MODEL_BASE_URL}/models/{handle}.usdz` (operator uploads
 * both formats alongside each other).
 */
export function resolveUsdzUrl(product: Product): string | undefined {
  if (product.model3dUsdzUrl) return product.model3dUsdzUrl;
  if (!hasTag(product, "3d")) return undefined;
  return `${modelBaseUrl()}/models/${product.handle}.usdz`;
}
