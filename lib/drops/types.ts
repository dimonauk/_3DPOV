/**
 * lib/drops/types.ts — Drop publishing surface types.
 *
 * One-line role: the typed contract for a Rookery "drop" — the
 * studio-published Sanity post that announces an editioned piece, with
 * a Bureau-Stripe-checkout buy button.
 *
 * # What a drop is (canon)
 *
 * A drop is the announcement object. The buyer journey is:
 *
 *   feed → drop card → click → drop detail → buy via Bureau Stripe
 *   checkout → studio fabrication → ship.
 *
 * Each drop is tied to one `Genome` (`lib/evolution/genome.ts`) and one
 * fabrication path. It mints N editioned outputs:
 *
 *   - 1 Unique     — the only one of its kind, ever.
 *   - 25 Limited   — the bounded edition (size configurable; default 25).
 *   - Open run     — optional unbounded pool.
 *
 * (Mirrors `EditionChoice` in `lib/bureau/types.ts`, which already
 * encodes the Unique + Limited + Open stance for the print bureau half
 * of the loop.)
 *
 * # First-refusal routing (canon)
 *
 * Tier members get first-refusal windows on drops their lineage is
 * adjacent to. The radius is:
 *
 *   - `parent-only`                      → drop's direct parent kingdom
 *   - `parent+grandparent+siblings-of-parent` → two-hop ancestry + cousins
 *   - `full-kingdom`                     → every member of the drop's kingdom
 *
 * The radius defaults per tier policy but the admin can override on a
 * drop-by-drop basis (a unique piece may want the full kingdom; a
 * limited print may want parent-only).
 *
 * # Tier-included flags
 *
 * Each tier — Member / Patron / Atelier — can mark a drop as the
 * "included monthly drop" for that tier. Multiple tiers can be true
 * (e.g. Atelier and Patron both get this drop included). The flag is
 * record-only here; the entitlement check happens at checkout time in
 * the bureau.
 *
 * # Passkit identity
 *
 * Drops mint N signed Apple Wallet passes (one per edition member) at
 * first-buyer-claim time. The Drop type carries `passkitEnabled` and
 * the per-edition pass records get stored separately. See
 * `lib/drops/mint-pass.ts`.
 */

// ---------------------------------------------------------------------------
// Tier + radius enums.
// ---------------------------------------------------------------------------

export type Tier = "member" | "patron" | "atelier";

export const ALL_TIERS: ReadonlyArray<Tier> = ["member", "patron", "atelier"];

/**
 * First-refusal window radius. Maps to a Firestore query at claim time:
 *
 *   - `parent-only`                      → docs where parentageChain[-1] === drop.parent
 *   - `parent+grandparent+siblings-of-parent` → docs where any of the last
 *                                          two ancestors match OR the
 *                                          immediate parent matches
 *   - `full-kingdom`                     → docs where kingdom === drop.kingdom
 *
 * (Full canonicalisation of the resolver lives in
 * `lib/drops/first-refusal-resolver.ts` — out of scope for this file.)
 */
export type FirstRefusalRadius =
  | "parent-only"
  | "parent+grandparent+siblings-of-parent"
  | "full-kingdom";

export const ALL_FIRST_REFUSAL_RADII: ReadonlyArray<FirstRefusalRadius> = [
  "parent-only",
  "parent+grandparent+siblings-of-parent",
  "full-kingdom",
];

// ---------------------------------------------------------------------------
// Edition config.
// ---------------------------------------------------------------------------

/**
 * Edition configuration for one drop. Mirrors `EditionChoice` in
 * `lib/bureau/types.ts` but at the drop level: one drop has all three
 * edition stances at once. The Limited size is configurable (defaults
 * to 25 per Manifesto §02). Open is optional — some drops are
 * intentionally one-of-one + 25.
 */
export type EditionConfig = {
  /** Always true for a drop — every drop has a Unique. */
  unique: true;
  /** Limited edition size. Defaults to 25; admin can override per drop. */
  limitedSize: number;
  /** Whether the Open run is enabled. When false the only paths are
   *  Unique + Limited. */
  openEnabled: boolean;
};

/**
 * Per-tier "this drop counts as the tier's monthly included drop" flags.
 * Multiple can be true. The bureau checks these at checkout to decide
 * whether the buyer's tier covers the purchase or whether Stripe takes
 * payment.
 */
export type TierIncludedFlags = {
  member: boolean;
  patron: boolean;
  atelier: boolean;
};

// ---------------------------------------------------------------------------
// Drop core record.
// ---------------------------------------------------------------------------

export type DropStatus =
  | "draft"
  | "published"
  | "sold-out"
  | "withdrawn";

