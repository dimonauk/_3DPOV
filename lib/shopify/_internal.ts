/**
 * Internal Shopify helpers shared by both the cached read layer
 * (`lib/shopify/cached.ts`) and the mutation/route layer
 * (`lib/shopify/index.ts`).
 *
 * Why this file exists — Next.js 15.6 canary:
 *   When a `"use server"` module (e.g. `components/cart/actions.ts`)
 *   imports a function with an *inline* `"use cache"` directive,
 *   Turbopack rejects the build with "not allowed to define inline
 *   use cache annotated functions in Client Components". The
 *   recommended workaround is to move the cached functions into a
 *   separate file that has `"use cache"` at the top. Doing that
 *   forced us to factor `shopifyFetch` + the reshape helpers out of
 *   `index.ts` so both layers can share them without circular
 *   imports.
 *
 *   No `"use cache"` here — these helpers are non-cached transport
 *   and pure data transforms.
 */

import { HIDDEN_PRODUCT_TAG, SHOPIFY_GRAPHQL_API_ENDPOINT } from "lib/constants";
import { isShopifyError } from "lib/type-guards";
import { ensureStartsWith } from "lib/utils";
import type {
  Cart,
  Collection,
  Connection,
  Image,
  Product,
  ShopifyCart,
  ShopifyCollection,
  ShopifyMetafield,
  ShopifyProduct,
} from "./types";

export const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? ensureStartsWith(process.env.SHOPIFY_STORE_DOMAIN, "https://")
  : "";
export const endpoint = domain ? `${domain}${SHOPIFY_GRAPHQL_API_ENDPOINT}` : "";
const key = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!;

type ExtractVariables<T> = T extends { variables: object }
  ? T["variables"]
  : never;

export async function shopifyFetch<T>({
  headers,
  query,
  variables,
}: {
  headers?: HeadersInit;
  query: string;
  variables?: ExtractVariables<T>;
}): Promise<{ status: number; body: T } | never> {
  try {
    if (!endpoint) {
      throw new Error("SHOPIFY_STORE_DOMAIN environment variable is not set");
    }

    const result = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": key,
        ...headers,
      },
      body: JSON.stringify({
        ...(query && { query }),
        ...(variables && { variables }),
      }),
    });

    const body = await result.json();

    if (body.errors) {
      throw body.errors[0];
    }

    return {
      status: result.status,
      body,
    };
  } catch (e) {
    if (isShopifyError(e)) {
      throw {
        cause: e.cause?.toString() || "unknown",
        status: e.status || 500,
        message: e.message,
        query,
      };
    }

    throw {
      error: e,
      query,
    };
  }
}

export const removeEdgesAndNodes = <T>(array: Connection<T>): T[] => {
  return array.edges.map((edge) => edge?.node);
};

export const reshapeCart = (cart: ShopifyCart): Cart => {
  if (!cart.cost?.totalTaxAmount) {
    cart.cost.totalTaxAmount = {
      amount: "0.0",
      currencyCode: cart.cost.totalAmount.currencyCode,
    };
  }

  return {
    ...cart,
    lines: removeEdgesAndNodes(cart.lines),
  };
};

export const reshapeCollection = (
  collection: ShopifyCollection
): Collection | undefined => {
  if (!collection) {
    return undefined;
  }

  return {
    ...collection,
    path: `/search/${collection.handle}`,
  };
};

export const reshapeCollections = (collections: ShopifyCollection[]) => {
  const reshapedCollections = [];

  for (const collection of collections) {
    if (collection) {
      const reshapedCollection = reshapeCollection(collection);

      if (reshapedCollection) {
        reshapedCollections.push(reshapedCollection);
      }
    }
  }

  return reshapedCollections;
};

const reshapeImages = (images: Connection<Image>, productTitle: string) => {
  const flattened = removeEdgesAndNodes(images);

  return flattened.map((image) => {
    const filename = image.url.match(/.*\/(.*)\..*/)?.[1];
    return {
      ...image,
      altText: image.altText || `${productTitle} - ${filename}`,
    };
  });
};

// custom.model_3d (GLB) and custom.model_3d_usdz (USDZ) match the fragment
// identifier order in lib/shopify/fragments/product.ts.
const metafieldUrl = (m: ShopifyMetafield | null | undefined): string | undefined => {
  if (!m) return undefined;
  // Model3d reference: pick the source matching the metafield key suffix.
  const sources = m.reference?.sources;
  if (sources && sources.length > 0) {
    const wantUsdz = m.key.endsWith("usdz");
    const match = sources.find((s) => {
      const f = s.format.toLowerCase();
      return wantUsdz ? f === "usdz" : f === "glb" || f === "gltf";
    });
    if (match?.url) return match.url;
    if (sources[0]?.url) return sources[0].url;
  }
  // GenericFile reference: just the URL on the file.
  if (m.reference?.url) return m.reference.url;
  // Plain text metafield: the value is the URL itself.
  if (m.value && /^https?:\/\//.test(m.value)) return m.value;
  return undefined;
};

export const reshapeProduct = (
  product: ShopifyProduct,
  filterHiddenProducts: boolean = true
): Product | undefined => {
  if (
    !product ||
    (filterHiddenProducts && product.tags.includes(HIDDEN_PRODUCT_TAG))
  ) {
    return undefined;
  }

  const { images, variants, metafields, ...rest } = product;
  const model3dUrl = metafieldUrl(metafields?.[0]);
  const model3dUsdzUrl = metafieldUrl(metafields?.[1]);

  return {
    ...rest,
    images: reshapeImages(images, product.title),
    variants: removeEdgesAndNodes(variants),
    ...(model3dUrl && { model3dUrl }),
    ...(model3dUsdzUrl && { model3dUsdzUrl }),
  };
};

export const reshapeProducts = (products: ShopifyProduct[]) => {
  const reshapedProducts = [];

  for (const product of products) {
    if (product) {
      const reshapedProduct = reshapeProduct(product);

      if (reshapedProduct) {
        reshapedProducts.push(reshapedProduct);
      }
    }
  }

  return reshapedProducts;
};
