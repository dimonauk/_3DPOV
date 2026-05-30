/**
 * app/bureau/checkout/[slug]/[edition]/checkout/types.ts
 *
 * Shared types for the drop-edition checkout surface.
 */

export type FulfillmentStatus =
  | "pending-payment"
  | "paid"
  | "shipped"
  | "cancelled";

export type EntitlementDoc = {
  dropId: string;
  editionNumber: number;
  variant: "unique" | "limited" | "open";
  uid: string;
  claimedAt: string;
  fulfillmentStatus: FulfillmentStatus;
  passId: string | null;
  stripeCheckoutUrl?: string;
  stripeCheckoutSessionId?: string;
  paidAt?: string;
  stripePaymentIntentId?: string;
};

export type CheckoutClientProps = {
  slug: string;
  editionNumber: number;
  variantHint: string;
  initialPaid: boolean;
  stripeSessionId: string | null;
};
