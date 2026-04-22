import { shopifyFetch } from "lib/shopify";
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
  // shopifyFetch is exported from lib/shopify via a re-export below.
  // If lib/shopify doesn't export it, see the footnote.
  const res = await shopifyFetch<ShopifyPolicyResponse>({
    query: getShopPolicyQuery,
  });

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
