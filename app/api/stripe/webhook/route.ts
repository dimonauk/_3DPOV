/**
 * app/api/stripe/webhook/route.ts — Stripe webhook receiver.
 *
 * Routes `payment_intent.succeeded` (and friends) to the right order:
 *   - metadata.kind = "bureau"     → mark bureau order paid, queue ship
 *   - metadata.kind = "printfile"  → mark printfile order paid, forward
 *                                     to print farm
 *
 * # Setup on Stripe side
 *
 *   1. https://dashboard.stripe.com/webhooks → "Add endpoint"
 *   2. URL: https://holoflow.co.uk/api/stripe/webhook
 *   3. Events:
 *      - payment_intent.succeeded
 *      - payment_intent.payment_failed
 *      - charge.refunded
 *   4. Copy signing secret → Vercel env STRIPE_WEBHOOK_SECRET
 *
 * # Posture
 *
 * Foundation-phase: routes events to the right handler but the
 * handlers themselves are stubs until the upstream flows
 * (printfile farm quote API, bureau Royal Mail integration) land.
 */

import { NextResponse } from "next/server";

import { createLogger, errToObject } from "lib/log";

import { verifyWebhookSignature } from "lib/stripe/server";
import {
  getOrder,
  transitionStatus as transitionBureauStatus,
} from "lib/bureau/order";
import {
  sendCustomerReceipt,
  sendOperatorNotification,
} from "lib/bureau/order-emails";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "lib/firebase/admin";
import { sendRookeryEmail } from "lib/rookery/mailer";

export const dynamic = "force-dynamic";

const log = createLogger("api.stripe.webhook");

type StripeEvent = {
  id: string;
  type: string;
  data?: { object?: Record<string, unknown> };
};

export async function POST(req: Request): Promise<Response> {
  // Need the raw body for signature verification.
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!verifyWebhookSignature(rawBody, sig)) {
    log.warn("signature verification failed");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  log.info("stripe event received", { id: event.id, type: event.type });

  switch (event.type) {
    case "payment_intent.succeeded":
      await onPaymentIntentSucceeded(event);
      break;
    case "payment_intent.payment_failed":
      await onPaymentIntentFailed(event);
      break;
    case "charge.refunded":
      await onChargeRefunded(event);
      break;
    case "checkout.session.completed":
      await onCheckoutSessionCompleted(event);
      break;
    case "customer.subscription.deleted":
      await onSubscriptionDeleted(event);
      break;
    default:
      log.info("event type not handled", { type: event.type });
  }

  return NextResponse.json({ received: true });
}

async function onPaymentIntentSucceeded(event: StripeEvent): Promise<void> {
  const pi = event.data?.object as
    | {
        id?: string;
        metadata?: Record<string, string>;
        receipt_email?: string;
      }
    | undefined;
  if (!pi?.id) {
    log.warn("payment_intent.succeeded missing id", { eventId: event.id });
    return;
  }
  const orderId = pi.metadata?.orderId;
  const kind = pi.metadata?.kind;
  if (!orderId || !kind) {
    log.warn("metadata missing orderId/kind", { paymentIntentId: pi.id });
    return;
  }

  try {
    if (kind === "bureau") {
      const order = await transitionBureauStatus(
        orderId,
        "paid",
        "stripe-webhook",
        `Payment Intent ${pi.id} succeeded${pi.receipt_email ? " for " + pi.receipt_email : ""}.`,
      );
      log.info("bureau order marked paid", { orderId });

      // Best-effort emails — never block the webhook response on these.
      // The order doc is the canonical source of truth either way.
      // Re-read the doc so the email sees the just-applied paidAt +
      // stripePaymentIntentId fields.
      const enriched = (await getOrder(orderId)) ?? order;
      const [custResult, opResult] = await Promise.all([
        sendCustomerReceipt(enriched).catch((err) => ({
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        })),
        sendOperatorNotification(enriched).catch((err) => ({
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        })),
      ]);
      log.info("bureau emails dispatched", {
        orderId,
        customer: custResult.ok ? "sent" : custResult.error,
        operator: opResult.ok ? "sent" : opResult.error,
      });
    } else if (kind === "printfile") {
      // TODO: hand off to printfile-engine farm forwarder
      log.info("printfile order paid (forwarder TODO)", { orderId });
    } else {
      log.warn("unknown order kind", { orderId, kind });
    }
  } catch (err) {
    log.error("onPaymentIntentSucceeded handler failed", {
      orderId,
      err: errToObject(err),
    });
  }
}

