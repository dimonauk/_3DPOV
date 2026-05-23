/**
 * lib/glitch/taxonomy.ts — Glitch event taxonomy.
 *
 * The glitch system is the site's native event language. Every meaningful
 * thing that happens in the Hangar fires a GlitchEvent. Events produce
 * GlitchTokens. Tokens accumulate into the user's GlitchSignature, and
 * tokens of the same genre compound into a GlitchChain whose visual
 * weight scales with depth.
 *
 * This file is data + pure helpers — no state, no side effects, no
 * imports from React/Zustand/Firebase. The Zustand slice that holds
 * runtime state lives at lib/state/glitch.ts.
 *
 * # Two-tier taxonomy
 *
 *   Genre  — broad bucket (navigation, atelier, lore, chrono, …). A
 *            chain only compounds inside one genre.
 *   Family — specific event (nav.page-change, atelier.chamber-open, …).
 *            Every family belongs to exactly one genre via `family→genre`.
 *
 * The taxonomy is closed: callers pass a string literal that's
 * type-checked against the `GlitchFamily` enum. New families ship as
 * code, not config — the post effect has to know about them.
 *
 * # Why string-keyed enums
 *
 * We persist signatures to Firestore. Numeric enum values reorder if
 * the enum gets edited; string keys are stable across releases.
 */

export const GlitchGenre = {
  Navigation: "navigation",
  Atelier: "atelier",
  Lore: "lore",
  Chrono: "chrono",
  Social: "social",
  Commerce: "commerce",
  Error: "error",
} as const;
export type GlitchGenre = (typeof GlitchGenre)[keyof typeof GlitchGenre];

/** The complete list of genres, in canonical display order. */
export const ALL_GENRES: ReadonlyArray<GlitchGenre> = Object.freeze([
  GlitchGenre.Navigation,
  GlitchGenre.Atelier,
  GlitchGenre.Lore,
  GlitchGenre.Chrono,
  GlitchGenre.Social,
  GlitchGenre.Commerce,
  GlitchGenre.Error,
]);

/**
 * Closed list of event families. Add a new family here when wiring a
 * new event source; the post effect and any analytics surface will
 * pick it up via the genre mapping below.
 *
 * Naming: `<genre-stem>.<verb-phrase>`. Stable across releases — these
 * are persisted in Firestore.
 */
export const GlitchFamily = {
  // Navigation
  "nav.page-change": { genre: GlitchGenre.Navigation, weight: 1 },
  "nav.deep-link": { genre: GlitchGenre.Navigation, weight: 2 },
  "nav.back-navigation": { genre: GlitchGenre.Navigation, weight: 1 },

  // Atelier
  "atelier.chamber-open": { genre: GlitchGenre.Atelier, weight: 2 },
  "atelier.output-saved": { genre: GlitchGenre.Atelier, weight: 4 },
  "atelier.cross-chamber": { genre: GlitchGenre.Atelier, weight: 3 },

  // Lore (codex / articles / tutorials / canon)
  "lore.codex-read": { genre: GlitchGenre.Lore, weight: 2 },
  "lore.article-read": { genre: GlitchGenre.Lore, weight: 2 },
  "lore.tutorial-completed": { genre: GlitchGenre.Lore, weight: 5 },
  "lore.canon-deep-link": { genre: GlitchGenre.Lore, weight: 3 },

  // Chrono-protocol + Aura
  "chrono.mode-shift": { genre: GlitchGenre.Chrono, weight: 3 },
  "chrono.aura-pulse": { genre: GlitchGenre.Chrono, weight: 2 },

  // Social (cards / rookery / drops as a social act)
  "social.card-scanned": { genre: GlitchGenre.Social, weight: 4 },
  "social.rookery-visit": { genre: GlitchGenre.Social, weight: 2 },
  "social.holo-walk-plaque": { genre: GlitchGenre.Social, weight: 3 },

  // Commerce
  "commerce.bureau-quote": { genre: GlitchGenre.Commerce, weight: 4 },
  "commerce.drop-claim": { genre: GlitchGenre.Commerce, weight: 6 },

  // Errors — count toward the signature but with a different visual read
  "error.four-oh-four": { genre: GlitchGenre.Error, weight: 2 },
  "error.client-exception": { genre: GlitchGenre.Error, weight: 3 },
  "error.capability-down": { genre: GlitchGenre.Error, weight: 2 },
} as const;
export type GlitchFamily = keyof typeof GlitchFamily;

/** All family keys, frozen, in declaration order. */
export const ALL_FAMILIES: ReadonlyArray<GlitchFamily> = Object.freeze(
  Object.keys(GlitchFamily) as GlitchFamily[],
);

// ---------------------------------------------------------------------------
// Tokens, chains, signatures
// ---------------------------------------------------------------------------

export type GlitchToken = {
  /** v4 uuid — used for dedupe across server-push paths. */
  id: string;
  family: GlitchFamily;
  genre: GlitchGenre;
  /** Epoch millis on the firing client/server. */
  firedAt: number;
  /** Free-form attribution payload. Keep small; persisted with the token. */
  meta: Record<string, unknown>;
};

