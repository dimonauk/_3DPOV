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
import { ROOKERY_EMAILS } from "lib/rookery/emails";
import { sendRookeryEmail } from "lib/rookery/mailer";
import { enqueueRookeryEmail } from "lib/rookery/pending-emails";
import {
  updateSubscriptionStatusByStripeId,
  upsertSubscription,
  type RookeryTierSlug,
} from "lib/rookery/subscriptions";

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
    case "customer.subscription.updated":
      await onSubscriptionUpdated(event);
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

type StripeCheckoutSession = {
  id?: string;
  customer?: string;
  customer_email?: string;
  customer_details?: { email?: string };
  subscription?: string;
  metadata?: Record<string, string>;
};

type StripeSubscriptionObject = {
  id?: string;
  status?: string;
  current_period_end?: number; // unix seconds
};

const VALID_ROOKERY_TIERS = new Set<RookeryTierSlug>([
  "perch",
  "nest",
  "fledge",
]);

function isRookeryTier(v: unknown): v is RookeryTierSlug {
  return typeof v === "string" && VALID_ROOKERY_TIERS.has(v as RookeryTierSlug);
}

/**
 * Fired when Stripe Checkout completes. Routes Rookery tier purchases
 * to the subscription mirror + onboarding emails. Other Checkout
 * Sessions (none yet, but room for the bezel pre-order, the workshop
 * SKUs, etc.) get logged and ignored here.
 */
async function onCheckoutSessionCompleted(event: StripeEvent): Promise<void> {
  const session = event.data?.object as StripeCheckoutSession | undefined;
  const tier = session?.metadata?.rookery_tier;
  if (!isRookeryTier(tier)) {
    log.info("checkout.session.completed with no rookery_tier; skipping", {
      sessionId: session?.id,
      metadataKeys: session?.metadata ? Object.keys(session.metadata) : [],
    });
    return;
  }

  const uid = session?.metadata?.uid;
  const email =
    session?.customer_email ?? session?.customer_details?.email ?? "";
  const stripeCustomerId = session?.customer ?? "";
  const stripeSubscriptionId = session?.subscription ?? null;

  // Subscription mirror — only when we have both a uid (signed-in
  // buyer) and a customer id. Anonymous buyers still get the email
  // sequence via the email path below.
  if (uid && stripeCustomerId) {
    try {
      await upsertSubscription({
        uid,
        tier,
        status: "active",
        stripeCustomerId,
        stripeSubscriptionId,
        currentPeriodEndMs: null, // populated by subscription.updated
        email,
      });
    } catch (err) {
      log.error("upsertSubscription failed in webhook", {
        sessionId: session?.id,
        err: errToObject(err),
      });
    }
  } else {
    log.info("checkout completed without uid; skipping subscription doc", {
      sessionId: session?.id,
      hasCustomer: Boolean(stripeCustomerId),
      hasUid: Boolean(uid),
    });
  }

  // Onboarding email sequence. Welcome (Day 0) fires immediately;
  // Orient (Day 3) and Perch (Day 7) are enqueued for the cron sweep.
  if (email) {
    try {
      await sendRookeryEmail(email, "welcome", {
        idempotencyKey: `rookery-welcome:${session?.id ?? email}`,
      });
    } catch (err) {
      log.error("rookery welcome send failed in webhook", {
        sessionId: session?.id,
        err: errToObject(err),
      });
    }
    const dayMs = 24 * 60 * 60 * 1000;
    for (const e of ROOKERY_EMAILS) {
      if (e.delayDays <= 0) continue;
      try {
        await enqueueRookeryEmail({
          email,
          slug: e.slug,
          sendAfter: Date.now() + e.delayDays * dayMs,
        });
      } catch (err) {
        log.warn("rookery enqueue failed in webhook (already-queued is fine)", {
          slug: e.slug,
          err: errToObject(err),
        });
      }
    }
  }

  log.info("rookery checkout processed", {
    tier,
    uid: uid ?? "(anonymous)",
    sessionId: session?.id,
  });
}

async function onSubscriptionUpdated(event: StripeEvent): Promise<void> {
  const sub = event.data?.object as StripeSubscriptionObject | undefined;
  if (!sub?.id) {
    log.warn("customer.subscription.updated missing id", { eventId: event.id });
    return;
  }
  // Map Stripe statuses onto our smaller enum. We collapse trialing /
  // active into "active"; everything else into a sensible neighbour.
  const status = mapStripeSubscriptionStatus(sub.status);
  await updateSubscriptionStatusByStripeId(sub.id, {
    status,
    currentPeriodEndMs: sub.current_period_end
      ? sub.current_period_end * 1000
      : null,
  });
}

async function onSubscriptionDeleted(event: StripeEvent): Promise<void> {
  const sub = event.data?.object as StripeSubscriptionObject | undefined;
  if (!sub?.id) return;
  await updateSubscriptionStatusByStripeId(sub.id, { status: "canceled" });
}

function mapStripeSubscriptionStatus(s: string | undefined):
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete" {
  switch (s) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "canceled";
    default:
      return "incomplete";
  }
}
