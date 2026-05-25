"use client";

/**
 * app/bureau/checkout/[slug]/[edition]/checkout/states.tsx
 *
 * One small component per render branch in the checkout state
 * machine. The orchestrator picks which to render; each branch is
 * presentational only. The CheckoutStyles tag is included in each
 * top-level wrapper so the surface renders correctly when rendered
 * standalone (e.g. in Storybook later).
 */

import Link from "next/link";

import { formatPaidAt } from "./format";
import { CheckoutStyles } from "./styles";
import type { EntitlementDoc } from "./types";

export function NotConfigured() {
  return (
    <div className="dcc-notice">
      Checkout isn’t wired in this environment. Firebase config is missing.
      <CheckoutStyles />
    </div>
  );
}

export function AuthLoading() {
  return (
    <div className="dcc-notice dcc-muted">
      Checking your sign-in…
      <CheckoutStyles />
    </div>
  );
}

export function SignInPrompt({ next }: { next: string }) {
  return (
    <div className="dcc-stack">
      <p className="dcc-notice dcc-muted">
        Sign in to settle this edition. We’ll bring you back here as
        soon as you’re in.
      </p>
      <Link href={`/rookery/sign-in?next=${next}`} className="dcc-btn">
        Sign in to continue
      </Link>
      <CheckoutStyles />
    </div>
  );
}

export function EntitlementLoading() {
  return (
    <div className="dcc-notice dcc-muted">
      Reading your entitlement…
      <CheckoutStyles />
    </div>
  );
}

export function EntitlementError({
  message,
  slug,
}: {
  message: string;
  slug: string;
}) {
  return (
    <div className="dcc-stack">
      <p className="dcc-error">{message}</p>
      <Link href={`/drops/${slug}`} className="dcc-link">
        ← Back to the drop
      </Link>
      <CheckoutStyles />
    </div>
  );
}

export function EntitlementMissing({
  variantHint,
  slug,
}: {
  variantHint: string;
  slug: string;
}) {
  return (
    <div className="dcc-stack">
      <p className="dcc-notice dcc-muted">
        No entitlement found for {variantHint}. Either the claim never
        went through, or you’re signed in with a different account
        than the one that claimed it.
      </p>
      <Link href={`/drops/${slug}`} className="dcc-link">
        ← Back to the drop
      </Link>
      <CheckoutStyles />
    </div>
  );
}

export function PaidState({
  entitlement,
  variantHint,
  entitlementId,
}: {
  entitlement: EntitlementDoc;
  variantHint: string;
  entitlementId: string;
}) {
  return (
    <div className="dcc-stack">
      <div className="dcc-paid">
        <span className="dcc-paid-tag">Paid</span>
        <h2 className="dcc-paid-title">Your edition is yours.</h2>
        <dl className="dcc-meta">
          <div>
            <dt>Edition</dt>
            <dd>{variantHint}</dd>
          </div>
          <div>
            <dt>Reference</dt>
            <dd>
              <code>{entitlementId}</code>
            </dd>
          </div>
          {entitlement.paidAt ? (
            <div>
              <dt>Paid at</dt>
              <dd>{formatPaidAt(entitlement.paidAt)}</dd>
            </div>
          ) : null}
          {entitlement.stripePaymentIntentId ? (
            <div>
              <dt>Stripe PI</dt>
              <dd>
                <code>{entitlement.stripePaymentIntentId}</code>
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="dcc-actions">
          <button
            type="button"
            className="dcc-btn"
            disabled
            title="Apple Wallet pass download lands when the wallet route is wired."
          >
            Add to Apple Wallet (soon)
          </button>
          <button
            type="button"
            className="dcc-btn-ghost"
            disabled
            title="The certificate-of-authenticity PDF lands when the COA route is wired."
          >
            Download COA (soon)
          </button>
        </div>
        <p className="dcc-fineprint">
          We’ll email you when the physical edition ships. The Wallet
          pass and certificate land here as soon as the wallet pipeline
          is live.
        </p>
      </div>
      <CheckoutStyles />
    </div>
  );
}

export function CancelledState({ slug }: { slug: string }) {
  return (
    <div className="dcc-stack">
      <p className="dcc-error">
        This entitlement is cancelled. If that looks wrong, reply to
        your claim email.
      </p>
      <Link href={`/drops/${slug}`} className="dcc-link">
        ← Back to the drop
      </Link>
      <CheckoutStyles />
    </div>
  );
}

export function ProcessingState({
  stripeSessionId,
}: {
  stripeSessionId: string | null;
}) {
  return (
    <div className="dcc-stack">
      <div className="dcc-processing">
        <span className="dcc-spinner" aria-hidden />
        <p>Payment received — confirming with our records…</p>
        <p className="dcc-fineprint">
          Stripe says you’re done. We’re waiting for the webhook to
          land. This page updates itself as soon as it does — usually
          a couple seconds.
          {stripeSessionId ? (
            <>
              {" "}
              <span>
                Session: <code>{stripeSessionId}</code>
              </span>
            </>
          ) : null}
        </p>
      </div>
      <CheckoutStyles />
    </div>
  );
}

export function PayNowState({
  paying,
  payError,
  onPay,
}: {
  paying: boolean;
  payError: string | null;
  onPay: () => void;
}) {
  return (
    <div className="dcc-stack">
      <p className="dcc-notice dcc-muted">
        Your slot is reserved. Settle via Stripe to finalise the
        edition.
      </p>
      <button
        type="button"
        onClick={onPay}
        disabled={paying}
        className="dcc-btn"
      >
        {paying ? "Opening Stripe…" : "Pay now via Stripe"}
      </button>
      {payError ? <p className="dcc-error">{payError}</p> : null}
      <p className="dcc-fineprint">
        Card processed by Stripe — Holoflow never sees your card
        details. You can come back to this URL at any time to retry the
        payment.
      </p>
      <CheckoutStyles />
    </div>
  );
}