async function onPaymentIntentFailed(event: StripeEvent): Promise<void> {
  const pi = event.data?.object as { id?: string; metadata?: Record<string, string> } | undefined;
  log.warn("payment_intent.payment_failed", {
    paymentIntentId: pi?.id,
    orderId: pi?.metadata?.orderId,
  });
  // TODO: notify operator + customer; let them retry from the order page.
}

async function onChargeRefunded(event: StripeEvent): Promise<void> {
  const charge = event.data?.object as
    | { id?: string; payment_intent?: string }
    | undefined;
  log.info("charge.refunded", {
    chargeId: charge?.id,
    paymentIntentId: charge?.payment_intent,
  });
  // TODO: lookup order by PI id, transition status to "refunded",
  // notify operator. Skip if order is already shipped (operator handles
  // refund-after-ship manually because of return logistics).
}

/**
 * Grant Rookery access after a successful Checkout Session.
 *
 * Fired for both one-time (Fledge) and subscription (Perch, Nest) payments.
 * We write the subscription record to Firestore and set a Firebase Auth
 * custom claim so subsequent ID token refreshes carry the tier.
 */
async function onCheckoutSessionCompleted(event: StripeEvent): Promise<void> {
  const session = event.data?.object as
    | {
        id?: string;
        customer_email?: string;
        customer_details?: { email?: string };
        metadata?: Record<string, string>;
        subscription?: string;
      }
    | undefined;

  const kind = session?.metadata?.kind;
  if (kind !== "rookery") {
    // Not a Rookery checkout — handled by payment_intent.succeeded instead.
    return;
  }

  const email = session?.customer_email ?? session?.customer_details?.email;
  const tierSlug = session?.metadata?.tierSlug ?? "perch";
  const sessionId = session?.id ?? "unknown";
  const subscriptionId = session?.subscription;

  log.info("rookery checkout.session.completed", { email, tierSlug, sessionId });

  // 1. Write Firestore subscription record (keyed by email — no uid yet).
  const db = getFirebaseAdminDb();
  if (db && email) {
    try {
      await db.collection("rookery_subscriptions").doc(email).set(
        {
          tier: tierSlug,
          status: "active",
          stripeSessionId: sessionId,
          stripeSubscriptionId: subscriptionId ?? null,
          grantedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      log.info("rookery subscription written to Firestore", { email, tier: tierSlug });
    } catch (err) {
      log.error("Firestore write failed for rookery subscription", {
        email,
        err: errToObject(err),
      });
    }
  }

  // 2. Set Firebase Auth custom claim on the user (if account exists).
  const auth = getFirebaseAdminAuth();
  if (auth && email) {
    try {
      const user = await auth.getUserByEmail(email);
      await auth.setCustomUserClaims(user.uid, { rookeryTier: tierSlug });
      log.info("rookery custom claim set", { uid: user.uid, tier: tierSlug });
    } catch (err) {
      // User may not have a Firebase account yet — they might sign up later.
      // The Firestore record is the fallback truth source.
      log.warn("could not set custom claim (user may not exist yet)", {
        email,
        err: errToObject(err),
      });
    }
  }

  // 3. Send welcome email via rookery mailer.
  if (email) {
    try {
      await sendRookeryEmail({
        to: email,
        slug: "welcome",
        vars: { tier: tierSlug },
      });
      log.info("rookery welcome email sent", { email });
    } catch (err) {
      log.warn("welcome email failed", { email, err: errToObject(err) });
    }
  }
}

/**
 * Revoke Rookery access when a subscription is cancelled.
 */
async function onSubscriptionDeleted(event: StripeEvent): Promise<void> {
  const sub = event.data?.object as
    | { id?: string; customer?: string; metadata?: Record<string, string> }
    | undefined;

  log.info("customer.subscription.deleted", { subscriptionId: sub?.id });

  const db = getFirebaseAdminDb();
  if (!db || !sub?.id) return;

  // Find the subscription record by Stripe subscription ID.
  try {
    const snapshot = await db
      .collection("rookery_subscriptions")
      .where("stripeSubscriptionId", "==", sub.id)
      .limit(1)
      .get();

    if (snapshot.empty) {
      log.warn("no Firestore record for deleted subscription", { subscriptionId: sub.id });
      return;
    }

    const doc = snapshot.docs[0];
    const email = doc.id;
    await doc.ref.update({ status: "cancelled", updatedAt: new Date().toISOString() });
    log.info("rookery subscription marked cancelled", { email, subscriptionId: sub.id });

    // Remove custom claim.
    const auth = getFirebaseAdminAuth();
    if (auth && email) {
      const user = await auth.getUserByEmail(email).catch(() => null);
      if (user) {
        await auth.setCustomUserClaims(user.uid, { rookeryTier: null });
      }
    }
  } catch (err) {
    log.error("onSubscriptionDeleted failed", { err: errToObject(err) });
  }
}
