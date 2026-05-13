/**
 * lib/assets/algorithms.ts — Catalogue of the 30 jewellery algorithms.
 *
 * The full source (TypeScript, extending BaseAlgorithm) lives at
 * D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\algorithms\.
 * Porting all 30 into the site is queued for a follow-up migration
 * pass (they share a class hierarchy that needs to come over too).
 *
 * This catalogue is the metadata: every algorithm is named, its id
 * matches the registry, and the notes describe what shape the
 * algorithm produces. The site's /atelier route uses this to surface
 * the catalogue as content; the algorithms themselves run in The
 * Hangar's Dolly_OS at port 5139.
 *
 * Taxonomy categories migrated from
 * D:\The_Hangar\Dolly_OS\src\systems\jewel-array\taxonomy\FamilyTaxonomy.ts
 * (STYLE_CATEGORIES, 8 style families).
 */

export type AlgorithmFamily =
  | "BIOMIMETIC"
  | "GEOMETRIC"
  | "CULTURAL-HISTORICAL"
  | "WITCHCORE"
  | "RETROFUTURIST"
  | "MECHANICAL-ORGANIC"
  | "SURREAL-SCALE"
  | "MEMPHIS-CYBER";

export type AlgorithmCatalogueEntry = {
  /** Numeric id matching the registry (algo_NN_*). */
  id: number;
  name: string;
  /** Stable slug. */
  slug: string;
  /** Source filename in Dolly_OS for reference. */
  sourceFile: string;
  /** Primary style family. */
  family: AlgorithmFamily;
  /** One-sentence description of what the algorithm produces. */
  notes: string;
};

