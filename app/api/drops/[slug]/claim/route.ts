/**
 * POST /api/drops/[slug]/claim — buyer claims an edition slot.
 *
 * Body: { variant: "unique" | "limited" | "open" }
 * Auth: Authorization: Bearer <Firebase ID token>
 *
 * Flow:
 *   1. Verify the user.
 *   2. Read the drop record from Firestore.
 *   3. Check the first-refusal window: if active and user's tier <
 *      patron, reject (the public page already gates this, but the
 *      server enforces too).
 *   4. Inside a Firestore transaction:
 *        a. Re-fetch drop, check edition has capacity left.
 *        b. Compute the edition number for this claim.
 *        c. Increment the appropriate `editionState` counter.
 *        d. Reserve the user's entitlement at
 *           `users/{uid}/editions/{dropId}-{editionNumber}`.
 *   5. Mint the pass (stub today — passkit-generator wiring is in
 *      lib/drops/mint-pass.ts) and persist at
 *      `drops/{slug}/passes/{passId}`.
 *   6. Return the entitlement record + the URL of a Stripe checkout
 *      session if Stripe is configured. (Today we return a placeholder
 *      bureau-checkout URL — wiring Stripe here is a follow-up.)
 *
 * Idempotency: the entitlement doc id is `${dropId}-${editionNumber}`.
 * If the buyer hits Claim twice on the same browser before the page
 * navigates, the second request fails the capacity check inside the
 * transaction (the counter increment + read happen atomically).
 */

import { NextResponse } from "next/server";

import {
  getFirebaseAdminDb,
  verifyIdToken,
} from "lib/firebase/admin";
import { createLogger } from "lib/log";
import { firstRefusalWindow } from "lib/drops/first-refusal-window";
import { mintEditionPass } from "lib/drops/mint-pass";
import { getDropBySlug } from "lib/drops/read";
import type { Drop } from "lib/drops/types";
import type { StudioTierClaim } from "lib/patreon/types";

export const dynamic = "force-dynamic";

const log = createLogger("api.drops.claim");

type Variant = "unique" | "limited" | "open";

function isValidVariant(value: unknown): value is Variant {
  return value === "unique" || value === "limited" || value === "open";
}

function tierFromClaims(
  claims: Record<string, unknown> | null | undefined,
): StudioTierClaim | null {
  const t = claims?.tier;
  return t === "reader-plus" || t === "member" || t === "patron" || t === "atelier"
    ? (t as StudioTierClaim)
    : null;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;

  const authHeader =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let uid: string;
  let userTier: StudioTierClaim | null = null;
  try {
    const decoded = await verifyIdToken(
      authHeader.slice("bearer ".length).trim(),
    );
    uid = decoded.uid;
    userTier = tierFromClaims(decoded as unknown as Record<string, unknown>);
  } catch {
    return NextResponse.json({ error: "token_invalid" }, { status: 401 });
  }

  let body: { variant?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!isValidVariant(body.variant)) {
    return NextResponse.json({ error: "invalid_variant" }, { status: 400 });
  }
  const variant: Variant = body.variant;

  const drop = await getDropBySlug(slug);
  if (!drop || drop.status !== "published") {
    return NextResponse.json({ error: "drop_not_found" }, { status: 404 });
  }

  // First-refusal window gate: active window restricts to Patron + Atelier.
  // Public page already pre-filters but the server enforces too because
  // the page-side check can be bypassed.
  const window = firstRefusalWindow(drop);
  if (
    window.kind === "active" &&
    userTier !== "patron" &&
    userTier !== "atelier"
  ) {
    return NextResponse.json(
      {
        error: "first_refusal_window_active",
        endsAt: window.endsAt,
        requiredTier: "patron",
      },
      { status: 403 },
    );
  }

  const db = getFirebaseAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: "firestore_unavailable" },
      { status: 503 },
    );
  }

  const dropRef = db.collection("drops").doc(slug);

  type TransactionResult = {
    editionNumber: number;
    drop: Drop;
  };

  let txResult: TransactionResult;
  try {
    txResult = await db.runTransaction<TransactionResult>(async (tx) => {
      const snap = await tx.get(dropRef);
      if (!snap.exists) throw new Error("drop_vanished_during_tx");
      const live = snap.data() as Drop;

      if (variant === "unique") {
        if (live.editionState.uniqueClaimed) {
          throw new Error("unique_already_claimed");
        }
        tx.update(dropRef, { "editionState.uniqueClaimed": true });
        return { editionNumber: 0, drop: { ...live, editionState: { ...live.editionState, uniqueClaimed: true } } };
      }

      if (variant === "limited") {
        if (live.editionState.limitedClaimed >= live.edition.limitedSize) {
          throw new Error("limited_sold_out");
        }
        const next = live.editionState.limitedClaimed + 1;
        tx.update(dropRef, { "editionState.limitedClaimed": next });
        return { editionNumber: next, drop: { ...live, editionState: { ...live.editionState, limitedClaimed: next } } };
      }

      // variant === "open"
      if (!live.edition.openEnabled) {
        throw new Error("open_run_disabled");
      }
      const openNext = live.editionState.openClaimed + 1;
      tx.update(dropRef, { "editionState.openClaimed": openNext });
      const openEditionNumber = live.edition.limitedSize + openNext; // Open numbers continue after Limited.
      return {
        editionNumber: openEditionNumber,
        drop: { ...live, editionState: { ...live.editionState, openClaimed: openNext } },
      };
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    const status =
      message === "drop_vanished_during_tx"
        ? 410
        : message === "unique_already_claimed" || message === "limited_sold_out" || message === "open_run_disabled"
          ? 409
          : 500;
    log.warn("claim transaction failed", { slug, variant, uid, error: message });
    return NextResponse.json({ error: message }, { status });
  }

  const { editionNumber } = txResult;

  // Mint the pass record. Today: identity-only stub (no certs wired).
  const pass = drop.passkitEnabled
    ? await mintEditionPass({
        dropId: slug,
        editionNumber,
        parentageChain: drop.parentageChain,
        genomeId: drop.genomeId,
      })
    : null;

  // Persist the entitlement + pass.
  const entitlementId = `${slug}-${editionNumber}`;
  const entitlementDoc = {
    dropId: slug,
    editionNumber,
    variant,
    uid,
    claimedAt: new Date().toISOString(),
    fulfillmentStatus: "pending-payment",
    passId: pass?.passId ?? null,
  };
  await db
    .collection("users")
    .doc(uid)
    .collection("editions")
    .doc(entitlementId)
    .set(entitlementDoc);

  if (pass) {
    await db
      .collection("drops")
      .doc(slug)
      .collection("passes")
      .doc(pass.passId)
      .set(pass);
  }

  log.info("claim accepted", {
    slug,
    uid,
    variant,
    editionNumber,
    passMinted: Boolean(pass),
  });

  // Stripe is a follow-up — return a bureau-checkout URL the client
  // navigates to. Once Stripe is wired this endpoint mints a Checkout
  // Session and returns its URL directly.
  const checkoutUrl = `/bureau/checkout/${slug}/${editionNumber}`;

  return NextResponse.json({
    ok: true,
    entitlementId,
    editionNumber,
    variant,
    checkoutUrl,
    passId: pass?.passId ?? null,
  });
}
