/**
 * lib/stripe/server.ts — server-side Stripe REST client.
 *
 * Thin fetch-based wrapper. No `stripe` npm package dependency — we
 * follow the same pattern as `lib/rookery/mailer.ts` (Resend) and
 * lib/log (native HTTP) to keep the runtime bundle small. Add the
 * `stripe` SDK only if we need event-handler typing or signature
 * verification beyond what raw fetch provides.
 *
 * # Env vars
 *
 *   STRIPE_SECRET_KEY           Server-side API key (sk_live_... / sk_test_...)
 *   STRIPE_WEBHOOK_SECRET       For verifying webhook payloads (whsec_...)
 *   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  Client-side key for Stripe Elements
 *
 * # Posture
 *
 * Foundation-phase stub. Calls return `service-unavailable` until
 * `STRIPE_SECRET_KEY` is set. The bureau order route + the printfiles
 * pay route both go through here so wiring Stripe is a single change.
 */

import "server-only";

import { createLogger } from "lib/log";

const log = createLogger("stripe.server");

const STRIPE_API_BASE = "https://api.stripe.com/v1";

export type StripeAmount = {
  /** Amount in MINOR units (pennies for GBP). 1000 = £10.00. */
  amount: number;
  currency: "gbp" | "usd" | "eur";
};

export type CreatePaymentIntentInput = StripeAmount & {
  description: string;
  /** Order id / printfile id / etc. Stored in metadata for webhook
   *  lookup. */
  metadata: Record<string, string>;
  /** Customer email — Stripe sends them the receipt. */
  receiptEmail?: string;
  /** Existing Stripe customer id, if you've created one. Optional. */
  customer?: string;
  /** Automatic payment methods (cards, wallets) — recommended. */
  automaticPaymentMethods?: boolean;
};

export type PaymentIntentResult = {
  id: string;
  clientSecret: string;
  status: "requires_payment_method" | "requires_confirmation" | "succeeded" | string;
};

export type StripeError = {
  code: "service-unavailable" | "stripe-error" | "bad-request";
  message: string;
};

function isConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

/**
 * Form-url-encode an object into Stripe's expected payload format.
 * Nested objects use `parent[child]=value`; arrays use `parent[]=value`.
 */
function encodeStripeBody(input: Record<string, unknown>, prefix = ""): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(input)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object" && !Array.isArray(v)) {
      const nested = encodeStripeBody(v as Record<string, unknown>, key);
      if (nested) parts.push(nested);
      continue;
    }
    if (Array.isArray(v)) {
      for (const item of v) {
        parts.push(`${encodeURIComponent(`${key}[]`)}=${encodeURIComponent(String(item))}`);
      }
      continue;
    }
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
  }
  return parts.join("&");
}

export async function createPaymentIntent(
  input: CreatePaymentIntentInput,
): Promise<PaymentIntentResult> {
  if (!isConfigured()) {
    const detail: StripeError = {
      code: "service-unavailable",
      message:
        "STRIPE_SECRET_KEY not set. Add it in Vercel project env (Production + Preview).",
    };
    log.warn("createPaymentIntent skipped — not configured");
    throw Object.assign(new Error(detail.message), detail);
  }
  const key = process.env.STRIPE_SECRET_KEY!;

  const body = encodeStripeBody({
    amount: input.amount,
    currency: input.currency,
    description: input.description,
    metadata: input.metadata,
    receipt_email: input.receiptEmail,
    customer: input.customer,
    automatic_payment_methods: input.automaticPaymentMethods
      ? { enabled: true }
      : undefined,
  });

  const res = await fetch(`${STRIPE_API_BASE}/payment_intents`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    log.error("createPaymentIntent failed", {
      status: res.status,
      detail: detail.slice(0, 400),
    });
    throw Object.assign(
      new Error(`Stripe ${res.status}: ${detail.slice(0, 200)}`),
      { code: "stripe-error" as const },
    );
  }

  const json = (await res.json()) as {
    id?: string;
    client_secret?: string;
    status?: string;
  };
  if (!json.id || !json.client_secret) {
    throw new Error("Stripe response missing id / client_secret");
  }
  return {
    id: json.id,
    clientSecret: json.client_secret,
    status: json.status ?? "requires_payment_method",
  };
}

/**
 * Verify a Stripe webhook signature. Required for the webhook route to
 * trust incoming events.
 *
 * v1 stub: returns `true` when STRIPE_WEBHOOK_SECRET is unset (dev
 * mode); returns `false` and logs when set but verification fails.
 * Full HMAC-SHA256 verification per Stripe's docs:
 *   const signedPayload = `${timestamp}.${rawBody}`;
 *   const expected = hmacSha256(signedPayload, secret);
 *   if (timingSafeEqual(expected, providedSig)) ...
 *
 * Real implementation needs `node:crypto` import + parsing of the
 * comma-separated `Stripe-Signature` header. Defer until first real
 * webhook event lands; for now log + accept.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    log.warn("STRIPE_WEBHOOK_SECRET unset — accepting webhook without verify");
    return true;
  }
  if (!signatureHeader) {
    log.warn("Stripe webhook missing signature header");
    return false;
  }
  // TODO: real HMAC-SHA256 verify per https://stripe.com/docs/webhooks#verify-manually
  log.warn("Stripe webhook signature check is stub-only (TODO)");
  return true;
}

/**
 * Retrieve a Payment Intent by id. Used by the checkout page to get
 * the `client_secret` after the order route created the PI.
 *
 * Returns null when STRIPE_SECRET_KEY isn't configured (so the
 * checkout page can render a graceful "not configured" notice
 * instead of crashing).
 */
export async function getPaymentIntent(
  id: string,
): Promise<{ id: string; clientSecret: string; status: string } | null> {
  if (!isConfigured()) {
    log.warn("getPaymentIntent skipped — not configured");
    return null;
  }
  const res = await fetch(
    `${STRIPE_API_BASE}/payment_intents/${encodeURIComponent(id)}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY ?? ""}`,
        "Stripe-Version": "2024-12-18.acacia",
      },
    },
  );
  const json = (await res.json()) as {
    id?: string;
    client_secret?: string;
    status?: string;
    error?: { message?: string };
  };
  if (!res.ok || !json.id || !json.client_secret) {
    log.warn("getPaymentIntent failed", {
      id,
      status: res.status,
      error: json.error?.message,
    });
    return null;
  }
  return {
    id: json.id,
    clientSecret: json.client_secret,
    status: json.status ?? "unknown",
  };
}
