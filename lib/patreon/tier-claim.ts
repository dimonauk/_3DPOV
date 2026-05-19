/**
 * Server-side helper to read a user's current studio-tier claim.
 *
 * Used by route handlers and server components that need to gate
 * content by Patreon tier. The shape of the claim envelope matches
 * what `firebase-sync.ts` and the OAuth callback write:
 *
 *   {
 *     tier: "member" | "patron" | "atelier" | "reader-plus" | null,
 *     tierStartedAt: ISO string | null,
 *     lifetimePledgeCents: number,
 *     patreonId: string | null,
 *   }
 *
 * Two read paths:
 *
 *   1. `tierClaimFromIdToken(idToken)` — verifies the token then reads
 *      the embedded custom-claims. Cheapest; uses the cached token
 *      payload. Pass this when the caller has a bearer header.
 *
 *   2. `tierClaimByUid(uid)` — round-trips Firebase Admin to fetch the
 *      live customClaims off the user record. Use this when the claim
 *      may have been updated since the user's last token refresh
 *      (Patreon webhook fired but the client hasn't called
 *      `user.getIdToken(true)` to pick up the new claim yet).
 *
 * Returning `null` tier means "no tier" — distinct from "user not
 * found" (which throws) and "claim not present" (which returns
 * `{ tier: null, ... }` with default fields).
 */

import "server-only";

import {
  getFirebaseAdminAuth,
  verifyIdToken,
} from "lib/firebase/admin";

import type { StudioTierClaim, TierClaimPayload } from "./types";

const TIER_RANK: Record<NonNullable<StudioTierClaim>, number> = {
  "reader-plus": 1,
  member: 2,
  patron: 3,
  atelier: 4,
};

export function tierRank(tier: StudioTierClaim | null): number {
  return tier ? TIER_RANK[tier] : 0;
}

export function tierMeetsRequirement(
  current: StudioTierClaim | null,
  required: StudioTierClaim,
): boolean {
  return tierRank(current) >= tierRank(required);
}

function emptyPayload(): TierClaimPayload {
  return {
    tier: null,
    tierStartedAt: null,
    lifetimePledgeCents: 0,
    patreonId: null,
  };
}

function payloadFromClaims(
  claims: Record<string, unknown> | null | undefined,
): TierClaimPayload {
  if (!claims) return emptyPayload();
  const rawTier = claims.tier;
  const tier: StudioTierClaim | null =
    rawTier === "reader-plus" ||
    rawTier === "member" ||
    rawTier === "patron" ||
    rawTier === "atelier"
      ? rawTier
      : null;
  const tierStartedAt =
    typeof claims.tierStartedAt === "string" ? claims.tierStartedAt : null;
  const lifetimePledgeCents =
    typeof claims.lifetimePledgeCents === "number"
      ? claims.lifetimePledgeCents
      : 0;
  const patreonId =
    typeof claims.patreonId === "string" ? claims.patreonId : null;
  return { tier, tierStartedAt, lifetimePledgeCents, patreonId };
}

export async function tierClaimFromIdToken(
  idToken: string,
): Promise<TierClaimPayload> {
  const decoded = await verifyIdToken(idToken);
  return payloadFromClaims(decoded as unknown as Record<string, unknown>);
}

export async function tierClaimByUid(
  uid: string,
): Promise<TierClaimPayload | null> {
  const auth = getFirebaseAdminAuth();
  if (!auth) return null;
  try {
    const user = await auth.getUser(uid);
    return payloadFromClaims(user.customClaims as Record<string, unknown>);
  } catch {
    return null;
  }
}