/**
 * A compounding chain of tokens of the same genre. The chain advances
 * while tokens keep arriving inside the TTL window; when stale, the
 * Zustand slice deletes it.
 *
 * `depth` is the visual driver — the post effect maps depth → strength.
 * It's capped to keep the screen from going feral when the visitor
 * deep-explores one genre for ten minutes straight.
 */
export type GlitchChain = {
  genre: GlitchGenre;
  /** 1 on first token, up to CHAIN_DEPTH_CAP. */
  depth: number;
  /** Sum of `family.weight` over the chain — drives some animations. */
  intensity: number;
  /** When the chain started. */
  firstFiredAt: number;
  /** Last token's firedAt — drives the TTL decay. */
  lastFiredAt: number;
  /** Ring of recent token ids; oldest first. Capped at CHAIN_RING. */
  tokenIds: string[];
};

/** Cap on chain depth — beyond this the visual stops growing. */
export const CHAIN_DEPTH_CAP = 8;

/** Cap on the token-id ring kept per chain. */
const CHAIN_RING = 16;

/**
 * Persisted user identity. Survives across sessions in Firestore under
 * `glitch-signatures/<uid>`.
 *
 * Empty tokenCounts / genreCounts records are normal — the slice fills
 * them in as tokens fire, and the post effect treats missing keys as 0.
 */
export type GlitchSignature = {
  tokenCounts: Record<GlitchFamily, number>;
  genreCounts: Record<GlitchGenre, number>;
  totalTokens: number;
  /** First-ever event firedAt for this user. Null on a fresh user. */
  firstSeenAt: number | null;
  /** Most-recent event firedAt. Null on a fresh user. */
  lastSeenAt: number | null;
};

// ---------------------------------------------------------------------------
// Pure helpers consumed by the slice
// ---------------------------------------------------------------------------

/**
 * Advance (or start) a chain with a new token. Pure function — caller
 * decides whether to write the returned chain back to the active map.
 */
export function resolveChain(
  existing: GlitchChain | undefined,
  token: GlitchToken,
): GlitchChain {
  const weight = GlitchFamily[token.family].weight;

  if (!existing || existing.genre !== token.genre) {
    return {
      genre: token.genre,
      depth: 1,
      intensity: weight,
      firstFiredAt: token.firedAt,
      lastFiredAt: token.firedAt,
      tokenIds: [token.id],
    };
  }

  const tokenIds = [...existing.tokenIds, token.id].slice(-CHAIN_RING);
  return {
    genre: existing.genre,
    depth: Math.min(existing.depth + 1, CHAIN_DEPTH_CAP),
    intensity: existing.intensity + weight,
    firstFiredAt: existing.firstFiredAt,
    lastFiredAt: token.firedAt,
    tokenIds,
  };
}

/**
 * Map a signature to a 0–1 scalar that the post effect uses as its
 * overall visual weight. Two factors compound:
 *
 *   - depth: log-curved on totalTokens, capped at SATURATION_TOKENS.
 *     A first-time visitor reads at ~0.05; a regular reads at ~0.5;
 *     someone who's been on the site for months tops out near 1.
 *   - diversity: distinct genres touched / total genres. A visitor who
 *     stays in one corner of the site reads softer than one who has
 *     touched the whole map.
 *
 * The product is clamped to [0, 1]. Returns 0 for an empty signature.
 */
export function signatureWeight(sig: GlitchSignature): number {
  if (sig.totalTokens <= 0) return 0;

  const SATURATION_TOKENS = 400;
  const depth =
    Math.log10(sig.totalTokens + 1) / Math.log10(SATURATION_TOKENS + 1);

  const touchedGenres = ALL_GENRES.reduce(
    (acc, g) => acc + ((sig.genreCounts[g] ?? 0) > 0 ? 1 : 0),
    0,
  );
  const diversity = touchedGenres / ALL_GENRES.length;

  // Diversity floor at 0.5 — a single-genre power user still reads
  // strongly; the diversity multiplier rewards exploration, not gates it.
  const diversityFactor = 0.5 + 0.5 * diversity;

  const combined = depth * diversityFactor;
  return Math.max(0, Math.min(1, combined));
}

/**
 * Active visual weight contributed by hot chains, separate from the
 * accumulated signature. The composite effect adds this on top of
 * signatureWeight — a fresh visitor still gets a visible glitch hit
 * when something exciting happens.
 *
 * Returns 0 when the map is empty.
 */
export function chainsWeight(activeChains: ReadonlyMap<GlitchGenre, GlitchChain>): number {
  if (activeChains.size === 0) return 0;
  let total = 0;
  for (const chain of activeChains.values()) {
    total += chain.depth / CHAIN_DEPTH_CAP;
  }
  // Average across genres so two-deep + two-deep doesn't double-saturate.
  return Math.max(0, Math.min(1, total / ALL_GENRES.length));
}
