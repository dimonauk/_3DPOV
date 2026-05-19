/**
 * POST /api/drops/[slug]/stripe-session — mint a Stripe Checkout Session
 * for an already-claimed drop entitlement.
 *
 * Body: { editionNumber: number }
 * Auth: Authorization: Bearer <Firebase ID token>
 *
 * Flow:
 *   1. Verify the buyer's Firebase ID token.
 *   2. Look up the user's entitlement at
 *      `users/{uid}/editions/{slug}-{editionNumber}` — must exist and
 *      must currently be in `fulfillmentStatus: "pending-payment"`. If
 *      it's already paid, return the existing Checkout Session URL or a
 *      flag the client can use to redirect to the confirmation view.
 *   3. Read the drop record (needed for the description + parentage).
 *   4. Price the line item by variant:
 *        - unique  → STRIPE_DROP_UNIQUE_AMOUNT_GBP  (default 1400p)
 *        - limited → STRIPE_DROP_LIMITED_AMOUNT_GBP (default 350p)
 *        - open    → STRIPE_DROP_OPEN_AMOUNT_GBP    (default 80p)
 *      If `STRIPE_PRICE_DROP_<VARIANT>` is set (a Stripe-managed Price
 *      id), use that instead — the price-id branch is preferred for
 *      production because it carries tax + accounting metadata.
 *   5. POST to Stripe REST `/v1/checkout/sessions` with metadata
 *      `{ dropId, editionNumber, uid, variant }`. Currency GBP, mode
 *      payment.
 *   6. Persist the session id on the entitlement doc so the webhook
 *      can correlate `checkout.session.completed` back to the right
 *      entitlement, and so a re-hit returns the same session.
 *   7. Return `{ checkoutUrl }`.
 *
 * Webhook TODO: a follow-up route will listen for
 * `checkout.session.completed`, look up `users/{uid}/editions/{id}` via
 * the session metadata, and flip `fulfillmentStatus` to `paid` +
 * persist `paidAt` + the Stripe payment intent id. This route only
 * mints the session.
 *
 * Posture: voice register is catalogue — calm, specific. No exclamation
 * marks, no flourishes. The buyer sees Stripe's hosted checkout for the
 * actual card form; this route just hands them the URL.
 */

import { NextResponse } from "next/server";

import {
  getFirebaseAdminDb,
  verifyIdToken,
} from "lib/firebase/admin";
import { createLogger } from "lib/log";
import { getDropBySlug } from "lib/drops/read";

export const dynamic = "force-dynamic";

const log = createLogger("api.drops.stripe-session");

const STRIPE_API_BASE = "https://api.stripe.com/v1";

type Variant = "unique" | "limited" | "open";

type EntitlementDoc = {
  dropId: string;
  editionNumber: number;
  variant: Variant;
  uid: string;
  claimedAt: string;
  fulfillmentStatus: "pending-payment" | "paid" | "shipped" | "cancelled";
  passId: string | null;
  /** Set after the first successful session-mint so a re-hit can
   *  return the same hosted-checkout URL rather than orphaning the
   *  first session. */
  stripeCheckoutSessionId?: string;
  stripeCheckoutUrl?: string;
  paidAt?: string;
  stripePaymentIntentId?: string;
};

function isVariant(v: unknown): v is Variant {
  return v === "unique" || v === "limited" || v === "open";
}

function siteOrigin(req: Request): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

/** Pence (GBP minor units) for a variant. Reads env override, falls
 *  back to test-mode placeholders. Production should set these via
 *  `STRIPE_DROP_*_AMOUNT_GBP` per drop pricing tier. */
function priceForVariant(variant: Variant): number {
  const raw = (() => {
    switch (variant) {
      case "unique":
        return process.env.STRIPE_DROP_UNIQUE_AMOUNT_GBP;
      case "limited":
        return process.env.STRIPE_DROP_LIMITED_AMOUNT_GBP;
      case "open":
        return process.env.STRIPE_DROP_OPEN_AMOUNT_GBP;
    }
  })();
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  // Test-mode placeholders — make the production pricing failure mode
  // visible (penny amounts look obviously wrong to the operator).
  switch (variant) {
    case "unique":
      return 1400; // £14.00
    case "limited":
      return 350; // £3.50
    case "open":
      return 80; // £0.80
  }
}

