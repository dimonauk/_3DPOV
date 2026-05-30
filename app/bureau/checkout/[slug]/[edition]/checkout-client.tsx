"use client";

/**
 * app/bureau/checkout/[slug]/[edition]/checkout-client.tsx — Thin
 * orchestrator for the drop-edition checkout surface.
 *
 * Wires three hooks (auth, entitlement subscription, Stripe pay) and
 * picks the appropriate state component to render. No JSX content
 * beyond branching — every branch is a real component in
 * `./checkout/states.tsx`.
 *
 * Voice register: catalogue. Calm. No flourishes.
 */

import { usePathname } from "next/navigation";

import { useAuth } from "components/auth/auth-provider";

import {
  AuthLoading,
  CancelledState,
  EntitlementError,
  EntitlementLoading,
  EntitlementMissing,
  NotConfigured,
  PaidState,
  PayNowState,
  ProcessingState,
  SignInPrompt,
} from "./checkout/states";
import type { CheckoutClientProps } from "./checkout/types";
import { useEntitlement } from "./checkout/use-entitlement";
import { useStripePay } from "./checkout/use-stripe-pay";

export default function CheckoutClient({
  slug,
  editionNumber,
  variantHint,
  initialPaid,
  stripeSessionId,
}: CheckoutClientProps) {
  const { user, loading: authLoading, configured } = useAuth();
  const pathname = usePathname();
  const entitlementId = `${slug}-${editionNumber}`;

  const {
    entitlement,
    loading: entitlementLoading,
    error: entitlementError,
  } = useEntitlement(user, configured, entitlementId);

  const { pay, paying, payError } = useStripePay(user, slug, editionNumber);

  if (!configured) return <NotConfigured />;
  if (authLoading) return <AuthLoading />;
  if (!user) {
    const next = encodeURIComponent(
      pathname ? `${pathname}${initialPaid ? "?paid=1" : ""}` : "/",
    );
    return <SignInPrompt next={next} />;
  }

  if (entitlementLoading) return <EntitlementLoading />;
  if (entitlementError) {
    return <EntitlementError message={entitlementError} slug={slug} />;
  }
  if (!entitlement) {
    return <EntitlementMissing variantHint={variantHint} slug={slug} />;
  }

  const status = entitlement.fulfillmentStatus;
  if (status === "paid" || status === "shipped") {
    return (
      <PaidState
        entitlement={entitlement}
        variantHint={variantHint}
        entitlementId={entitlementId}
      />
    );
  }
  if (status === "cancelled") return <CancelledState slug={slug} />;

  // Default: pending-payment.
  if (initialPaid) return <ProcessingState stripeSessionId={stripeSessionId} />;
  return <PayNowState paying={paying} payError={payError} onPay={pay} />;
}