/**
 * The published Drop record. Stored in Firestore under `drops/{id}`;
 * mirrored as a Sanity `rookery` post for the public feed render.
 *
 * Firestore is the source of truth for editioned commerce state
 * (counts sold, first-refusal windows, passkit records). Sanity is the
 * source of truth for editorial copy (title, summary, media). The two
 * are kept in sync by `publishDrop()` in `lib/drops/publish.ts`.
 */
export type Drop = {
  /** Stable id, kebab-case slug. URL-safe. */
  id: string;
  /** Operator's Firebase uid — the user who published this drop. */
  publishedBy: string;
  /** Public title — short. Sanity also stores this for the feed card. */
  title: string;
  /** One-paragraph summary — the feed card body + drop-detail hero. */
  summary: string;
  /** Genome that defines this drop's piece. The genome record carries
   *  the gene values + the kingdom + the parentage chain. */
  genomeId: string;
  /** Cached parentage chain at publish time. Lifted from the genome
   *  record so first-refusal queries don't need to re-fetch the genome.
   *  If the genome is later mutated, this stays as published. */
  parentageChain: ReadonlyArray<string>;
  /** Kingdom tag (techno / artistic / biomech / …) cached at publish. */
  kingdom: string;
  /** Edition configuration locked at publish. */
  edition: EditionConfig;
  /** Tier-included flags locked at publish. */
  tierIncluded: TierIncludedFlags;
  /** First-refusal window radius locked at publish. */
  firstRefusalRadius: FirstRefusalRadius;
  /** Whether passkit passes get minted at claim time. */
  passkitEnabled: boolean;
  /** Edition-state mirror — incremented as buyers claim. */
  editionState: {
    uniqueClaimed: boolean;
    limitedClaimed: number;
    /** Number of Open prints sold (Open is unbounded but we count). */
    openClaimed: number;
  };
  /** Sanity document id once the rookery post is written. */
  sanityDocId?: string;
  /** ISO 8601 timestamps. */
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  status: DropStatus;
};

// ---------------------------------------------------------------------------
// Draft (admin form local state) + publish input.
// ---------------------------------------------------------------------------

/**
 * The draft shape held in the admin form's local state. Fields are
 * mutable + the parentage chain is editable here (in practice
 * auto-populated from the genome lookup once the picker is in v2).
 */
export type DropDraft = {
  title: string;
  summary: string;
  genomeId: string;
  /** Optional override; when empty `publishDrop()` reads from the genome. */
  parentageChainOverride?: ReadonlyArray<string>;
  edition: EditionConfig;
  tierIncluded: TierIncludedFlags;
  firstRefusalRadius: FirstRefusalRadius;
  passkitEnabled: boolean;
};

/**
 * The validated POST body for `/api/admin/drops/publish`. Same shape as
 * `DropDraft` minus the override (which we collapse into a concrete
 * `parentageChain` server-side before writing).
 */
export type DropPublishInput = {
  title: string;
  summary: string;
  genomeId: string;
  /** When omitted the publisher loads the genome and reads its chain. */
  parentageChain?: ReadonlyArray<string>;
  edition: EditionConfig;
  tierIncluded: TierIncludedFlags;
  firstRefusalRadius: FirstRefusalRadius;
  passkitEnabled: boolean;
};

// ---------------------------------------------------------------------------
// Gate verdicts — used by `publishDrop()` and surfaced inline in the
// admin form when a gate fails.
// ---------------------------------------------------------------------------

export type GateVerdict =
  | { pass: true }
  | { pass: false; reasons: ReadonlyArray<string> };

export type DropPublishGateFailure = {
  error: "gate_failed";
  oracle?: GateVerdict;
  sieve?: GateVerdict;
  /** Human-readable summary the admin form renders above the form. */
  message: string;
};

// ---------------------------------------------------------------------------
// Defaults.
// ---------------------------------------------------------------------------

/** Default edition config per Manifesto §02: 1 + 25 + Open. */
export const DEFAULT_EDITION_CONFIG: EditionConfig = {
  unique: true,
  limitedSize: 25,
  openEnabled: true,
};

/** Default tier-included flags — nothing included by default; the admin
 *  ticks the relevant tiers explicitly. */
export const DEFAULT_TIER_INCLUDED: TierIncludedFlags = {
  member: false,
  patron: false,
  atelier: false,
};

/** Default first-refusal radius. `parent-only` is the canon-default
 *  per V1.2 Realignment Plan; broader windows are opt-in. */
export const DEFAULT_FIRST_REFUSAL_RADIUS: FirstRefusalRadius = "parent-only";

/** Build an empty draft for the admin form's initial state. */
export function emptyDropDraft(): DropDraft {
  return {
    title: "",
    summary: "",
    genomeId: "",
    edition: { ...DEFAULT_EDITION_CONFIG },
    tierIncluded: { ...DEFAULT_TIER_INCLUDED },
    firstRefusalRadius: DEFAULT_FIRST_REFUSAL_RADIUS,
    passkitEnabled: true,
  };
}
