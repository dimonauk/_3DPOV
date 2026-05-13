// Imported directly from `_internal` rather than `lib/shopify`.
// The `lib/shopify` index intentionally does not re-export
// `shopifyFetch` because doing so dragged extra modules through the
// `"use server"` cart-actions import graph and tripped Turbopack's
// boundary analyser in Next 15.6 canary. `_internal` has no
// directive, so the generic `shopifyFetch<T>` signature is plain to
// import from anywhere on the server.
import { shopifyFetch } from "lib/shopify/_internal";
import { getShopPolicyQuery } from "lib/shopify/queries/policy";

type ShopifyPolicy = {
  id: string;
  title: string;
  body: string;
  handle: string;
  url: string;
};

type ShopifyPolicyResponse = {
  data: {
    shop: {
      privacyPolicy: ShopifyPolicy | null;
      termsOfService: ShopifyPolicy | null;
      refundPolicy: ShopifyPolicy | null;
      shippingPolicy: ShopifyPolicy | null;
      subscriptionPolicy: ShopifyPolicy | null;
    };
  };
};

/**
 * Shopify exposes policies as first-class fields on `shop`, not as
 * regular pages. This helper pulls all of them in a single query and
 * resolves by handle. Purely additive to lib/shopify — no
 * modifications to the Storefront client there.
 */
export async function getShopPolicy(
  handle: string,
): Promise<ShopifyPolicy | null> {
  // If Shopify isn't configured, return null so the policy page
  // falls back to its "Pending" empty state rather than throwing
  // during prerender.
  if (!process.env.SHOPIFY_STORE_DOMAIN) {
    return null;
  }

  let res;
  try {
    res = await shopifyFetch<ShopifyPolicyResponse>({
      query: getShopPolicyQuery,
    });
  } catch {
    // Network or auth error — let the page show its empty state
    // instead of failing the build.
    return null;
  }

  const shop = res.body?.data?.shop;
  if (!shop) return null;

  const byHandle: Record<string, ShopifyPolicy | null> = {
    "privacy-policy": shop.privacyPolicy,
    "terms-of-service": shop.termsOfService,
    "refund-policy": shop.refundPolicy,
    "shipping-policy": shop.shippingPolicy,
    "subscription-policy": shop.subscriptionPolicy,
  };

  return byHandle[handle] ?? null;
}

export const POLICY_HANDLES = [
  "privacy-policy",
  "terms-of-service",
  "refund-policy",
  "shipping-policy",
  "subscription-policy",
] as const;
