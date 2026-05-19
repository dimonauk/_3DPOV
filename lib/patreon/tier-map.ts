/**
 * Resolve Patreon tier IDs to our internal claim strings.
 *
 * The mapping is built lazily on each call so test runs that mutate
 * process.env between cases see the current values. The cost is one
 * env-var read + three string comparisons per webhook — negligible
 * vs. the Firebase Admin round-trip that follows.
 *
 * When the Patreon member is entitled to multiple tiers (rare, but
 * possible during a mid-cycle upgrade) we resolve to the highest
 * monetary tier so the user never loses access during a transition.
 */

import "server-only";

import type { StudioTier } from "./types";

const TIER_PRECEDENCE: ReadonlyArray<StudioTier> = ["atelier", "patron", "member"];

function tierEnvForLevel(level: StudioTier): string | undefined {
  switch (level) {
    case "member":
      return process.env.PATREON_TIER_MEMBER_ID;
    case "patron":
      return process.env.PATREON_TIER_PATRON_ID;
    case "atelier":
      return process.env.PATREON_TIER_ATELIER_ID;
  }
}

export function tierFromPatreonIds(ids: readonly string[]): StudioTier | null {
  if (ids.length === 0) return null;
  const set = new Set(ids);
  for (const level of TIER_PRECEDENCE) {
    const envId = tierEnvForLevel(level);
    if (envId && set.has(envId)) return level;
  }
  return null;
}

export function studioCampaignId(): string | null {
  return process.env.PATREON_STUDIO_CAMPAIGN_ID ?? null;
}

export function requireStudioCampaignId(): string {
  const id = studioCampaignId();
  if (!id) {
    throw new Error(
      "PATREON_STUDIO_CAMPAIGN_ID is not set. The webhook + reconciler refuse " +
        "to run without it — otherwise events from the personal patreon.com/dimonauk " +
        "campaign would leak into the studio's tier state.",
    );
  }
  return id;
}
