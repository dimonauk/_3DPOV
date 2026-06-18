import { NextResponse } from "next/server";

import { createLogger } from "lib/log";
import { createCheckoutSession } from "lib/stripe/server";

export const dynamic = "force-dynamic";

const log = createLogger("api.stripe.checkout");

/**
 * Stripe Checkout session creator.
 *
 * Body: `{ "tier": "perch" | "nest" | "fledge" }`
 *
 * Per-tier price IDs come from env vars (set in Vercel project env):
 *
 *   STRIPE_PRICE_PERCH    — recurring £6/mo
 *   STRIPE_PRICE_NEST     — recurring £12/mo
 *   STRIPE_PRICE_FLEDGE   — one-time £75 (founding member)
 *
 * Optional URL overrides (default to the holoflow.co.uk app URLs):
 *
 *   NEXT_PUBLIC_APP_URL          — base origin; default https://holoflow.co.uk
 *   STRIPE_SUCCESS_PATH_ROOKERY  — default /rookery?welcome=1
 *   STRIPE_CANCEL_PATH_ROOKERY   — default /rookery/tiers
 *
 * Response: `{ url }` — redirect target. On failure: 4xx/5xx with `{ error }`.
 *
 * When Stripe is unconfigured the route returns 503; the tiers page
 * surfaces this as a one-line "the gate is being wired" notice, so
 * the button never crashes the experience.
 */

type TierSlug = "perch" | "nest" | "fledge";

const TIER_MODE: Record<TierSlug, "subscription" | "payment"> = {
  perch: "subscription",
  nest: "subscription",
  fledge: "payment",
};

const TIER_PRICE_ENV: Record<TierSlug, string> = {
  perch: "STRIPE_PRICE_PERCH",
  nest: "STRIPE_PRICE_NEST",
  fledge: "STRIPE_PRICE_FLEDGE",
};

function isTierSlug(v: unknown): v is TierSlug {
  return v === "perch" || v === "nest" || v === "fledge";
}

export async function POST(req: Request) {
  let payload: { tier?: unknown; email?: unknown; uid?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (!isTierSlug(payload.tier)) {
    return NextResponse.json(
      { error: "Tier must be one of: perch, nest, fledge" },
      { status: 400 },
    );
  }
  const tier = payload.tier;
  const email =
    typeof payload.email === "string" && payload.email.trim().length > 0
      ? payload.email.trim()
      : undefined;
  // uid is optional — when the buyer is signed in, the client passes
  // their Firebase uid so the webhook can write the subscription doc
  // keyed to them. Anonymous buyers can still check out; the webhook
  // logs + sends the welcome email but skips the Firestore write.
  const uid =
    typeof payload.uid === "string" && payload.uid.trim().length > 0
      ? payload.uid.trim()
      : undefined;

  const priceId = process.env[TIER_PRICE_ENV[tier]];
  if (!priceId) {
    log.warn("checkout requested but price id env var unset", {
      tier,
      envVar: TIER_PRICE_ENV[tier],
    });
    return NextResponse.json(
      {
        error:
          "The gate is being wired up. Stripe isn't live yet — write to the studio and you'll be added on a founding-member basis.",
      },
      { status: 503 },
    );
  }

  const base = (
    process.env.NEXT_PUBLIC_APP_URL ?? "https://holoflow.co.uk"
  ).replace(/\/$/, "");
  const successPath =
    process.env.STRIPE_SUCCESS_PATH_ROOKERY ?? "/rookery?welcome=1";
  const cancelPath =
    process.env.STRIPE_CANCEL_PATH_ROOKERY ?? "/rookery/tiers";

  try {
    const session = await createCheckoutSession({
      priceId,
      mode: TIER_MODE[tier],
      successUrl: `${base}${successPath}`,
      cancelUrl: `${base}${cancelPath}`,
      customerEmail: email,
      metadata: {
        rookery_tier: tier,
        ...(uid ? { uid } : {}),
      },
      allowPromotionCodes: false,
    });
    log.info("checkout session created", { tier, sessionId: session.id });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "service-unavailable") {
      return NextResponse.json(
        {
          error:
            "Stripe is not configured for this environment yet. Please contact the studio.",
        },
        { status: 503 },
      );
    }
    log.error("checkout session create failed", {
      tier,
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Could not start checkout. Try again in a moment." },
      { status: 502 },
    );
  }
}