function stripePriceIdForVariant(variant: Variant): string | null {
  const raw = (() => {
    switch (variant) {
      case "unique":
        return process.env.STRIPE_PRICE_DROP_UNIQUE;
      case "limited":
        return process.env.STRIPE_PRICE_DROP_LIMITED;
      case "open":
        return process.env.STRIPE_PRICE_DROP_OPEN;
    }
  })();
  const trimmed = raw?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

/**
 * Form-url-encode a flat-or-nested object into Stripe's expected
 * payload format. Mirrors `encodeStripeBody` in lib/stripe/server.ts —
 * kept inline here to avoid coupling this route to the bureau Stripe
 * surface (the two will share a helper once the webhook lands).
 */
function encodeStripeBody(
  input: Record<string, unknown>,
  prefix = "",
): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(input)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) {
      v.forEach((item, idx) => {
        if (item && typeof item === "object" && !Array.isArray(item)) {
          const nested = encodeStripeBody(
            item as Record<string, unknown>,
            `${key}[${idx}]`,
          );
          if (nested) parts.push(nested);
        } else {
          parts.push(
            `${encodeURIComponent(`${key}[${idx}]`)}=${encodeURIComponent(String(item))}`,
          );
        }
      });
      continue;
    }
    if (typeof v === "object") {
      const nested = encodeStripeBody(v as Record<string, unknown>, key);
      if (nested) parts.push(nested);
      continue;
    }
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
  }
  return parts.join("&");
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;

  // --- Auth -----------------------------------------------------------
  const authHeader =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let uid: string;
  let email: string | undefined;
  try {
    const decoded = await verifyIdToken(
      authHeader.slice("bearer ".length).trim(),
    );
    uid = decoded.uid;
    email = decoded.email;
  } catch {
    return NextResponse.json({ error: "token_invalid" }, { status: 401 });
  }

  // --- Body -----------------------------------------------------------
  let body: { editionNumber?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const editionNumber = Number(body.editionNumber);
  if (!Number.isInteger(editionNumber) || editionNumber < 0) {
    return NextResponse.json(
      { error: "invalid_edition_number" },
      { status: 400 },
    );
  }

  // --- Stripe config check -------------------------------------------
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeKey) {
    log.warn("STRIPE_SECRET_KEY unset", { slug, uid });
    return NextResponse.json(
      {
        error: "stripe_not_configured",
        message:
          "Set STRIPE_SECRET_KEY in the Vercel project env before minting checkout sessions.",
      },
      { status: 503 },
    );
  }

  // --- Firestore: read entitlement + drop -----------------------------
  const db = getFirebaseAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: "firestore_unavailable" },
      { status: 503 },
    );
  }

  const entitlementId = `${slug}-${editionNumber}`;
  const entitlementRef = db
    .collection("users")
    .doc(uid)
    .collection("editions")
    .doc(entitlementId);

  const snap = await entitlementRef.get();
  if (!snap.exists) {
    return NextResponse.json(
      { error: "entitlement_not_found" },
      { status: 404 },
    );
  }
  const entitlement = snap.data() as EntitlementDoc;
  if (entitlement.dropId !== slug || entitlement.editionNumber !== editionNumber) {
    // Shouldn't happen — the doc id is composed of both — but guard
    // anyway so a future doc-shape drift doesn't silently charge the
    // wrong edition.
    log.warn("entitlement mismatch", {
      slug,
      editionNumber,
      docDropId: entitlement.dropId,
      docEditionNumber: entitlement.editionNumber,
    });
    return NextResponse.json({ error: "entitlement_mismatch" }, { status: 409 });
  }
  if (entitlement.fulfillmentStatus === "paid") {
    return NextResponse.json(
      {
        error: "already_paid",
        message: "This edition is already paid for.",
      },
      { status: 409 },
    );
  }
  if (entitlement.fulfillmentStatus !== "pending-payment") {
    return NextResponse.json(
      { error: "entitlement_not_payable", status: entitlement.fulfillmentStatus },
      { status: 409 },
    );
  }
  if (!isVariant(entitlement.variant)) {
    return NextResponse.json(
      { error: "entitlement_invalid_variant" },
      { status: 500 },
    );
  }
  const variant: Variant = entitlement.variant;

  // If a session was already minted for this entitlement, return it
  // verbatim — re-hitting the route shouldn't orphan the first one.
  if (entitlement.stripeCheckoutUrl && entitlement.stripeCheckoutSessionId) {
    return NextResponse.json({
      ok: true,
      checkoutUrl: entitlement.stripeCheckoutUrl,
      sessionId: entitlement.stripeCheckoutSessionId,
      reused: true,
    });
  }

  const drop = await getDropBySlug(slug);
  if (!drop) {
    return NextResponse.json({ error: "drop_not_found" }, { status: 404 });
  }

  // --- Build the Checkout Session payload ----------------------------
  const origin = siteOrigin(req);
  const successUrl = `${origin}/bureau/checkout/${encodeURIComponent(slug)}/${editionNumber}?paid=1&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/drops/${encodeURIComponent(slug)}`;

  const variantLabel =
    variant === "unique"
      ? "Unique"
      : variant === "limited"
        ? `Limited #${editionNumber}/${drop.edition.limitedSize}`
        : `Open #${editionNumber}`;
  const description = `${drop.title} — ${variantLabel}`;

  const priceId = stripePriceIdForVariant(variant);
  const unitAmount = priceForVariant(variant);

  const lineItem = priceId
    ? { price: priceId, quantity: 1 }
    : {
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: unitAmount,
          product_data: {
            name: description,
            description: drop.summary?.slice(0, 500) || undefined,
            metadata: {
              dropId: slug,
              variant,
              editionNumber: String(editionNumber),
            },
          },
        },
      };

  const metadata = {
    dropId: slug,
    editionNumber: String(editionNumber),
    uid,
    variant,
    entitlementId,
    kind: "drop",
  };

  // The Stripe REST API uses bracketed-index form encoding for arrays
  // (e.g. `line_items[0][price]=...`). `encodeStripeBody` walks objects
  // + arrays in that shape.
  const payload: Record<string, unknown> = {
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: email,
    client_reference_id: `${uid}:${entitlementId}`,
    metadata,
    payment_intent_data: {
      metadata,
      description,
    },
    line_items: [lineItem],
  };

  const body_ = encodeStripeBody(payload);

  // --- Call Stripe ----------------------------------------------------
  let stripeRes: Response;
  try {
    stripeRes = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Stripe-Version": "2024-12-18.acacia",
      },
      body: body_,
    });
  } catch (err) {
    log.error("stripe fetch failed", {
      slug,
      uid,
      editionNumber,
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "stripe_unreachable" },
      { status: 502 },
    );
  }

  let stripeJson: {
    id?: string;
    url?: string;
    error?: { message?: string; code?: string };
  };
  try {
    stripeJson = (await stripeRes.json()) as typeof stripeJson;
  } catch {
    log.error("stripe response not JSON", {
      slug,
      uid,
      editionNumber,
      status: stripeRes.status,
    });
    return NextResponse.json({ error: "stripe_bad_response" }, { status: 502 });
  }

  if (!stripeRes.ok || !stripeJson.id || !stripeJson.url) {
    log.error("stripe session create failed", {
      slug,
      uid,
      editionNumber,
      status: stripeRes.status,
      stripeError: stripeJson.error?.message,
      stripeCode: stripeJson.error?.code,
    });
    return NextResponse.json(
      {
        error: "stripe_session_failed",
        detail: stripeJson.error?.message ?? `status ${stripeRes.status}`,
      },
      { status: 502 },
    );
  }

  // --- Persist session id on entitlement so the webhook + repeat
  //     calls can correlate. ---
  try {
    await entitlementRef.update({
      stripeCheckoutSessionId: stripeJson.id,
      stripeCheckoutUrl: stripeJson.url,
    });
  } catch (err) {
    // Non-fatal — the session is live on Stripe and the URL is in the
    // response. The webhook can still reconcile from the metadata.uid +
    // metadata.entitlementId fields it embeds on the session itself.
    log.warn("entitlement update with session id failed", {
      slug,
      uid,
      editionNumber,
      err: err instanceof Error ? err.message : String(err),
    });
  }

  log.info("checkout session minted", {
    slug,
    uid,
    editionNumber,
    variant,
    sessionId: stripeJson.id,
    usedPriceId: Boolean(priceId),
    unitAmount: priceId ? null : unitAmount,
  });

  return NextResponse.json({
    ok: true,
    checkoutUrl: stripeJson.url,
    sessionId: stripeJson.id,
    reused: false,
  });
}