export const algorithms: AlgorithmCatalogueEntry[] = [
  {
    id: 1,
    name: "Logarithmic Spiral",
    slug: "spiral",
    sourceFile: "algo_01_Spiral.ts",
    family: "GEOMETRIC",
    notes:
      "Logarithmic and Fermat spirals; the seashell curve. Parameters: growth rate, revolutions, vertical climb.",
  },
  {
    id: 2,
    name: "Gyroid",
    slug: "gyroid",
    sourceFile: "algo_02_Gyroid.ts",
    family: "GEOMETRIC",
    notes:
      "Schoen's triply-periodic minimal surface; the gyroid lattice that prints with no internal supports.",
  },
  {
    id: 3,
    name: "L-System",
    slug: "lsystem",
    sourceFile: "algo_03_LSystem.ts",
    family: "BIOMIMETIC",
    notes:
      "Recursive grammar; ferns, trees, snowflakes. The classic Lindenmayer-system fractal generator.",
  },
  {
    id: 4,
    name: "Auxetic Corrugation",
    slug: "auxetic",
    sourceFile: "algo_04_AuxeticCorrugation.ts",
    family: "MECHANICAL-ORGANIC",
    notes:
      "Negative-Poisson-ratio lattice; the structure that gets wider when pulled. Inspired by dragonfly wing venation.",
  },
  {
    id: 5,
    name: "Fermat Spiral",
    slug: "fermat-spiral",
    sourceFile: "algo_05_FermatSpiral.ts",
    family: "BIOMIMETIC",
    notes:
      "Sunflower-seed packing at the golden angle of 137.5 degrees; the densest disc tessellation by a single rule.",
  },
  {
    id: 6,
    name: "DLA (Diffusion-Limited Aggregation)",
    slug: "dla",
    sourceFile: "algo_06_DLA.ts",
    family: "BIOMIMETIC",
    notes:
      "Random walkers stick to a growing cluster; produces snowflake-like fractal aggregates.",
  },
  {
    id: 7,
    name: "Voronoi",
    slug: "voronoi",
    sourceFile: "algo_07_Voronoi.ts",
    family: "GEOMETRIC",
    notes:
      "Voronoi tessellation; cells assigned to nearest seed-point. The honeycomb logic.",
  },
  {
    id: 8,
    name: "L-System Tube",
    slug: "lsystem-tube",
    sourceFile: "algo_08_LSystemTube.ts",
    family: "BIOMIMETIC",
    notes:
      "L-system whose branches are tubular geometry; reads as veins or root structures.",
  },
  {
    id: 9,
    name: "Geodesic Spines",
    slug: "geodesic-spines",
    sourceFile: "algo_09_GeodesicSpines.ts",
    family: "GEOMETRIC",
    notes:
      "Spines following geodesic curves over a sphere; the Buckminster-Fuller logic applied to jewellery.",
  },
  {
    id: 10,
    name: "Celtic Knot",
    slug: "celtic-knot",
    sourceFile: "algo_10_CelticKnot.ts",
    family: "CULTURAL-HISTORICAL",
    notes:
      "Interlaced over-under knotwork generator; the Irish-monastic tradition formalised.",
  },
  {
    id: 11,
    name: "Swept Sinuous",
    slug: "swept-sinuous",
    sourceFile: "algo_11_SweptSinuous.ts",
    family: "MECHANICAL-ORGANIC",
    notes:
      "Sinuous curve swept along a profile; produces flowing tubular forms.",
  },
  {
    id: 12,
    name: "PCB Trace",
    slug: "pcb-trace",
    sourceFile: "algo_12_PCBTrace.ts",
    family: "RETROFUTURIST",
    notes:
      "Circuit-board trace routing; right-angle and 45-degree paths between named nodes.",
  },
  {
    id: 13,
    name: "Gear",
    slug: "gear",
    sourceFile: "algo_13_Gear.ts",
    family: "RETROFUTURIST",
    notes:
      "Involute-gear-tooth generator; mechanical jewellery that meshes.",
  },
  {
    id: 14,
    name: "Skull SDF",
    slug: "skull-sdf",
    sourceFile: "algo_14_SkullSDF.ts",
    family: "WITCHCORE",
    notes:
      "Signed-distance-field skull; the witchcore base mesh. Marching-cubes over a parametric skull SDF.",
  },
  {
    id: 15,
    name: "Wing Venation",
    slug: "wing-venation",
    sourceFile: "algo_15_WingVenation.ts",
    family: "BIOMIMETIC",
    notes:
      "Insect-wing venation; the branching Murray's-law geometry that carries hemolymph through the membrane.",
  },
  {
    id: 16,
    name: "Penrose Tiling",
    slug: "penrose-tiling",
    sourceFile: "algo_16_PenroseTiling.ts",
    family: "GEOMETRIC",
    notes:
      "Aperiodic two-tile Penrose tessellation; the kite-and-dart system.",
  },
  {
    id: 17,
    name: "Reaction-Diffusion",
    slug: "reaction-diffusion",
    sourceFile: "algo_17_ReactionDiffusion.ts",
    family: "BIOMIMETIC",
    notes:
      "Turing reaction-diffusion patterns; leopard spots, zebra stripes, the chemistry of natural pattern.",
  },
  {
    id: 18,
    name: "Tensegrity",
    slug: "tensegrity",
    sourceFile: "algo_18_Tensegrity.ts",
    family: "MECHANICAL-ORGANIC",
    notes:
      "Compression-tension structures; rigid struts suspended in a network of cables.",
  },
  {
    id: 19,
    name: "Sigil",
    slug: "sigil",
    sourceFile: "algo_19_Sigil.ts",
    family: "WITCHCORE",
    notes:
      "Procedural sigil generation; the Chaos-magic line-art recipe formalised.",
  },
  {
    id: 20,
    name: "Torus Knot",
    slug: "torus-knot",
    sourceFile: "algo_20_TorusKnot.ts",
    family: "GEOMETRIC",
    notes:
      "Parametric torus knots; the (p, q) family of curves wrapping a torus.",
  },
  {
    id: 21,
    name: "Step Fret",
    slug: "step-fret",
    sourceFile: "algo_21_StepFret.ts",
    family: "CULTURAL-HISTORICAL",
    notes:
      "Mesoamerican step-fret motif; the stair-step geometry from Mixtec and Aztec friezes.",
  },
  {
    id: 22,
    name: "Interlace",
    slug: "interlace",
    sourceFile: "algo_22_Interlace.ts",
    family: "CULTURAL-HISTORICAL",
    notes:
      "General interlace generator; over-under weaving for arbitrary node graphs.",
  },
  {
    id: 23,
    name: "Mon",
    slug: "mon",
    sourceFile: "algo_23_Mon.ts",
    family: "CULTURAL-HISTORICAL",
    notes:
      "Japanese family-crest generator; circular emblems with radial symmetry.",
  },
  {
    id: 24,
    name: "Clash Compositor",
    slug: "clash-compositor",
    sourceFile: "algo_24_ClashCompositor.ts",
    family: "MEMPHIS-CYBER",
    notes:
      "Memphis-style clashing-geometry compositor; deliberate visual collision between unrelated patterns.",
  },
  {
    id: 25,
    name: "Non-Euclidean",
    slug: "non-euclidean",
    sourceFile: "algo_25_NonEuclidean.ts",
    family: "SURREAL-SCALE",
    notes:
      "Hyperbolic / spherical geometry; structures that violate Euclidean expectations of parallel lines.",
  },
  {
    id: 26,
    name: "Wigner-Seitz",
    slug: "wigner-seitz",
    sourceFile: "algo_26_WignerSeitz.ts",
    family: "GEOMETRIC",
    notes:
      "Crystallographic Wigner-Seitz cells; the unit cells of a Bravais lattice as geometry.",
  },
  {
    id: 27,
    name: "Spinodal",
    slug: "spinodal",
    sourceFile: "algo_27_Spinodal.ts",
    family: "BIOMIMETIC",
    notes:
      "Spinodal-decomposition pattern; the bicontinuous foam that forms when two liquids unmix.",
  },
  {
    id: 28,
    name: "Ribbon Helix",
    slug: "ribbon-helix",
    sourceFile: "algo_28_RibbonHelix.ts",
    family: "GEOMETRIC",
    notes:
      "Ribbon swept along a helical curve; the simplest twisted-band form.",
  },
  {
    id: 29,
    name: "Enneper",
    slug: "enneper",
    sourceFile: "algo_29_Enneper.ts",
    family: "GEOMETRIC",
    notes:
      "Enneper minimal surface; a classical self-intersecting minimal surface.",
  },
  {
    id: 30,
    name: "Diatom Hex",
    slug: "diatom-hex",
    sourceFile: "algo_30_DiatomHex.ts",
    family: "BIOMIMETIC",
    notes:
      "Diatom-shell hexagonal pattern; the silica geometry of single-celled algae.",
  },
];

