/**
 * lib/cast/canon-hierarchy.ts — Parallel registry of canon metadata.
 *
 * One-line role: tier / House / named-status for every cast member, kept SEPARATE from CharacterBible so existing bibles don't need patching.
 * Full purpose in canon-hierarchy.PURPOSE.md.
 *
 * # Why a parallel registry
 *
 * The `CharacterBible` shape in `lib/cast/aura.ts` predates the canon
 * docs (AURA / DIMONA / CAST / REHAB). The bibles are excellent and
 * production-grounded — patching the type to add tier/House/named
 * fields risks drift in 10 carefully-written files.
 *
 * Instead this file holds the canon hierarchy as a separate registry
 * keyed by `CastMemberId`. Consumers that need tier or House query
 * here; consumers that need voice query the bible. The two stay in
 * sync via the test in `lib/cast/index.ts` that every id has both an
 * entry here and a bible.
 *
 * # The hierarchy (from docs/CAST-CANON.md)
 *
 * - protagonist:      Aura
 * - inner-circle:     Penny, Baby
 * - peer (5):         Millie, Betsy, Lottie, Trixie, Dottie
 * - department-head:  Marcel, Tim, Shelly, dance-tutor, logistician, physicist
 *
 * Plus website-only roster: excavation-bot, scribe (no canon tier;
 * `extra: true`).
 */

import type { CastMemberId } from "./index";

/** Tier in the cast hierarchy. */
export type CastTier = "protagonist" | "inner-circle" | "peer" | "department-head" | "extra";

/** Kind of department-head — distinguishes the 6 heads by their craft. */
export type HeadKind =
  | "stylist"
  | "photographer"
  | "tutor"
  | "dance"
  | "maths"
  | "physics";

export type CanonHierarchyEntry = {
  /** Stable id — matches the CastMemberId. */
  id: CastMemberId;
  /** Tier in the cast hierarchy. */
  tier: CastTier;
  /** House colour — peers have these per CAST-CANON Tier 2. */
  houseColour?: string;
  /** For department-heads only — which department she runs. */
  headKind?: HeadKind;
  /** False ⇒ NAME TBD per CAST-CANON. Defaults to true. */
  named?: boolean;
  /**
   * If the canon docs gave this character a one-line specialty/role,
   * stored here for tier-2 peers ("The Walls", "The Ceiling", etc.)
   * and for tier-3 heads ("Stylist", "Photographer", "Tutor").
   */
  canonSpecialty?: string;
};

/**
 * The hierarchy — single source of truth for tier metadata.
 *
 * Keep alphabetical-by-id within each tier band for ease of scanning.
 */
export const HIERARCHY: Record<CastMemberId, CanonHierarchyEntry> = {
  // Tier 1: protagonist
  aura: {
    id: "aura",
    tier: "protagonist",
    named: true,
  },

  // Tier 1: inner-circle
  baby: {
    id: "baby",
    tier: "inner-circle",
    named: true,
    canonSpecialty: "Senior Agent / Prefect / Gold Standard",
  },
  penny: {
    id: "penny",
    tier: "inner-circle",
    named: true,
    canonSpecialty: "Chief-of-Staff / Operational Intelligence",
  },

  // Tier 2: peers (House colours per CAST-CANON Tier 2)
  betsy: {
    id: "betsy",
    tier: "peer",
    houseColour: "Royal Lavender",
    named: true,
    canonSpecialty: "Parallel Exit — daydreamer, the route out of linear",
  },
  dottie: {
    id: "dottie",
    tier: "peer",
    houseColour: "Peach Pale",
    named: true,
    canonSpecialty: "Resistance Intel — sceptic-in-residence, reads the fine print",
  },
  lottie: {
    id: "lottie",
    tier: "peer",
    houseColour: "Buttercream",
    named: true,
    canonSpecialty: "The Ceiling — names the unspeakable, romance specialist",
  },
  millie: {
    id: "millie",
    tier: "peer",
    houseColour: "Cloud Blue",
    named: true,
    canonSpecialty: "The Iron Ribbon — quiet repair, the second-pass-through",
  },
  trixie: {
    id: "trixie",
    tier: "peer",
    houseColour: "Mint Fresh",
    named: true,
    canonSpecialty: "Pipeline Overseer — surfaces friction, keeps the flow honest",
  },

  // Tier 3: department-heads
  "dance-tutor": {
    id: "dance-tutor",
    tier: "department-head",
    headKind: "dance",
    named: false,
    canonSpecialty: "Choreographer / Somatic discipline",
  },
  logistician: {
    id: "logistician",
    tier: "department-head",
    headKind: "maths",
    named: false,
    canonSpecialty: "Mathematics, Pricing, Outcome measurement",
  },
  marcel: {
    id: "marcel",
    tier: "department-head",
    headKind: "stylist",
    named: true,
    canonSpecialty: "Stylist / Aesthetic governance / Architecture",
  },
  physicist: {
    id: "physicist",
    tier: "department-head",
    headKind: "physics",
    named: false,
    canonSpecialty: "Lighting / Optics / Waveguides",
  },
  shelly: {
    id: "shelly",
    tier: "department-head",
    headKind: "tutor",
    named: true,
    canonSpecialty: "Tutor / Socratic instruction / Patient-led discovery",
  },
  tim: {
    id: "tim",
    tier: "department-head",
    headKind: "photographer",
    named: true,
    canonSpecialty: "Photographer / Visual archive / Documentation",
  },

  // Tier 4: extras (website-only, not in the canon docs' 14)
  "excavation-bot": {
    id: "excavation-bot",
    tier: "extra",
    named: true,
  },
  scribe: {
    id: "scribe",
    tier: "extra",
    named: true,
  },
};

/** Lookup helper. Throws on unknown id to surface registration mismatches. */
export function getHierarchy(id: CastMemberId): CanonHierarchyEntry {
  const entry = HIERARCHY[id];
  if (!entry) {
    throw new Error(`canon-hierarchy: no entry for id "${id}" — add to HIERARCHY in lib/cast/canon-hierarchy.ts`);
  }
  return entry;
}

/** All entries at a given tier. */
export function listByTier(tier: CastTier): CanonHierarchyEntry[] {
  return Object.values(HIERARCHY).filter((e) => e.tier === tier);
}

/** All named cast members (excludes NAME TBD heads). */
export function listNamed(): CanonHierarchyEntry[] {
  return Object.values(HIERARCHY).filter((e) => e.named !== false);
}

/** All entries that are part of the canon-14 (excludes extras). */
export function listCanon14(): CanonHierarchyEntry[] {
  return Object.values(HIERARCHY).filter((e) => e.tier !== "extra");
}

/** All entries at any tier, alphabetised by id. */
export function listAllHierarchy(): CanonHierarchyEntry[] {
  return Object.values(HIERARCHY).sort((a, b) => a.id.localeCompare(b.id));
}
