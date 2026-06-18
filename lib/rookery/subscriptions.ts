import "server-only";

/**
 * lib/rookery/subscriptions.ts — Firestore mirror of the Stripe
 * subscription state for Rookery tiers.
 *
 * # Why
 *
 * Stripe is the source of truth for billing; this collection is the
 * site's local mirror used to gate /rookery/new posting + render the
 * "Your tier" affordance in the navbar without round-tripping to the
 * Stripe API on every request.
 *
 * # Storage shape
 *
 * Collection: `rookery_subscriptions/{uid}`. One doc per Firebase user.
 * If a user upgrades / downgrades, the same doc is overwritten.
 *
 *   uid:                  string  // Firebase auth uid (== doc id)
 *   tier:                 "perch" | "nest" | "fledge"
 *   status:               "active" | "past_due" | "canceled" | "incomplete"
 *   stripeCustomerId:     string
 *   stripeSubscriptionId: string | null  // null for Fledge one-time
 *   currentPeriodEndMs:   number | null  // epoch ms; recurring only
 *   foundingMember:       boolean        // true iff Fledge
 *   email:                string         // copy of customer email at sign-up
 *   createdAtMs:          number
 *   updatedAtMs:          number
 *
 * # Posture
 *
 * Admin SDK only. `firestore.rules` denies client reads + writes —
 * this collection names email addresses + reveals who's on the perch.
 * The site reads via server components / route handlers using the
 * admin SDK.
 */

import { requireFirebaseAdminDb } from "lib/firebase/admin";
import { createLogger } from "lib/log";

const log = createLogger("rookery.subscriptions");

const COLLECTION = "rookery_subscriptions";

export type RookeryTierSlug = "perch" | "nest" | "fledge";

export type RookerySubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete";

export type RookerySubscription = {
  uid: string;
  tier: RookeryTierSlug;
  status: RookerySubscriptionStatus;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  currentPeriodEndMs: number | null;
  foundingMember: boolean;
  email: string;
  createdAtMs: number;
  updatedAtMs: number;
};

export type UpsertSubscriptionInput = {
  uid: string;
  tier: RookeryTierSlug;
  status: RookerySubscriptionStatus;
  stripeCustomerId: string;
  stripeSubscriptionId?: string | null;
  currentPeriodEndMs?: number | null;
  email: string;
};

/**
 * Upsert a subscription doc. Used by the Stripe webhook on
 * `checkout.session.completed`. Sets foundingMember = true iff
 * tier === "fledge" (the one-time SKU).
 */
export async function upsertSubscription(
  input: UpsertSubscriptionInput,
): Promise<RookerySubscription> {
  const db = requireFirebaseAdminDb();
  const now = Date.now();
  const existing = await db.collection(COLLECTION).doc(input.uid).get();
  const createdAtMs = existing.exists
    ? (existing.data()?.createdAtMs as number | undefined) ?? now
    : now;
  const doc: RookerySubscription = {
    uid: input.uid,
    tier: input.tier,
    status: input.status,
    stripeCustomerId: input.stripeCustomerId,
    stripeSubscriptionId: input.stripeSubscriptionId ?? null,
    currentPeriodEndMs: input.currentPeriodEndMs ?? null,
    foundingMember: input.tier === "fledge",
    email: input.email,
    createdAtMs,
    updatedAtMs: now,
  };
  await db.collection(COLLECTION).doc(input.uid).set(doc);
  log.info("subscription upserted", {
    uid: input.uid,
    tier: input.tier,
    status: input.status,
  });
  return doc;
}

/**
 * Update an existing subscription's status. Used by the webhook on
 * `customer.subscription.updated` / `.deleted`. Looks up by
 * stripeSubscriptionId because Stripe events don't carry our uid.
 *
 * Returns the updated doc, or null if no matching doc exists (e.g.
 * an event for a subscription created before this collection landed).
 */
export async function updateSubscriptionStatusByStripeId(
  stripeSubscriptionId: string,
  patch: {
    status?: RookerySubscriptionStatus;
    currentPeriodEndMs?: number | null;
  },
): Promise<RookerySubscription | null> {
  const db = requireFirebaseAdminDb();
  const snap = await db
    .collection(COLLECTION)
    .where("stripeSubscriptionId", "==", stripeSubscriptionId)
    .limit(1)
    .get();
  if (snap.empty) {
    log.warn("subscription update target not found", { stripeSubscriptionId });
    return null;
  }
  const doc = snap.docs[0]!;
  const now = Date.now();
  const updates: Record<string, unknown> = { updatedAtMs: now };
  if (patch.status) updates.status = patch.status;
  if (patch.currentPeriodEndMs !== undefined) {
    updates.currentPeriodEndMs = patch.currentPeriodEndMs;
  }
  await doc.ref.update(updates);
  log.info("subscription patched", {
    uid: doc.id,
    stripeSubscriptionId,
    patch,
  });
  return { ...(doc.data() as RookerySubscription), ...updates } as
    RookerySubscription;
}

export async function getSubscription(
  uid: string,
): Promise<RookerySubscription | null> {
  const db = requireFirebaseAdminDb();
  const doc = await db.collection(COLLECTION).doc(uid).get();
  if (!doc.exists) return null;
  return doc.data() as RookerySubscription;
}

/**
 * Active = recurring with status "active" OR fledge founding member.
 * The Fledge is one-time so it never has a recurring status; the
 * presence of the doc with tier="fledge" is the active signal.
 */
export async function isSubscriberActive(uid: string): Promise<boolean> {
  const sub = await getSubscription(uid);
  if (!sub) return false;
  if (sub.foundingMember) return true;
  return sub.status === "active";
}
