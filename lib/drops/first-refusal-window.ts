/**
 * lib/drops/first-refusal-window.ts — eligibility math for the drop's
 * first-refusal window.
 *
 * Two distinct concepts, often conflated, kept separate here:
 *
 *   1. **First-refusal window** — a *time* window after `publishedAt`
 *      during which Limited editions are reserved for Patron+ tier
 *      members. Default 24h, configurable via FIRST_REFUSAL_WINDOW_MS.
 *
 *   2. **First-refusal radius** — a *graph* boundary on the drop's
 *      lineage that determines *which* Patrons get the window (those
 *      whose own genomes are within the radius). Stored per-drop as
 *      `firstRefusalRadius`. The graph resolver lives elsewhere; here
 *      we only expose the time-window check.
 *
 * The Atelier tier gets a permanent allocation: 25% of every Limited
 * edition is reserved for Atelier members regardless of window state.
 * That allocation lives in the bureau checkout, not here — this module
 * only answers "is the public window active right now?".
 */

import "server-only";

import type { Drop } from "./types";
import type { StudioTierClaim } from "lib/patreon/types";

/** Default window length: 24h. */
const DEFAULT_WINDOW_MS = 24 * 60 * 60 * 1000;

function windowLengthMs(): number {
  const raw = process.env.FIRST_REFUSAL_WINDOW_MS;
  if (!raw) return DEFAULT_WINDOW_MS;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_WINDOW_MS;
}

export type FirstRefusalWindowState =
  | {
      kind: "active";
      endsAt: string;
      msRemaining: number;
    }
  | {
      kind: "ended";
      endedAt: string;
    }
  | {
      kind: "unpublished";
    };

export function firstRefusalWindow(drop: Drop): FirstRefusalWindowState {
  if (!drop.publishedAt) return { kind: "unpublished" };
  const start = Date.parse(drop.publishedAt);
  if (!Number.isFinite(start)) return { kind: "unpublished" };
  const endsAt = start + windowLengthMs();
  const now = Date.now();
  if (now < endsAt) {
    return {
      kind: "active",
      endsAt: new Date(endsAt).toISOString(),
      msRemaining: endsAt - now,
    };
  }
  return { kind: "ended", endedAt: new Date(endsAt).toISOString() };
}

/**
 * Can the user claim during the current window?
 *
 *   - Window active + tier in {patron, atelier} → yes
 *   - Window active + tier in {member, reader-plus, null} → no (must wait)
 *   - Window ended → yes for everyone
 *   - Drop unpublished → no
 *
 * Reader+ deliberately does NOT get first-refusal — Reader+ is honorific
 * recognition for legacy `/dimonauk` supporters, not a paid tier in the
 * studio's edition economics. Member is paid but sits below the
 * first-refusal cutoff.
 */
export function canClaimNow(
  drop: Drop,
  tier: StudioTierClaim | null,
): boolean {
  const w = firstRefusalWindow(drop);
  if (w.kind === "unpublished") return false;
  if (w.kind === "ended") return true;
  return tier === "patron" || tier === "atelier";
}
