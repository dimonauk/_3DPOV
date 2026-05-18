/**
 * app/api/bureau/order/route.ts — POST { quoteRequest, customerEmail, customerName?, shippingAddress? }.
 *
 * Creates a `bureau_orders/{id}` doc + Stripe Payment Intent, returns
 * { orderId, clientSecret } so the client can mount Stripe Elements.
 *
 * Public (anonymous customers can order). Anti-abuse: rate-limit by
 * customer email — 5 attempts per hour per email.
 */

import { NextResponse } from "next/server";

import { createLogger, errToObject } from "lib/log";
import { createFixedWindowLimiter } from "lib/rate-limit/fixed-window";

import { attachPaymentIntent, createOrder } from "lib/bureau/order";
import { quoteFor } from "lib/bureau/quote";
import { createPaymentIntent } from "lib/stripe/server";

import type { CreateOrderRequest, ShippingAddress } from "lib/bureau/types";

export const dynamic = "force-dynamic";

const log = createLogger("api.bureau.order");

const limiter = createFixedWindowLimiter({
  scope: "api.bureau.order",
  limit: 5,
  windowMs: 60 * 60 * 1000,
});

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const input = body as Partial<CreateOrderRequest> & {
    shippingAddress?: ShippingAddress;
  };

  const email = input.customerEmail?.toLowerCase().trim();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "customerEmail required" }, { status: 400 });
  }
  const rate = await limiter.consume(`email:${email}`);
  if (!rate.ok) {
    log.warn("rate limited", { email, resetAt: rate.resetAt });
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }

  if (!input.imageId || !input.sizeChoice || !input.paperChoice || !input.edition) {
    return NextResponse.json(
      { error: "imageId, sizeChoice, paperChoice, edition required" },
      { status: 400 },
    );
  }

  // Recompute the quote server-side. The price the client offered is
  // ignored — quoteFor() is the source of truth.
  const quoteResult = quoteFor({
    imageId: input.imageId,
    sizeChoice: input.sizeChoice,
    paperChoice: input.paperChoice,
    edition: input.edition,
  });
  if (!quoteResult.ok) {
    return NextResponse.json({ error: quoteResult.error }, { status: 400 });
  }
  const quote = quoteResult.quote;

  let createResult;
  try {
    createResult = await createOrder({
      imageId: input.imageId,
      sizeChoice: input.sizeChoice,
      paperChoice: input.paperChoice,
      edition: input.edition,
      quoteId: quote.quoteId,
      customerEmail: email,
      customerName: input.customerName,
      shippingAddress: input.shippingAddress,
      priceGbp: quote.priceGbp,
    });
  } catch (err) {
    log.error("createOrder failed", { err: errToObject(err) });
    return NextResponse.json({ error: "order creation failed" }, { status: 500 });
  }

  let pi;
  try {
    pi = await createPaymentIntent({
      amount: quote.priceGbp,
      currency: "gbp",
      description: `Bureau order ${createResult.orderId} (${quote.sizeLabel}, ${quote.editionLabel})`,
      metadata: { orderId: createResult.orderId, kind: "bureau" },
      receiptEmail: email,
      automaticPaymentMethods: true,
    });
  } catch (err) {
    log.error("createPaymentIntent failed", {
      orderId: createResult.orderId,
      err: errToObject(err),
    });
    return NextResponse.json(
      {
        orderId: createResult.orderId,
        error: "stripe unavailable — order saved but cannot be paid yet",
      },
      { status: 503 },
    );
  }

  await attachPaymentIntent(createResult.orderId, pi.id);
  log.info("order ready for payment", {
    orderId: createResult.orderId,
    ip: clientIp(req),
  });

  return NextResponse.json(
    {
      ok: true,
      orderId: createResult.orderId,
      clientSecret: pi.clientSecret,
      paymentIntentId: pi.id,
    },
    { status: 200 },
  );
}
