/**
 * app/api/stripe/checkout/route.ts — Create a Stripe Checkout Session.
 *
 * Called by the Rookery page when a visitor clicks "Subscribe".
 * Returns a redirect URL to Stripe's hosted checkout.
 *
 * POST { tierSlug: "perch" | "nest" | "fledge", email: string }
 *  -> 200 { url: string }       redirect to Stripe
 *  -> 400 { error: string }     validation failure
 *  -> 503 { error: string }     Stripe not configured
 */

import { NextResponse } from "next/server";
import { createLogger } from "lib/log";
import { createCheckoutSession, type RookeryTierSlug } from "lib/stripe/server";

export const dynamic = "force-dynamic";

const log = createLogger("api.stripe.checkout");

const VALID_TIERS = new Set<RookeryTierSlug>(["perch", "nest", "fledge"]);

export async function POST(req: Request): Promise<Response> {
  let tierSlug: unknown;
  let email: unknown;

  try {
    const body = (await req.json()) as Record<string, unknown>;
    tierSlug = body.tierSlug;
    email = body.email;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  if (typeof tierSlug !== "string" || !VALID_TIERS.has(tierSlug as RookeryTierSlug)) {
    return NextResponse.json(
      { error: `tierSlug must be one of: ${[...VALID_TIERS].join(", ")}` },
      { status: 400 },
    );
  }

  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const origin = req.headers.get("origin") ?? "https://holoflow.co.uk";

  try {
    const session = await createCheckoutSession({
      tierSlug: tierSlug as RookeryTierSlug,
      customerEmail: email,
      successUrl: `${origin}/rookery?checkout=success&tier=${tierSlug}`,
      cancelUrl: `${origin}/rookery?checkout=cancelled`,
    });

    log.info("checkout session issued", { tier: tierSlug, sessionId: session.id });
    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e.code === "service-unavailable") {
      log.warn("Stripe not configured");
      return NextResponse.json(
        { error: "Payment system not yet configured. Contact studio@holoflow.co.uk directly." },
        { status: 503 },
      );
    }
    log.error("checkout session failed", { error: e.message });
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
