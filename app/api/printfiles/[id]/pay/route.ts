/**
 * app/api/printfiles/[id]/pay/route.ts — payment intent for a printfile order.
 *
 * Customer hits this from the gracious-reply link after they've
 * received the quote. POST { shippingAddress } → creates a Stripe
 * Payment Intent tagged with `metadata.kind=printfile` so the
 * Stripe webhook routes the success event to the printfile
 * fulfilment handler.
 *
 * # Posture
 *
 * Stub until the quoting layer lands per the SHIP-PLAN Phase 1.2.
 * Currently:
 *   - Validates orderId exists in `printfile_orders/`
 *   - Validates status is "received" or "queued" (not already paid /
 *     shipped)
 *   - Returns 501 with explanatory body if no farm provider returns
 *     a quote (manual provider doesn't quote yet)
 *
 * When Slant3D / Treatstock quote APIs are wired the route returns
 * { clientSecret, paymentIntentId, quote } and the customer's frontend
 * mounts Stripe Elements to confirm.
 */

import { NextResponse } from "next/server";

import { requireFirebaseAdminDb } from "lib/firebase/admin";
import { createLogger, errToObject } from "lib/log";
import { createFixedWindowLimiter } from "lib/rate-limit/fixed-window";

import { resolveProvider } from "lib/printfarm";
import {
  FIRESTORE_COLLECTION,
  type PrintfilesOrder,
} from "lib/printfiles/types";
import { createPaymentIntent } from "lib/stripe/server";

export const dynamic = "force-dynamic";

const log = createLogger("api.printfiles.pay");

const limiter = createFixedWindowLimiter({
  scope: "api.printfiles.pay",
  limit: 5,
  windowMs: 60 * 60 * 1000,
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await ctx.params;

  let body: {
    shippingAddress?: {
      name?: string;
      line1?: string;
      line2?: string;
      city?: string;
      postcode?: string;
      country?: string;
    };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const ship = body.shippingAddress;
  if (
    !ship?.line1 ||
    !ship?.city ||
    !ship?.postcode ||
    !ship?.country
  ) {
    return NextResponse.json(
      {
        error:
          "shippingAddress { line1, city, postcode, country } required",
      },
      { status: 400 },
    );
  }

  const db = requireFirebaseAdminDb();
  const snap = await db.collection(FIRESTORE_COLLECTION).doc(id).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "order not found" }, { status: 404 });
  }
  const order = snap.data() as PrintfilesOrder;
  if (order.status !== "received" && order.status !== "queued") {
    return NextResponse.json(
      {
        error: `cannot pay from status "${order.status}"`,
        requires: "received | queued",
      },
      { status: 409 },
    );
  }

  // Rate-limit by sender (not by IP — payment links can be opened from
  // a different device than the email arrived to).
  const rate = await limiter.consume(`order:${id}`);
  if (!rate.ok) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }

  const provider = resolveProvider();
  // TODO: provider.getQuote(order) — only implemented in slant3d /
  // treatstock providers; manual returns null and we use a sentinel
  // "operator will reply with a quote" path.
  if (provider.id === "manual") {
    log.info("payment requested but manual provider has no quote API", { orderId: id });
    return NextResponse.json(
      {
        error: "no automated quote available",
        explanation:
          "This order is being handled manually. The operator will reply " +
          "to your original email with a quote + payment link.",
      },
      { status: 501 },
    );
  }

  // For API providers: quote first, then create PI for that price.
  // Stub: use a placeholder price until the provider's quote API is
  // wired. Customer sees a clear "we'll confirm" message in the
  // gracious reply, so this won't accidentally take real payments at
  // a wrong price.
  const placeholderPence = 0;
  if (placeholderPence === 0) {
    log.warn("provider quote API not yet wired", { orderId: id, provider: provider.id });
    return NextResponse.json(
      {
        error: "quote-api-not-wired",
        provider: provider.id,
        explanation:
          "The chosen print farm doesn't have its quote API wired yet. " +
          "Operator will reply to your email shortly.",
      },
      { status: 501 },
    );
  }

  let pi;
  try {
    pi = await createPaymentIntent({
      amount: placeholderPence,
      currency: "gbp",
      description: `Printfile ${id} via ${provider.id}`,
      metadata: { orderId: id, kind: "printfile", provider: provider.id },
      receiptEmail: order.sender.address,
      automaticPaymentMethods: true,
    });
  } catch (err) {
    log.error("createPaymentIntent failed", { orderId: id, err: errToObject(err) });
    return NextResponse.json({ error: "stripe unavailable" }, { status: 503 });
  }

  await db.collection(FIRESTORE_COLLECTION).doc(id).update({
    "shipping": ship,
    "paymentIntentId": pi.id,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({
    ok: true,
    orderId: id,
    clientSecret: pi.clientSecret,
    paymentIntentId: pi.id,
  });
}
