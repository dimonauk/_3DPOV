"use client";

/**
 * app/bureau/checkout/[orderId]/CheckoutClient.tsx — Stripe Elements
 * payment form. Mounts <PaymentElement /> against the order's
 * existing Payment Intent client secret + confirms the payment.
 *
 * On success Stripe redirects to `return_url` which is
 * `${origin}/bureau/order/<orderId>/done`. The Stripe webhook fires
 * the `payment_intent.succeeded` event in parallel — that's what
 * flips the Firestore order doc from `pending_payment` to `paid`
 * and dispatches the customer + operator emails. The done page
 * handles the race (renders "Processing" until status flips).
 *
 * `loadStripe` is module-scoped so a SPA route change doesn't re-
 * initialise the Stripe.js bundle — recommended pattern from
 * Stripe's docs.
 */

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { useState } from "react";

const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

// Lazy-loaded once. If the publishable key isn't set, `loadStripe`
// returns a promise that resolves to null and Elements degrades to
// a "loading…" state — we surface a clearer error in PayForm instead.
let stripePromise: Promise<Stripe | null> | null = null;
function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = PUBLISHABLE_KEY
      ? loadStripe(PUBLISHABLE_KEY)
      : Promise.resolve(null);
  }
  return stripePromise;
}

export default function CheckoutClient({
  clientSecret,
  returnUrl,
}: {
  clientSecret: string;
  returnUrl: string;
}) {
  if (!PUBLISHABLE_KEY) {
    return (
      <div className="cc-error">
        <strong>Stripe not configured.</strong>
        <p>
          Set <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> in Vercel
          env vars (Production + Preview), then redeploy. The order
          itself was created — find it on{" "}
          <a href="/admin/bureau">/admin/bureau</a>.
        </p>
        <CcStyles />
      </div>
    );
  }

  return (
    <Elements
      stripe={getStripe()}
      options={{
        clientSecret,
        appearance: {
          theme: "night",
          variables: {
            colorPrimary: "#ff6fb5",
            colorBackground: "#1a0a1a",
            colorText: "#ffffff",
            colorDanger: "#ff8585",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
            borderRadius: "6px",
          },
        },
      }}
    >
      <PayForm returnUrl={returnUrl} />
      <CcStyles />
    </Elements>
  );
}

function PayForm({ returnUrl }: { returnUrl: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || busy) return;
    setBusy(true);
    setError(null);
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });
    // If we get here, confirmPayment didn't redirect — that means
    // something failed before reaching Stripe's hosted 3DS flow.
    if (result.error) {
      setError(result.error.message ?? "Payment failed");
    }
    setBusy(false);
  };

  return (
    <form onSubmit={onSubmit} className="cc-form">
      <PaymentElement />
      {error && <div className="cc-error-banner">{error}</div>}
      <button
        type="submit"
        disabled={!stripe || !elements || busy}
        className="cc-pay"
      >
        {busy ? "Processing…" : "Pay"}
      </button>
      <p className="cc-fineprint">
        Card processed by Stripe — Holoflow never sees your card details.
        You can cancel and come back to this page from the receipt
        email if you want a moment to think.
      </p>
    </form>
  );
}

function CcStyles() {
  return (
    // eslint-disable-next-line react/no-unknown-property
    <style jsx global>{`
      .cc-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .cc-pay {
        background: #ff6fb5;
        color: white;
        border: 0;
        padding: 0.85rem 1.5rem;
        border-radius: 0.5rem;
        font-size: 0.95rem;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        margin-top: 0.4rem;
      }
      .cc-pay:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .cc-error-banner {
        padding: 0.7rem 0.9rem;
        background: rgba(255, 82, 82, 0.08);
        border: 1px solid rgba(255, 82, 82, 0.4);
        color: #ff8585;
        border-radius: 0.4rem;
        font-size: 0.85rem;
      }
      .cc-error {
        padding: 1.5rem;
        background: rgba(255, 82, 82, 0.06);
        border: 1px solid rgba(255, 82, 82, 0.35);
        color: rgba(255, 200, 200, 0.92);
        border-radius: 0.6rem;
        font-size: 0.9rem;
      }
      .cc-error strong {
        display: block;
        margin-bottom: 0.4rem;
        color: #ff8585;
      }
      .cc-error code {
        background: rgba(0, 0, 0, 0.35);
        padding: 0.05rem 0.35rem;
        border-radius: 0.25rem;
      }
      .cc-error a {
        color: #ff6fb5;
      }
      .cc-fineprint {
        font-size: 0.72rem;
        color: rgba(255, 255, 255, 0.45);
        margin: 0;
      }
    `}</style>
  );
}
