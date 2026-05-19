import { cookies } from "next/headers";

import { verifyIdToken } from "lib/firebase/admin";
import { tierMeetsRequirement } from "lib/patreon/tier-claim";
import type { StudioTierClaim, TierClaimPayload } from "lib/patreon/types";

/**
 * <PatreonGate> — server component that conditionally renders `children`
 * when the requesting user meets `tier`.
 *
 * Auth source: a Firebase session cookie named `__session` (the
 * conventional name Vercel/Firebase use for first-party session
 * cookies). The cookie holds an ID token verified server-side per
 * render.
 *
 * Reading model: tier ordering is reader-plus (1) < member (2) <
 * patron (3) < atelier (4). Setting `tier="member"` will let
 * member/patron/atelier through; setting `tier="atelier"` will only
 * let atelier through.
 *
 * Fallback: when the user isn't signed in OR doesn't meet the tier,
 * the `fallback` slot is rendered. Pass a Link to /rookery/patreon as
 * the conventional default.
 */
export async function PatreonGate({
  tier,
  children,
  fallback,
}: {
  tier: StudioTierClaim;
  children: React.ReactNode;
  fallback: React.ReactNode;
}) {
  const claim = await readClaim();
  if (!claim) return <>{fallback}</>;
  if (!tierMeetsRequirement(claim.tier, tier)) return <>{fallback}</>;
  return <>{children}</>;
}

async function readClaim(): Promise<TierClaimPayload | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("__session")?.value;
  if (!session) return null;
  try {
    const decoded = await verifyIdToken(session);
    const claims = decoded as unknown as Record<string, unknown>;
    const rawTier = claims.tier;
    const tier: StudioTierClaim | null =
      rawTier === "reader-plus" ||
      rawTier === "member" ||
      rawTier === "patron" ||
      rawTier === "atelier"
        ? rawTier
        : null;
    return {
      tier,
      tierStartedAt:
        typeof claims.tierStartedAt === "string" ? claims.tierStartedAt : null,
      lifetimePledgeCents:
        typeof claims.lifetimePledgeCents === "number"
          ? claims.lifetimePledgeCents
          : 0,
      patreonId:
        typeof claims.patreonId === "string" ? claims.patreonId : null,
    };
  } catch {
    return null;
  }
}
