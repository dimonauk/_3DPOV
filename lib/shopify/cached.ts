"use server";

/**
 * Cached Shopify read functions.
 *
 * Lives in a separate file with a top-level `"use server"` directive
 * — per the Next.js 15.6 canary error message itself:
 *
 *   To use "use cache" functions in a Client Component, you can
 *   either export them from a separate file with "use cache" or
 *   "use server" at the top, ...
 *
 * In canary 60, `"use cache"` at the file top is NOT honored as a
 * Server-Component marker by Turbopack's import-graph analyser
 * (the build still complains that `unstable_cacheLife` /
 * `unstable_cacheTag` "only work in a Server Component"). The
 * `"use server"` directive IS honored, so we use it here even though
 * it technically turns these functions into Server Actions.
 *
 * Implication: the exports below are technically callable as Server
 * Actions (RPC) from client code. That is acceptable for these
 * functions — they take only primitive arguments (a handle, a
 * productId, etc.) and return public Storefront catalogue data,
 * which is already publicly reachable through the Shopify Storefront
 * API. There are no auth-gated reads here. The inline `"use cache"`
 * directives in each function continue to apply, so calls invoked
 * server-side are cached normally.
 *
 * Consumers import from `lib/shopify/cached` directly — not from
 * `lib/shopify` — because re-exporting Server Actions through the
 * index makes Turbopack mis-flag the index as
 * Client-Component-reachable.
 *
 * `getCart()` is intentionally NOT in this file — it reads cookies
 * and lives in `./index.ts`. See that file for the rationale.
 */

import { TAGS } from "lib/constants";
import { createLogger } from "lib/log";
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

const log = createLogger("shopify.cached");
import {
  getCollectionProductsQuery,
  getCollectionQuery,
  getCollectionsQuery,
} from "./queries/collection";
import { getMenuQuery } from "./queries/menu";
import {
  getProductQuery,
  getProductRecommendationsQuery,
  getProductsQuery,
} from "./queries/product";
import {
  domain,
  endpoint,
  removeEdgesAndNodes,
  reshapeCollection,
  reshapeCollections,
  reshapeProduct,
  reshapeProducts,
  shopifyFetch,
} from "./_internal";
import type {
  Collection,
  Menu,
  Product,
  ShopifyCollectionOperation,
  ShopifyCollectionProductsOperation,
  ShopifyCollectionsOperation,
  ShopifyMenuOperation,
  ShopifyProductOperation,
  ShopifyProductRecommendationsOperation,
  ShopifyProductsOperation,
} from "./types";

// `getCart` is intentionally NOT in this file — it reads cookies(),
// which a top-level `"use cache"` file is not permitted to import
// (`next/headers` only works in a Server Component, and a file with
// the public `"use cache"` directive is a cache scope, not a Server
// Component scope). `getCart` lives in `index.ts` so it has access
// to runtime request APIs.

export async function getCollection(
  handle: string
): Promise<Collection | undefined> {
  "use cache";
  cacheTag(TAGS.collections);
  cacheLife("days");

  const res = await shopifyFetch<ShopifyCollectionOperation>({
    query: getCollectionQuery,
    variables: {
      handle,
    },
  });

  return reshapeCollection(res.body.data.collection);
}

export async function getCollectionProducts({
  collection,
  reverse,
  sortKey,
}: {
  collection: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  "use cache";
  cacheTag(TAGS.collections, TAGS.products);
  cacheLife("days");

  if (!endpoint) {
    log.info("Skipping getCollectionProducts - Shopify not configured", {
      collection,
    });
    return [];
  }

  const res = await shopifyFetch<ShopifyCollectionProductsOperation>({
    query: getCollectionProductsQuery,
    variables: {
      handle: collection,
      reverse,
      sortKey: sortKey === "CREATED_AT" ? "CREATED" : sortKey,
    },
  });

  if (!res.body.data.collection) {
    log.info("No collection found", { collection });
    return [];
  }

  return reshapeProducts(
    removeEdgesAndNodes(res.body.data.collection.products)
  );
}

export async function getCollections(): Promise<Collection[]> {
  "use cache";
  cacheTag(TAGS.collections);
  cacheLife("days");

  if (!endpoint) {
    log.info("Skipping getCollections - Shopify not configured");
    return [
      {
        handle: "",
        title: "All",
        description: "All products",
        seo: {
          title: "All",
          description: "All products",
        },
        path: "/search",
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  const res = await shopifyFetch<ShopifyCollectionsOperation>({
    query: getCollectionsQuery,
  });
  const shopifyCollections = removeEdgesAndNodes(res.body?.data?.collections);
  const collections = [
    {
      handle: "",
      title: "All",
      description: "All products",
      seo: {
        title: "All",
        description: "All products",
      },
      path: "/search",
      updatedAt: new Date().toISOString(),
    },
    // Filter out the `hidden` collections.
    // Collections that start with `hidden-*` need to be hidden on the search page.
    ...reshapeCollections(shopifyCollections).filter(
      (collection) => !collection.handle.startsWith("hidden")
    ),
  ];

  return collections;
}

export async function getMenu(handle: string): Promise<Menu[]> {
  "use cache";
  cacheTag(TAGS.collections);
  cacheLife("days");

  if (!endpoint) {
    log.info("Skipping getMenu - Shopify not configured", { handle });
    return [];
  }

  const res = await shopifyFetch<ShopifyMenuOperation>({
    query: getMenuQuery,
    variables: {
      handle,
    },
  });

  return (
    res.body?.data?.menu?.items.map((item: { title: string; url: string }) => ({
      title: item.title,
      path: item.url
        .replace(domain, "")
        .replace("/collections", "/search")
        .replace("/pages", ""),
    })) || []
  );
}

export async function getProduct(handle: string): Promise<Product | undefined> {
  "use cache";
  cacheTag(TAGS.products);
  cacheLife("days");

  if (!endpoint) {
    log.info("Skipping getProduct - Shopify not configured", { handle });
    return undefined;
  }

  const res = await shopifyFetch<ShopifyProductOperation>({
    query: getProductQuery,
    variables: {
      handle,
    },
  });

  return reshapeProduct(res.body.data.product, false);
}

export async function getProductRecommendations(
  productId: string
): Promise<Product[]> {
  "use cache";
  cacheTag(TAGS.products);
  cacheLife("days");

  const res = await shopifyFetch<ShopifyProductRecommendationsOperation>({
    query: getProductRecommendationsQuery,
    variables: {
      productId,
    },
  });

  return reshapeProducts(res.body.data.productRecommendations);
}

export async function getProducts({
  query,
  reverse,
  sortKey,
}: {
  query?: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  "use cache";
  cacheTag(TAGS.products);
  cacheLife("days");

  const res = await shopifyFetch<ShopifyProductsOperation>({
    query: getProductsQuery,
    variables: {
      query,
      reverse,
      sortKey,
    },
  });

  return reshapeProducts(removeEdgesAndNodes(res.body.data.products));
}
