/**
 * lib/evolution/product-presets.ts — Per-product configuration for the
 * EvolutionComposer chamber primitive.
 *
 * One-line role: the data table that bends the generic breeding-floor
 * mechanic into a product-specific design surface (wall piece, wall
 * array, jewellery).
 *
 * # Why this exists
 *
 * The breeding-floor chamber proved the generic loop — population →
 * pick → mutate / breed → next generation. The studio sells three
 * product families that all start from a sculpture genome but differ
 * in scale, kingdoms, output shape, and commission CTA:
 *
 *   - Wall piece: 200-600mm, biomech / curvilinear / artistic; one
 *     output. Commission link → /services/bespoke-waveguide-sculpture.
 *   - Wall array: a 3x3 or 4x4 grid of pieces from one shared parent
 *     lineage; smaller per-piece (100-300mm); same kingdoms as wall
 *     piece. Commission link → /services/belt-printed-wall-reliefs.
 *   - Jewellery: 8-40mm, artistic / curvilinear / biomech; gem genes
 *     biased active; mount picker (pendant / earring / ring).
 *     Commission link → /services (jewellery service slug TBD).
 *
 * Each preset feeds the same `<EvolutionComposer>` component with
 * different defaults + a `<ProductFooter>` slot for the CTA.
 */

import type { SculptureKingdom } from "../assets/genomes";

export type ProductId = "wall-piece" | "wall-array" | "jewellery";

export type EvolutionProductPreset = {
  id: ProductId;
  /** Display name for the chamber header. */
  name: string;
  /** Aura-voice one-liner under the title. */
  blurb: string;
  /** Allowed kingdoms — chamber filters its initial population accordingly. */
  kingdoms: SculptureKingdom[];
  /** Population size. Wall + jewellery use 12; arrays use 9 (3x3) or 16 (4x4). */
  populationSize: number;
  /** How the output set is shown. "single" = one mesh; "grid-NxN" = arranged. */
  outputArrangement: "single" | "grid-3x3" | "grid-4x4";
  /** Physical scale band for the piece (mm). Used in copy + future quoting. */
  scaleRangeMm: readonly [number, number];
  /** Gene-bias modulators applied at seed time (0..1; 0.5 = neutral). */
  geneBias?: Partial<Record<string, number>>;
  /** CTA copy + href once the visitor has a kept piece. */
  cta: {
    label: string;
    href: string;
    /** Note shown beneath the CTA — "calendar-gated", "interest-list", etc. */
    note?: string;
  };
};

export const EVOLUTION_PRODUCT_PRESETS: Record<ProductId, EvolutionProductPreset> = {
  "wall-piece": {
    id: "wall-piece",
    name: "Wall Piece Designer",
    blurb:
      "A single waveguide sculpture for a wall. Breed the population until one piece holds the room, then commission the print.",
    kingdoms: ["biomech", "curvilinear", "artistic"],
    populationSize: 12,
    outputArrangement: "single",
    scaleRangeMm: [200, 600],
    cta: {
      label: "Commission this piece",
      href: "/contact?intent=wall-piece",
      note:
        "Bespoke waveguide sculpture commissions — calendar-gated. Confirm the genome and the studio replies with a slot + quote.",
    },
  },
  "wall-array": {
    id: "wall-array",
    name: "Wall Array Designer",
    blurb:
      "Nine or sixteen pieces from one shared parent lineage. The array reads as a rhythm; the parent is the chord.",
    kingdoms: ["biomech", "curvilinear", "artistic", "assemblage"],
    populationSize: 9,
    outputArrangement: "grid-3x3",
    scaleRangeMm: [100, 300],
    cta: {
      label: "Commission this array",
      href: "/services/belt-printed-wall-reliefs",
      note:
        "Belt-printed wall reliefs — runs of 9 or 16 pieces share lineage and finish. The whole array commissions as one slot.",
    },
  },
  jewellery: {
    id: "jewellery",
    name: "Jewellery Designer",
    blurb:
      "Wearable waveguide. The same evolution loop the bench uses, tuned for wearable scale and gem-rich genomes.",
    kingdoms: ["artistic", "curvilinear", "biomech"],
    populationSize: 12,
    outputArrangement: "single",
    scaleRangeMm: [8, 40],
    geneBias: {
      gem_count: 0.7,
      gem_radius: 0.55,
      gem_hue: 0.5,
      hue_drift: 0.4,
    },
    cta: {
      label: "Commission this piece",
      href: "/contact?intent=jewellery",
      note:
        "Wearable waveguide pieces — interest list. Confirm the genome and the studio adds you to the next cohort.",
    },
  },
};

export const PRODUCT_IDS: ProductId[] = ["wall-piece", "wall-array", "jewellery"];

export function getProductPreset(id: ProductId): EvolutionProductPreset {
  return EVOLUTION_PRODUCT_PRESETS[id];
}
