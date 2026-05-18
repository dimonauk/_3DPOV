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
import { transitionStatus as transitionBureauStatus } from "lib/bureau/order";

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
      await transitionBureauStatus(
        orderId,
        "paid",
        "stripe-webhook",
        `Payment Intent ${pi.id} succeeded${pi.receipt_email ? " for " + pi.receipt_email : ""}.`,
      );
      // TODO: trigger fulfilment — queue the print job at the studio's
      // Pro-1100, send confirmation email, attach to operator queue.
      log.info("bureau order marked paid", { orderId });
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
