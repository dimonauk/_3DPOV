import type { Product } from "./shopify/types";

/**
 * Resolve a GLB URL for a product without extending lib/shopify's
 * Storefront query (per the handoff brief: "lib/shopify/* — Extend
 * only, never replace").
 *
 * Convention, today: if a product has the `3d` tag, the model lives
 * at /models/{handle}.glb (served from public/models/, the Vercel
 * Blob bucket, or any CDN via NEXT_PUBLIC_MODEL_BASE_URL).
 *
 * Tomorrow: swap the body to read product.metafield.custom.model_3d
 * once lib/shopify is extended to select metafields. The product
 * page call-site doesn't change.
 */
export function resolveGlbUrl(product: Product): string | undefined {
  if (!product.tags?.includes("3d")) return undefined;
  const base = process.env.NEXT_PUBLIC_MODEL_BASE_URL?.replace(/\/$/, "") ?? "";
  return `${base}/models/${product.handle}.glb`;
}
