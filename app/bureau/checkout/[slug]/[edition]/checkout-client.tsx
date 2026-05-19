"use client";

/**
 * app/bureau/checkout/[slug]/[edition]/checkout-client.tsx — client side
 * of the drop edition checkout page.
 *
 * Responsibilities:
 *   1. Read the signed-in buyer's entitlement at
 *      `users/{uid}/editions/{slug}-{editionNumber}` via the client
 *      Firestore SDK. Reads are gated by Firestore rules — only the
 *      buyer can read their own entitlement.
 *   2. Surface one of four states:
 *        - "not_signed_in"   → sign-in link with `?next=` callback
 *        - "not_found"       → no entitlement at this id (wrong url,
 *                              wrong account, or claim never ran)
 *        - "pending_payment" → Pay-now button that mints a Stripe
 *                              Checkout Session via
 *                              `POST /api/drops/[slug]/stripe-session`
 *                              and window.locations to the URL it
 *                              returns
 *        - "paid"            → confirmation + COA stub + wallet pass
 *                              download link (stub today)
 *   3. When the page is loaded with `?paid=1` (Stripe's success
 *      redirect), poll the entitlement until the webhook flips
 *      `fulfillmentStatus` to "paid" — usually a couple seconds. Show
 *      a "processing" state in the meantime.
 *
 * Voice register: catalogue. Calm. No flourishes.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";

import { useAuth } from "components/auth/auth-provider";
import { getFirebaseDb } from "lib/firebase/client";

type FulfillmentStatus =
  | "pending-payment"
  | "paid"
  | "shipped"
  | "cancelled";

type EntitlementDoc = {
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

export default function CheckoutClient({
  slug,
  editionNumber,
  variantHint,
  initialPaid,
  stripeSessionId,
}: {
  slug: string;
  editionNumber: number;
  variantHint: string;
  initialPaid: boolean;
  stripeSessionId: string | null;
}) {
  const { user, loading: authLoading, configured } = useAuth();
  const pathname = usePathname();
  const entitlementId = `${slug}-${editionNumber}`;

  const [entitlement, setEntitlement] = useState<EntitlementDoc | null>(null);
  const [entitlementLoading, setEntitlementLoading] = useState(true);
  const [entitlementError, setEntitlementError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // Subscribe to the entitlement doc so the page reacts in real time
  // when the webhook flips it from pending-payment to paid (no manual
  // refresh required). The `firebase/firestore` onSnapshot listener
  // closes itself on unsubscribe.
  useEffect(() => {
    if (!configured || !user) {
      setEntitlementLoading(false);
      setEntitlement(null);
      return;
    }
    const db = getFirebaseDb();
    if (!db) {
      setEntitlementLoading(false);
      setEntitlementError("Firestore is not configured.");
      return;
    }
    const ref = doc(db, "users", user.uid, "editions", entitlementId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setEntitlement(null);
        } else {
          setEntitlement(snap.data() as EntitlementDoc);
        }
        setEntitlementLoading(false);
      },
      (err) => {
        setEntitlementError(err.message || "Couldn’t read your entitlement.");
        setEntitlementLoading(false);
      },
    );
    return () => unsub();
  }, [configured, user, entitlementId]);

  const onPay = async () => {
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
        if (body.error === "stripe_not_configured") {
          setPayError(
            body.message ||
              "Stripe isn’t configured on this deployment yet. Reply to your claim email to settle manually.",
          );
        } else if (body.error === "already_paid") {
          setPayError(
            "This edition is already paid for. Refresh the page to see the confirmation.",
          );
        } else if (body.error === "entitlement_not_found") {
          setPayError(
            "No entitlement found at this edition number. Check that you’re signed in with the same account that claimed it.",
          );
        } else if (body.error === "unauthorized" || body.error === "token_invalid") {
          setPayError("Session expired — please sign in again and retry.");
        } else {
          setPayError(
            body.detail ||
              body.message ||
              body.error ||
              `Couldn’t open the Stripe session (HTTP ${res.status}).`,
          );
        }
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

  // ---- Render states -------------------------------------------------

  if (!configured) {
    return (
      <div className="dcc-notice">
        Checkout isn’t wired in this environment. Firebase config is missing.
        <Styles />
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="dcc-notice dcc-muted">
        Checking your sign-in…
        <Styles />
      </div>
    );
  }

  if (!user) {
    const next = encodeURIComponent(
      pathname ? `${pathname}${initialPaid ? "?paid=1" : ""}` : "/",
    );
    return (
      <div className="dcc-stack">
        <p className="dcc-notice dcc-muted">
          Sign in to settle this edition. We’ll bring you back here as
          soon as you’re in.
        </p>
        <Link href={`/rookery/sign-in?next=${next}`} className="dcc-btn">
          Sign in to continue
        </Link>
        <Styles />
      </div>
    );
  }

  if (entitlementLoading) {
    return (
      <div className="dcc-notice dcc-muted">
        Reading your entitlement…
        <Styles />
      </div>
    );
  }

  if (entitlementError) {
    return (
      <div className="dcc-stack">
        <p className="dcc-error">{entitlementError}</p>
        <Link href={`/drops/${slug}`} className="dcc-link">
          ← Back to the drop
        </Link>
        <Styles />
      </div>
    );
  }

  if (!entitlement) {
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
        <Styles />
      </div>
    );
  }

  const status = entitlement.fulfillmentStatus;

  if (status === "paid" || status === "shipped") {
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
        <Styles />
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="dcc-stack">
        <p className="dcc-error">
          This entitlement is cancelled. If that looks wrong, reply to
          your claim email.
        </p>
        <Link href={`/drops/${slug}`} className="dcc-link">
          ← Back to the drop
        </Link>
        <Styles />
      </div>
    );
  }

  // Default: pending-payment — show pay-now or (if we just came back
  // from Stripe with ?paid=1) a brief processing state while the
  // webhook flips the doc.
  if (initialPaid) {
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
        <Styles />
      </div>
    );
  }

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
      <Styles />
    </div>
  );
}

function formatPaidAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const CSS = `
.dcc-stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.dcc-notice {
  padding: 1rem 1.1rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.9rem;
  line-height: 1.5;
}
.dcc-muted {
  color: rgba(255, 255, 255, 0.7);
}
.dcc-error {
  padding: 0.85rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 130, 130, 0.4);
  background: rgba(255, 82, 82, 0.08);
  color: #ffb5b5;
  font-size: 0.88rem;
  line-height: 1.5;
  margin: 0;
}
.dcc-btn {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  background: #ff6fb5;
  color: #1a0a1a;
  border: 0;
  padding: 0.85rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  font-family: inherit;
}
.dcc-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.dcc-btn-ghost {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  background: transparent;
  color: #ff6fb5;
  border: 1px solid rgba(255, 111, 181, 0.5);
  padding: 0.75rem 1.4rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
  font-family: inherit;
}
.dcc-btn-ghost:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.dcc-link {
  color: #ff6fb5;
  text-decoration: none;
  font-size: 0.88rem;
}
.dcc-link:hover {
  text-decoration: underline;
}
.dcc-fineprint {
  font-size: 0.74rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0.3rem 0 0;
  line-height: 1.5;
}
.dcc-paid {
  background: rgba(60, 200, 120, 0.06);
  border: 1px solid rgba(60, 200, 120, 0.35);
  border-radius: 0.6rem;
  padding: 1.25rem 1.2rem;
}
.dcc-paid-tag {
  display: inline-block;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #6fe8a3;
  background: rgba(60, 200, 120, 0.12);
  border: 1px solid rgba(60, 200, 120, 0.35);
  padding: 0.18rem 0.6rem;
  border-radius: 999px;
  margin-bottom: 0.7rem;
}
.dcc-paid-title {
  font-size: 1.15rem;
  margin: 0 0 0.85rem;
  font-weight: 600;
}
.dcc-meta {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.55rem;
  margin: 0 0 1rem;
}
.dcc-meta > div {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.75);
  border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
  padding-bottom: 0.4rem;
}
.dcc-meta dt {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}
.dcc-meta dd {
  margin: 0;
}
.dcc-meta code {
  background: rgba(0, 0, 0, 0.4);
  padding: 0.08rem 0.35rem;
  border-radius: 0.25rem;
  font-size: 0.78rem;
}
.dcc-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-bottom: 0.5rem;
}
.dcc-processing {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 1.25rem 1.1rem;
  background: rgba(255, 111, 181, 0.06);
  border: 1px solid rgba(255, 111, 181, 0.3);
  border-radius: 0.6rem;
}
.dcc-processing p {
  margin: 0;
  color: rgba(255, 255, 255, 0.85);
}
.dcc-spinner {
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  border: 2px solid rgba(255, 111, 181, 0.25);
  border-top-color: #ff6fb5;
  animation: dcc-spin 0.9s linear infinite;
}
@keyframes dcc-spin {
  to {
    transform: rotate(360deg);
  }
}
.dcc-fineprint code {
  background: rgba(0, 0, 0, 0.35);
  padding: 0.04rem 0.3rem;
  border-radius: 0.22rem;
}
`;

function Styles() {
  return <style dangerouslySetInnerHTML={{ __html: CSS }} />;
}