export const algorithmFamilies: {
  id: AlgorithmFamily;
  name: string;
  dna: string;
  colorSignal: string;
}[] = [
  {
    id: "BIOMIMETIC",
    name: "Biomimetic",
    dna: "Pure biology, no cultural reference",
    colorSignal: "#008080",
  },
  {
    id: "GEOMETRIC",
    name: "Geometric",
    dna: "Pure math, clean forms",
    colorSignal: "#00ffff",
  },
  {
    id: "CULTURAL-HISTORICAL",
    name: "Cultural-Historical",
    dna: "Celtic / Byzantine / Mesoamerican / Edo",
    colorSignal: "#ffd700",
  },
  {
    id: "WITCHCORE",
    name: "Witchcore",
    dna: "Thorns, moths, sigils, skulls",
    colorSignal: "#4b0082",
  },
  {
    id: "RETROFUTURIST",
    name: "Retrofuturist",
    dna: "50s sci-fi, atomic age, space age",
    colorSignal: "#ff4500",
  },
  {
    id: "MECHANICAL-ORGANIC",
    name: "Mechanical-Organic",
    dna: "Gears growing moss, circuits as leaves",
    colorSignal: "#00ff7f",
  },
  {
    id: "SURREAL-SCALE",
    name: "Surreal-Scale",
    dna: "Microscopic enlarged, planetary shrunk",
    colorSignal: "#e6e6fa",
  },
  {
    id: "MEMPHIS-CYBER",
    name: "Memphis-Cyber",
    dna: "Clashing geometry, cyberpunk palette",
    colorSignal: "#ff69b4",
  },
];

export function getAlgorithm(
  slug: string,
): AlgorithmCatalogueEntry | undefined {
  return algorithms.find((a) => a.slug === slug);
}
