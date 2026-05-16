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
  "algorithm:gyroid": [
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
    {
      kind: "article",
      label: "Nine seconds — prompt to printable",
      href: "/articles/nine-seconds-prompt-to-printable",
    },
  ],
  "algorithm:spiral": [
    {
      kind: "article",
      label: "Spiral cognition",
      href: "/articles/spiral-cognition",
    },
  ],
  "algorithm:dla": [
    {
      kind: "demo",
      label: "Aura talks",
      href: "/demo/aura-talks",
    },
  ],
  "algorithm:fermat-spiral": [
    {
      kind: "article",
      label: "Spiral cognition",
      href: "/articles/spiral-cognition",
    },
  ],
  "algorithm:lsystem": [
    {
      kind: "article",
      label: "How the studio breeds sculptures",
      href: "/articles/how-the-studio-breeds-sculptures",
    },
  ],
  "algorithm:reaction-diffusion": [
    {
      kind: "article",
      label: "The mathematics of morphing",
      href: "/articles/the-mathematics-of-morphing",
    },
  ],
  "algorithm:voronoi": [
    {
      kind: "article",
      label: "The eight kingdoms",
      href: "/articles/the-eight-kingdoms",
    },
  ],
  "algorithm:auxetic": [
    {
      kind: "article",
      label: "The mathematics of morphing",
      href: "/articles/the-mathematics-of-morphing",
    },
  ],
  "algorithm:tensegrity": [
    {
      kind: "article",
      label: "Belt-printed wall reliefs",
      href: "/articles/belt-printed-wall-reliefs",
    },
  ],
  "algorithm:lsystem-tube": [
    {
      kind: "article",
      label: "The jewellery algorithms",
      href: "/articles/the-jewellery-algorithms",
    },
  ],
  "algorithm:wing-venation": [
    {
      kind: "article",
      label: "The jewellery algorithms",
      href: "/articles/the-jewellery-algorithms",
    },
  ],
  "algorithm:non-euclidean": [
    {
      kind: "article",
      label: "The mathematics of morphing",
      href: "/articles/the-mathematics-of-morphing",
    },
  ],
  "algorithm:penrose-tiling": [
    {
      kind: "article",
      label: "The jewellery algorithms",
      href: "/articles/the-jewellery-algorithms",
    },
  ],
  "algorithm:celtic-knot": [
    {
      kind: "article",
      label: "The jewellery algorithms",
      href: "/articles/the-jewellery-algorithms",
    },
  ],

  // --- Kata moves -------------------------------------------------------
  "kata-move:weave-three-beat": [
    {
      kind: "codex",
      label: "Poi",
      href: "/codex/poi",
      context: "the three-beat weave is the standard 4-petal flower",
    },
    {
      kind: "tutorial",
      label: "Spinning fire poi safely",
      href: "/tutorials/spinning-fire-poi-safely",
    },
    {
      kind: "article",
      label: "Choreographing with Laban",
      href: "/articles/choreographing-with-laban",
    },
  ],
  "kata-move:cross-low": [
    {
      kind: "tutorial",
      label: "Spinning fire poi safely",
      href: "/tutorials/spinning-fire-poi-safely",
    },
    {
      kind: "article",
      label: "Choreographing with Laban",
      href: "/articles/choreographing-with-laban",
    },
  ],
  "kata-move:cross-high": [
    {
      kind: "tutorial",
      label: "Spinning fire poi safely",
      href: "/tutorials/spinning-fire-poi-safely",
    },
  ],
  "kata-move:cross-buzzsaw": [
    {
      kind: "journal",
      label: "Year One, Fire",
      href: "/journal/year-one-fire",
      context: "buzzsaw was the first move I burned a glove on",
    },
  ],
  "kata-move:windmill-forward": [
    {
      kind: "tutorial",
      label: "Spinning fire poi safely",
      href: "/tutorials/spinning-fire-poi-safely",
    },
    {
      kind: "article",
      label: "Choreographing with Laban",
      href: "/articles/choreographing-with-laban",
    },
  ],

  // --- Brushes ----------------------------------------------------------
  "brush:fire": [
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
  "brush:rainbow": [
    {
      kind: "tutorial",
      label: "Your first long exposure",
      href: "/tutorials/your-first-long-exposure",
    },
  ],
  "brush:lightwire": [
    {
      kind: "article",
      label: "Why I build my own rigs",
      href: "/articles/why-i-build-my-own-rigs",
    },
  ],
  "brush:waveform": [
    {
      kind: "article",
      label: "Colour without pigment",
      href: "/articles/colour-without-pigment",
    },
  ],
  "brush:chromawave": [
    {
      kind: "article",
      label: "Colour without pigment",
      href: "/articles/colour-without-pigment",
    },
  ],
  "brush:poi": [
    {
      kind: "article",
      label: "Why I build my own rigs",
      href: "/articles/why-i-build-my-own-rigs",
    },
    {
      kind: "journal",
      label: "Year One, Fire",
      href: "/journal/year-one-fire",
    },
  ],
  "brush:plasma": [
    {
      kind: "article",
      label: "Colour without pigment",
      href: "/articles/colour-without-pigment",
    },
  ],
  "brush:silk": [
    {
      kind: "article",
      label: "Colour without pigment",
      href: "/articles/colour-without-pigment",
    },
  ],
  "brush:silkbloom": [
    {
      kind: "article",
      label: "Colour without pigment",
      href: "/articles/colour-without-pigment",
    },
  ],
  "brush:silkplasma": [
    {
      kind: "article",
      label: "Colour without pigment",
      href: "/articles/colour-without-pigment",
    },
  ],
  "brush:neonpulse": [
    {
      kind: "article",
      label: "Why I build my own rigs",
      href: "/articles/why-i-build-my-own-rigs",
    },
  ],
  "brush:embers": [
    {
      kind: "journal",
      label: "Year One, Fire",
      href: "/journal/year-one-fire",
    },
  ],
};

/** Lookup helper — returns the list (possibly empty) for a given key. */
export function getAtelierCrossRefs(
  kind: "mesh" | "brush" | "genome" | "algorithm" | "kata-move",
  slug: string,
): AtelierRef[] {
  return ATELIER_CROSS_REFS[`${kind}:${slug}`] ?? [];
}
