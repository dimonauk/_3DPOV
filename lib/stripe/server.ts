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

import { createHmac, timingSafeEqual } from "node:crypto";

import { createLogger } from "lib/log";

const log = createLogger("stripe.server");

/** Tolerance window for the `t=` timestamp in the signature header.
 *  Stripe's official recommendation: 5 minutes. Wider = more replay
 *  surface; narrower = false negatives from clock skew. */
const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

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
      for (let i = 0; i < v.length; i++) {
        const item = v[i];
        if (item !== null && typeof item === "object") {
          // Stripe expects line_items[0][price]=...&line_items[0][quantity]=1
          const nested = encodeStripeBody(
            item as Record<string, unknown>,
            `${key}[${i}]`,
          );
          if (nested) parts.push(nested);
        } else {
          parts.push(
            `${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(String(item))}`,
          );
        }
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
 * Parse the comma-separated `Stripe-Signature` header into a typed
 * envelope: `t=<unix-seconds>,v1=<hex>,v1=<hex>,...`. Multiple `v1`
 * signatures can be present (during key rotation Stripe sends both);
 * we accept the first that matches.
 */
type StripeSignatureEnvelope = {
  timestamp: number;
  /** Hex-encoded SHA-256 HMAC signatures. May have multiple during rotation. */
  signatures: string[];
};

function parseSignatureHeader(header: string): StripeSignatureEnvelope | null {
  const parts = header.split(",");
  let timestamp: number | null = null;
  const signatures: string[] = [];
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k === "t") {
      const n = Number(v);
      if (Number.isFinite(n)) timestamp = n;
    } else if (k === "v1") {
      signatures.push(v);
    }
    // Stripe also emits `v0` for some legacy events; we don't support
    // them (v0 has known weaknesses) — caller's loud-fail is the
    // right posture here.
  }
  if (timestamp === null || signatures.length === 0) return null;
  return { timestamp, signatures };
}

/**
 * Constant-time hex string comparison. Wraps timingSafeEqual to avoid
 * the early-exit timing leak from `===`.
 */
function safeHexEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    // Malformed hex (uneven length, non-hex chars) — equivalent to mismatch.
    return false;
  }
}

/**
 * Verify a Stripe webhook signature.
 *
 * Implements the verification scheme documented at
 * https://stripe.com/docs/webhooks#verify-manually:
 *   1. Parse the `Stripe-Signature` header into `t=<ts>,v1=<sig>,...`
 *   2. Build the signed payload: `${timestamp}.${rawBody}`
 *   3. HMAC-SHA256 with the webhook secret
 *   4. Constant-time-compare against the v1 signature(s) from the header
 *   5. Reject if the timestamp is older than the tolerance (replay guard)
 *
 * Returns true ONLY when the signature is valid AND the timestamp is
 * within tolerance.
 *
 * Posture when secret is unset:
 *   - In production (NODE_ENV=production): returns false + logs.
 *     Forces the operator to set the secret before any webhook is
 *     trusted.
 *   - In other envs: returns true + logs. Local dev with Stripe CLI
 *     `stripe listen --forward-to` is the usual use case; setting
 *     `STRIPE_WEBHOOK_SKIP_VERIFY=1` is an explicit dev escape hatch
 *     when you really need to accept unsigned calls.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  now: number = Math.floor(Date.now() / 1000),
): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const skip = process.env.STRIPE_WEBHOOK_SKIP_VERIFY === "1";
  const isProd = process.env.NODE_ENV === "production";

  if (!secret) {
    if (skip) {
      log.warn("Stripe webhook secret unset, SKIP_VERIFY=1 — accepting");
      return true;
    }
    if (isProd) {
      log.error("STRIPE_WEBHOOK_SECRET unset in production — rejecting");
      return false;
    }
    log.warn("STRIPE_WEBHOOK_SECRET unset (non-prod) — accepting; set it before deploying");
    return true;
  }

  if (!signatureHeader) {
    log.warn("Stripe webhook missing Stripe-Signature header");
    return false;
  }

  const envelope = parseSignatureHeader(signatureHeader);
  if (!envelope) {
    log.warn("Stripe webhook signature header malformed", {
      preview: signatureHeader.slice(0, 80),
    });
    return false;
  }

  const age = now - envelope.timestamp;
  if (age > SIGNATURE_TOLERANCE_SECONDS) {
    log.warn("Stripe webhook timestamp outside tolerance", {
      ageSeconds: age,
      tolerance: SIGNATURE_TOLERANCE_SECONDS,
    });
    return false;
  }
  if (age < -SIGNATURE_TOLERANCE_SECONDS) {
    log.warn("Stripe webhook timestamp in the future", { ageSeconds: age });
    return false;
  }

  const signedPayload = `${envelope.timestamp}.${rawBody}`;
  const expected = createHmac("sha256", secret).update(signedPayload).digest("hex");

  for (const provided of envelope.signatures) {
    if (safeHexEqual(provided, expected)) return true;
  }
  log.warn("Stripe webhook signature mismatch", {
    signaturesChecked: envelope.signatures.length,
  });
  return false;
}

export type CreateCheckoutSessionInput = {
  /**
   * Existing Stripe Price id (`price_...`). Configured in env per
   * tier — see app/api/stripe/checkout/route.ts.
   */
  priceId: string;
  /**
   * "subscription" for recurring tiers; "payment" for one-off
   * (Fledge founding-member). Stripe rejects mismatches against the
   * price's billing mode at session-create time.
   */
  mode: "subscription" | "payment";
  successUrl: string;
  cancelUrl: string;
  /** Customer email, used to prefill checkout. Optional. */
  customerEmail?: string;
  /** Order / tier metadata stored on the session for the webhook. */
  metadata?: Record<string, string>;
  /** Whether to allow promotion codes at checkout. */
  allowPromotionCodes?: boolean;
};

export type CheckoutSessionResult = {
  id: string;
  url: string;
};

/**
 * Create a Stripe Checkout Session. Returns the hosted-checkout URL
 * the caller redirects the buyer to. Used by Rookery tier signup +
 * any other "single SKU, hosted checkout" flow.
 *
 * Throws when STRIPE_SECRET_KEY isn't set; caller decides whether
 * to surface a 503 or fall through to a different signup path.
 */
export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<CheckoutSessionResult> {
  if (!isConfigured()) {
    const detail: StripeError = {
      code: "service-unavailable",
      message:
        "STRIPE_SECRET_KEY not set. Add it in Vercel project env (Production + Preview).",
    };
    log.warn("createCheckoutSession skipped — not configured");
    throw Object.assign(new Error(detail.message), detail);
  }
  const key = process.env.STRIPE_SECRET_KEY!;

  const body = encodeStripeBody({
    mode: input.mode,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    customer_email: input.customerEmail,
    metadata: input.metadata,
    allow_promotion_codes: input.allowPromotionCodes ? "true" : undefined,
    line_items: [
      {
        price: input.priceId,
        quantity: 1,
      },
    ],
  });

  const res = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    log.error("createCheckoutSession failed", {
      status: res.status,
      detail: detail.slice(0, 400),
    });
    throw Object.assign(
      new Error(`Stripe ${res.status}: ${detail.slice(0, 200)}`),
      { code: "stripe-error" as const },
    );
  }

  const json = (await res.json()) as { id?: string; url?: string };
  if (!json.id || !json.url) {
    throw new Error("Stripe response missing id / url");
  }
  return { id: json.id, url: json.url };
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
