/**
 * lib/atelier/cross-references.ts — Atelier ↔ Demos / Articles / Journal
 *
 * One-line role: a flat lookup table from atelier asset (mesh, brush,
 * genome, algorithm, kata-move) to the demos / articles / journal
 * entries / tutorials they appear in. Atelier cards consume this via
 * `<UsedIn>` and render a "Used in:" chip strip.
 *
 * # Why a side table, not a field on each asset
 * The asset registries (lib/assets/meshes.ts etc.) are big (~50+
 * entries each) and authored as flat data. Adding `usedIn` fields to
 * every entry would force a backfill across all five registries and
 * make merge-conflicts likely. A side table keeps the asset registries
 * untouched and lets a single editor maintain the cross-link graph.
 *
 * # Coverage
 * This file is intentionally incomplete on first wire — it ships the
 * pattern with a small set of confirmed cross-links. Adding more is a
 * one-line edit; cards gracefully render nothing when an asset has no
 * entry.
 *
 * # Key format
 * `<kind>:<slug>` — e.g. `mesh:gyroid-arc`, `genome:gen0001-biomech-seed`,
 * `algorithm:marching-cubes`, `brush:fastled-rainbow`, `kata-move:weave`.
 */

export type AtelierRefKind =
  | "demo"
  | "article"
  | "journal"
  | "tutorial"
  | "codex"
  | "page";

export type AtelierRef = {
  kind: AtelierRefKind;
  /** Display label — the title the visitor sees on the chip. */
  label: string;
  /** Internal route, including the leading slash. */
  href: string;
  /** Optional one-line context for tooltip / aria-label. */
  context?: string;
};

/**
 * Lookup by asset key. Each entry is the list of places that asset
 * shows up. The atelier card looks the entry up at render time and
 * renders chips only if there are matches.
 */
export const ATELIER_CROSS_REFS: Record<string, AtelierRef[]> = {
  // --- Meshes -----------------------------------------------------------
  "mesh:template-sculpture": [
    {
      kind: "article",
      label: "How the studio breeds sculptures",
      href: "/articles/how-the-studio-breeds-sculptures",
      context: "the template-sculpture is the seed for evolved breeds",
    },
    {
      kind: "demo",
      label: "Evolution demo",
      href: "/demo/evolution",
    },
  ],
  "mesh:gen0001-biomech-seed": [
    {
      kind: "demo",
      label: "Evolution demo",
      href: "/demo/evolution",
    },
    {
      kind: "page",
      label: "Atelier · Evolution",
      href: "/atelier/evolution",
    },
  ],
  "mesh:gen1429-biomech-late": [
    {
      kind: "demo",
      label: "Evolution demo",
      href: "/demo/evolution",
      context: "late-generation breed, contrasted with gen0001",
    },
    {
      kind: "page",
      label: "Atelier · Evolution",
      href: "/atelier/evolution",
    },
  ],
  "mesh:dragon-scales-wall-art": [
    {
      kind: "article",
      label: "Belt-printed wall reliefs",
      href: "/articles/belt-printed-wall-reliefs",
    },
    {
      kind: "journal",
      label: "The first wall array",
      href: "/journal/the-first-wall-array",
    },
  ],
  "mesh:phyllotaxis-wall-art": [
    {
      kind: "article",
      label: "Belt-printed wall reliefs",
      href: "/articles/belt-printed-wall-reliefs",
    },
  ],

  // --- Algorithms -------------------------------------------------------
  "algorithm:marching-cubes": [
    {
      kind: "codex",
      label: "Marching Cubes",
      href: "/codex/marching-cubes",
    },
    {
      kind: "journal",
      label: "Eleven mammoths in three hours",
      href: "/journal/eleven-mammoths-in-three-hours",
      context: "marching-cubes split into smaller siblings",
    },
    {
      kind: "article",
      label: "Nine seconds — prompt to printable",
      href: "/articles/nine-seconds-prompt-to-printable",
    },
  ],
  "algorithm:gyroid-tpms": [
    {
      kind: "codex",
      label: "Gyroid Surfaces",
      href: "/codex/gyroid-surfaces",
    },
    {
      kind: "journal",
      label: "Eleven mammoths in three hours",
      href: "/journal/eleven-mammoths-in-three-hours",
      context: "gyroid-surfaces was the test scene for the marching-cubes split",
    },
  ],
  "algorithm:dla": [
    {
      kind: "demo",
      label: "Aura talks (algorithm context)",
      href: "/demo/aura-talks",
    },
  ],

  // --- Kata moves -------------------------------------------------------
  "kata-move:weave": [
    {
      kind: "codex",
      label: "Poi",
      href: "/codex/poi",
    },
    {
      kind: "journal",
      label: "Year One, Fire",
      href: "/journal/year-one-fire",
    },
    {
      kind: "tutorial",
      label: "Spinning fire poi safely",
      href: "/tutorials/spinning-fire-poi-safely",
    },
  ],

  // --- Brushes ----------------------------------------------------------
  // (Add entries as the brushes registry matures.)
};

/** Lookup helper — returns the list (possibly empty) for a given key. */
export function getAtelierCrossRefs(
  kind: "mesh" | "brush" | "genome" | "algorithm" | "kata-move",
  slug: string,
): AtelierRef[] {
  return ATELIER_CROSS_REFS[`${kind}:${slug}`] ?? [];
}
