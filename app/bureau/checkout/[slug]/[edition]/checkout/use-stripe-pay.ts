"use client";

/**
 * app/bureau/checkout/[slug]/[edition]/checkout/use-stripe-pay.ts
 *
 * Mint a Stripe Checkout Session and redirect to it. Owns the
 * paying / payError state machine so the orchestrator doesn't need
 * to manage either.
 *
 * Returns `{ pay, paying, payError }`. Call `pay()` from a click
 * handler — successful flow window.locations to Stripe; failures
 * land in `payError` for the caller to render.
 */

import { useState } from "react";
import type { User } from "firebase/auth";

export type UseStripePay = {
  pay: () => Promise<void>;
  paying: boolean;
  payError: string | null;
};

export function useStripePay(
  user: User | null,
  slug: string,
  editionNumber: number,
): UseStripePay {
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const pay = async () => {
    if (!user || paying) return;
    setPaying(true);
    setPayError(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(
        `/api/drops/${encodeURIComponent(slug)}/stripe-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ editionNumber }),
        },
      );
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        checkoutUrl?: string;
        error?: string;
        detail?: string;
        message?: string;
      };
      if (!res.ok || !body.ok || !body.checkoutUrl) {
        setPayError(translatePayError(body, res.status));
        setPaying(false);
        return;
      }
      window.location.href = body.checkoutUrl;
    } catch (err) {
      setPayError(
        err instanceof Error
          ? err.message
          : "Couldn’t reach the checkout-session endpoint.",
      );
      setPaying(false);
    }
  };

  return { pay, paying, payError };
}

/**
 * Translate the API's error envelope into a buyer-facing sentence.
 * Pure: caller-friendly errors with no detail bleed.
 */
function translatePayError(
  body: {
    ok?: boolean;
    error?: string;
    detail?: string;
    message?: string;
  },
  status: number,
): string {
  if (body.error === "stripe_not_configured") {
    return (
      body.message ||
      "Stripe isn’t configured on this deployment yet. Reply to your claim email to settle manually."
    );
  }
  if (body.error === "already_paid") {
    return "This edition is already paid for. Refresh the page to see the confirmation.";
  }
  if (body.error === "entitlement_not_found") {
    return "No entitlement found at this edition number. Check that you’re signed in with the same account that claimed it.";
  }
  if (body.error === "unauthorized" || body.error === "token_invalid") {
    return "Session expired — please sign in again and retry.";
  }
  return (
    body.detail ||
    body.message ||
    body.error ||
    `Couldn’t open the Stripe session (HTTP ${status}).`
  );
}
