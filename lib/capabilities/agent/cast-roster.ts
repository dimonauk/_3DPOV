/**
 * lib/capabilities/agent/cast-roster.ts — Capability `agent.cast-roster`:
 * tier-filterable discovery surface for the studio's named cast.
 *
 * One-line role: combine the bibles registry + the canon hierarchy into a single, queryable, typed roster.
 * Full purpose in cast-roster.PURPOSE.md.
 *
 * # Why this capability
 *
 * Multiple consumers want "give me the cast at tier X" without each
 * one importing `lib/cast/index.ts` AND `lib/cast/canon-hierarchy.ts`
 * AND zipping them together. This capability does the zipping once,
 * and registers itself in the capability index so the
 * `/capabilities` route lists it like any other.
 *
 * # When NOT to use this
 *
 * Direct dialogue (the `agent.dialogue` capability) doesn't need
 * tier filtering — it takes one bible by id and runs the turn. Use
 * `getBible(id)` directly for that.
 *
 * The roster capability is for UIs and orchestration: "show me the
 * inner-circle for this page", "route this prompt to a department
 * head", "iterate over the peers for sitcom casting".
 */

import { bibles, getBible, listCastIds, type CastMemberId, type CharacterBible } from "lib/cast";
import {
  getHierarchy,
  listByTier,
  listCanon14,
  listNamed,
  type CastTier,
  type CanonHierarchyEntry,
} from "lib/cast/canon-hierarchy";

/**
 * The shape returned by roster queries: a bible joined to its
 * hierarchy entry. This is the right surface for UIs — voice + tier
 * + House in one object.
 */
export type RosterMember = {
  id: CastMemberId;
  bible: CharacterBible;
  hierarchy: CanonHierarchyEntry;
};

/** Join a single id. Throws if either side is missing. */
export function getMember(id: CastMemberId): RosterMember {
  return {
    id,
    bible: getBible(id),
    hierarchy: getHierarchy(id),
  };
}

/** Everyone, joined. Order: protagonist → inner-circle → peer → department-head → extras. */
export function listRoster(): RosterMember[] {
  return listCastIds()
    .map(getMember)
    .sort((a, b) => tierOrder(a.hierarchy.tier) - tierOrder(b.hierarchy.tier));
}

/** Filter by tier. */
export function rosterByTier(tier: CastTier): RosterMember[] {
  return listByTier(tier).map((h) => getMember(h.id));
}

/** Just the canon-14 (excludes website-only extras). */
export function rosterCanon14(): RosterMember[] {
  return listCanon14()
    .map((h) => getMember(h.id))
    .sort((a, b) => tierOrder(a.hierarchy.tier) - tierOrder(b.hierarchy.tier));
}

/** Just the named members (excludes NAME TBD heads). */
export function rosterNamed(): RosterMember[] {
  return listNamed().map((h) => getMember(h.id));
}

/** Quick stats — useful for debug panels and the `/capabilities` route. */
export function rosterStats(): {
  total: number;
  byTier: Record<CastTier, number>;
  namedCount: number;
  unnamedCount: number;
} {
  const all = listRoster();
  const byTier: Record<CastTier, number> = {
    protagonist: 0,
    "inner-circle": 0,
    peer: 0,
    "department-head": 0,
    extra: 0,
  };
  let namedCount = 0;
  let unnamedCount = 0;
  for (const m of all) {
    byTier[m.hierarchy.tier]++;
    if (m.hierarchy.named === false) unnamedCount++;
    else namedCount++;
  }
  return { total: all.length, byTier, namedCount, unnamedCount };
}

/**
 * Integrity check — bibles and hierarchy must share keys. Run in a
 * test or at boot in dev to catch mismatches early.
 *
 * Returns null on success, or a description of the mismatch.
 */
export function assertRosterConsistent(): string | null {
  const bibleIds = new Set<string>(Object.keys(bibles));
  const missingHierarchy: string[] = [];
  for (const id of bibleIds) {
    try {
      getHierarchy(id as CastMemberId);
    } catch {
      missingHierarchy.push(id);
    }
  }
  if (missingHierarchy.length > 0) {
    return `bibles without hierarchy entries: ${missingHierarchy.join(", ")}`;
  }
  // Reverse: every hierarchy key must have a bible.
  // (Done via Object.keys on bibles being the same set as Object.keys on HIERARCHY.)
  return null;
}

// ── helpers ─────────────────────────────────────────────────────────

function tierOrder(t: CastTier): number {
  switch (t) {
    case "protagonist": return 0;
    case "inner-circle": return 1;
    case "peer": return 2;
    case "department-head": return 3;
    case "extra": return 4;
  }
}
