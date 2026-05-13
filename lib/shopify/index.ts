/**
 * Public Shopify API surface.
 *
 * The codebase imports everything from `lib/shopify`. Internally
 * the layer is split because of Next.js 15.6 canary constraints
 * around `useCache` + `"use server"` interaction:
 *
 *   - `lib/shopify/_internal.ts` — `shopifyFetch` + reshape helpers.
 *     No directive; importable from anywhere on the server.
 *   - `lib/shopify/cached.ts` — read functions with inline
 *     `"use cache"` directives, exported through a `"use server"`
 *     top-of-file directive. The `"use server"` marker is required
 *     because canary 60 does not honour file-level `"use cache"` as
 *     a Server-Component marker for Turbopack's import-graph
 *     analyser. See that file's header for the full rationale.
 *   - `lib/shopify/index.ts` (this file) — `getCart` (uncached,
 *     reads cookies), the cart mutations, the page reads, and a
 *     re-export of the cached reads.
 *
 * The Shopify revalidation webhook used to live here; it now lives
 * in `app/api/revalidate/route.ts` because keeping it here forced
 * `lib/shopify/index.ts` to import `NextRequest`/`NextResponse`,
 * which made Turbopack's import-graph analyser treat the module as
 * Client-Component-reachable from the `"use server"` cart actions
 * file.
 *
 * If/when Next.js 15.6 stabilises and file-level `"use cache"` is
 * honoured by Turbopack, the read functions can move back into this
 * file. Until then, the split is structural.
 */

import { cookies } from "next/headers";
import {
  addToCartMutation,
  createCartMutation,
  editCartItemsMutation,
  removeFromCartMutation,
} from "./mutations/cart";
import { getCartQuery } from "./queries/cart";
import { getPageQuery, getPagesQuery } from "./queries/page";
import { reshapeCart, removeEdgesAndNodes, shopifyFetch } from "./_internal";
import type {
  Cart,
  Page,
  ShopifyAddToCartOperation,
  ShopifyCartOperation,
  ShopifyCreateCartOperation,
  ShopifyPageOperation,
  ShopifyPagesOperation,
  ShopifyRemoveFromCartOperation,
  ShopifyUpdateCartOperation,
} from "./types";

// The cached reads (getCollection, getCollections, getProduct,
// getProducts, getMenu, getCollectionProducts,
// getProductRecommendations) live in `./cached` and must be
// imported from there directly — `cached.ts` has a top-level
// `"use server"` directive, and re-exporting Server Actions through
// this file makes Turbopack mis-flag this file as
// Client-Component-reachable.

// `getCart` is intentionally uncached.
//
// In Next.js 15.6 canary the only safe way to cache a cookie-bound
// read is `"use cache: private"`, and only inline. Inline
// `"use cache: private"` cannot survive being imported by a
// `"use server"` module (`components/cart/actions.ts`), and a
// file-level `"use cache"` cannot import `next/headers`. The
// previous cache profile here was `"seconds"` (effectively
// per-request), so removing it has negligible impact.
export async function getCart(): Promise<Cart | undefined> {
  const cartId = (await cookies()).get("cartId")?.value;

  if (!cartId) {
    return undefined;
  }

  const res = await shopifyFetch<ShopifyCartOperation>({
    query: getCartQuery,
    variables: { cartId },
  });

  // Old carts become `null` when you checkout.
  if (!res.body.data.cart) {
    return undefined;
  }

  return reshapeCart(res.body.data.cart);
}

export async function createCart(): Promise<Cart> {
  const res = await shopifyFetch<ShopifyCreateCartOperation>({
    query: createCartMutation,
  });

  return reshapeCart(res.body.data.cartCreate.cart);
}

export async function addToCart(
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const cartId = (await cookies()).get("cartId")?.value!;
  const res = await shopifyFetch<ShopifyAddToCartOperation>({
    query: addToCartMutation,
    variables: {
      cartId,
      lines,
    },
  });
  return reshapeCart(res.body.data.cartLinesAdd.cart);
}

export async function removeFromCart(lineIds: string[]): Promise<Cart> {
  const cartId = (await cookies()).get("cartId")?.value!;
  const res = await shopifyFetch<ShopifyRemoveFromCartOperation>({
    query: removeFromCartMutation,
    variables: {
      cartId,
      lineIds,
    },
  });

  return reshapeCart(res.body.data.cartLinesRemove.cart);
}

export async function updateCart(
  lines: { id: string; merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const cartId = (await cookies()).get("cartId")?.value!;
  const res = await shopifyFetch<ShopifyUpdateCartOperation>({
    query: editCartItemsMutation,
    variables: {
      cartId,
      lines,
    },
  });

  return reshapeCart(res.body.data.cartLinesUpdate.cart);
}

export async function getPage(handle: string): Promise<Page> {
  const res = await shopifyFetch<ShopifyPageOperation>({
    query: getPageQuery,
    variables: { handle },
  });

  return res.body.data.pageByHandle;
}

export async function getPages(): Promise<Page[]> {
  const res = await shopifyFetch<ShopifyPagesOperation>({
    query: getPagesQuery,
  });

  return removeEdgesAndNodes(res.body.data.pages);
}
