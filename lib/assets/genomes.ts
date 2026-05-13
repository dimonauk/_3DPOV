/**
 * lib/assets/genomes.ts — Typed sculpture-genome catalogue.
 *
 * Migrated from D:\The_Hangar\apps\prototypes\poi-sculptor\sculpture_registry.json.
 * The full registry contains many specimens; this catalogue surfaces a
 * curated selection that demonstrates the range. The complete
 * generation script lives at /python-services/generators.py and the
 * fitness logic at /python-services/fitness.py.
 *
 * The 28-gene alphabet (named in the documentation) reduces here to
 * the subset the registry actually persists: arm geometry,
 * branching, surface, and lens parameters. Genes outside this
 * subset default in the generator.
 */

export type SculptureKingdom =
  | "techno"
  | "artistic"
  | "choreographic"
  | "biomech"
  | "thermal"
  | "protean"
  | "assemblage"
  | "curvilinear";

export type SculptureGenome = {
  slug: string;
  /** The registry's short alphanumeric id (g52393, CR-8411, etc). */
  genomeId: string;
  /** Sculpture-kingdom classification. */
  kingdom: SculptureKingdom;
  /** Generation number in the evolution lineage. */
  generationNumber: number;
  /** Optional fitness score 0..100. */
  fitnessScore?: number;
  /** Parent genome ids if this is a child of an evolution step. */
  parents?: string[];
  /** Optional path to a built mesh under /public/assets/meshes/. */
  meshUrl?: string;
  /**
   * The persisted subset of the gene vector. Keys match the registry's
   * "genome" object field names.
   */
  geneVector: Record<string, number | string | undefined>;
  /** One-sentence description of what this specimen tries to be. */
  notes: string;
};

export const genomes: SculptureGenome[] = [
  {
    slug: "g52393-radial-plano-convex",
    genomeId: "g52393",
    kingdom: "biomech",
    generationNumber: 0,
    fitnessScore: 0,
    geneVector: {
      arm_count: 3,
      arm_length_mm: 80.0,
      arm_taper: 0.7,
      branching_depth: 2,
      branching_angle_deg: 35.0,
      murray_exponent: 3.0,
      core_diameter_mm: 3.0,
      wall_thickness_mm: 0.8,
      surface_texture: "smooth",
      ior_target: 1.5,
      lens_type: "plano-convex",
      focal_length_mm: 50.0,
      aperture_mm: 5.0,
      zone_count: 8,
      base_diameter_mm: 40.0,
      base_height_mm: 15.0,
      mount_type: "magnetic",
      symmetry: "radial",
    },
    notes:
      "Generation-0 template; three radial arms with a plano-convex lens cap, smooth surface, magnetic mount. The shape the evolution engine starts from.",
  },
  {
    slug: "cr-8411-eve-v3",
    genomeId: "CR-8411",
    kingdom: "techno",
    generationNumber: 0,
    fitnessScore: 96,
    geneVector: {
      grid_x: 24,
      grid_y: 24,
      spacing_mm: 2.8,
      twist_angle: 25.0,
      base_size_mm: 2.2,
      peak_height_mm: 6.0,
      undulation_amp: 0.003,
    },
    notes:
      'Evolutionary elite (Eve-V3). A 24x24 grid sculpture with 25-degree twist and gentle undulation; fitness 96 made it the canonical "good ancestor" for downstream generations.',
  },
  {
    slug: "g66903-default-baseline",
    genomeId: "g66903",
    kingdom: "biomech",
    generationNumber: 0,
    fitnessScore: 0,
    geneVector: {
      arm_length_mm: 200.0,
      arm_taper: 0.5,
      branching_angle_deg: 35.0,
      murray_exponent: 3.0,
      core_diameter_mm: 40.0,
      wall_thickness_mm: 1.2,
      ior_target: 1.5,
      surface_pattern: "none",
      symmetry: "radial",
      lens_type: "none",
      base_diameter_mm: 60.0,
      base_height_mm: 10.0,
      arm_count: 1,
      branching_depth: 0,
      zone_count: 1,
      surface_texture: "polished",
    },
    notes:
      "Baseline seed for the evolution engine: a single 200-mm arm, no branching, polished surface. The simplest specimen the registry will accept; everything more complex is descended from this.",
  },

  // -------------------------------------------------------------------
  // Wave 2 — additional genomes. One from the registry (g83266, gen-1
  // descendant of g66903) and eight seed-generation kingdom anchors
  // derived from D:\The_Hangar\Dolly_OS\src\lib\evolution\
  // genome-defaults.ts (seedGenome() per kingdom).
  // The embedded Blender builder_script is intentionally omitted.
  // -------------------------------------------------------------------

  {
    slug: "g83266-gen1-variant",
    genomeId: "g83266",
    kingdom: "biomech",
    generationNumber: 1,
    fitnessScore: 0,
    parents: ["g66903"],
    geneVector: {
      arm_length_mm: 199.187,
      arm_taper: 0.5,
      branching_angle_deg: 35.0,
      murray_exponent: 3.0,
      core_diameter_mm: 40.0,
      wall_thickness_mm: 1.2,
      ior_target: 1.5,
      surface_pattern: "none",
      symmetry: "radial",
      lens_type: "none",
      base_diameter_mm: 60.0,
      base_height_mm: 10.0,
      arm_count: 1,
      branching_depth: 0,
      zone_count: 1,
      surface_texture: "polished",
    },
    notes:
      "First-generation descendant of g66903. The Gaussian mutation has nudged the arm length down by 0.4 percent; everything else carries through. Earliest evidence in the registry of the engine&rsquo;s incremental walk.",
  },
  {
    slug: "seed-techno-eve",
    genomeId: "S-T-001",
    kingdom: "techno",
    generationNumber: 0,
    fitnessScore: 50,
    geneVector: {
      ancestry_techno: 1.0,
      trait: 0,
      form: 0,
      scaleMod: 1.0,
      densityMod: 1.0,
      spiralMod: 0.5,
      lumi_externalBloomStrength: 0.5,
      lumi_internalGlowStrength: 0.5,
      lumi_waveguideDiamMm: 1.5,
      lumi_bloomTerminals: 4,
      labTarget: "forge",
    },
    notes:
      "Techno kingdom seed. Pure-grid ancestry weighting; the canonical entry point for any lineage the engine intends to land in techno.",
  },
  {
    slug: "seed-curvilinear",
    genomeId: "S-C-001",
    kingdom: "curvilinear",
    generationNumber: 0,
    fitnessScore: 50,
    geneVector: {
      ancestry_curvilinear: 1.0,
      trait: 1,
      form: 0,
      scaleMod: 1.0,
      densityMod: 1.0,
      spiralMod: 0.5,
      lumi_externalBloomStrength: 0.5,
      lumi_internalGlowStrength: 0.5,
      lumi_waveguideDiamMm: 1.5,
      lumi_bloomTerminals: 4,
      labTarget: "forge",
    },
    notes:
      "Curvilinear kingdom seed. Spline-purity ancestry; the smooth-everywhere starting point for the kingdom&rsquo;s lineage.",
  },
  {
    slug: "seed-assemblage",
    genomeId: "S-A-001",
    kingdom: "assemblage",
    generationNumber: 0,
    fitnessScore: 50,
    geneVector: {
      ancestry_assemblage: 1.0,
      trait: 2,
      form: 0,
      scaleMod: 1.0,
      densityMod: 1.0,
      spiralMod: 0.5,
      lumi_externalBloomStrength: 0.5,
      lumi_internalGlowStrength: 0.5,
      lumi_waveguideDiamMm: 1.5,
      lumi_bloomTerminals: 4,
      labTarget: "forge",
    },
    notes:
      "Assemblage kingdom seed. Joined-component ancestry weighting; the studio uses this when a commission asks for a sculpture built from several smaller pieces.",
  },
  {
    slug: "seed-artistic",
    genomeId: "S-X-001",
    kingdom: "artistic",
    generationNumber: 0,
    fitnessScore: 50,
    geneVector: {
      ancestry_artistic: 1.0,
      trait: 3,
      form: 0,
      scaleMod: 1.0,
      densityMod: 1.0,
      spiralMod: 0.5,
      lumi_externalBloomStrength: 0.5,
      lumi_internalGlowStrength: 0.5,
      lumi_waveguideDiamMm: 1.5,
      lumi_bloomTerminals: 4,
      labTarget: "forge",
    },
    notes:
      "Expressive (legacy `artistic`) kingdom seed. Aesthetic-information ancestry; the lineage&rsquo;s fitness function prioritises visual interest over print or optical performance.",
  },
  {
    slug: "seed-choreographic",
    genomeId: "S-M-001",
    kingdom: "choreographic",
    generationNumber: 0,
    fitnessScore: 50,
    geneVector: {
      ancestry_choreographic: 1.0,
      trait: 0,
      form: 0,
      scaleMod: 1.0,
      densityMod: 1.0,
      spiralMod: 0.5,
      lumi_externalBloomStrength: 0.5,
      lumi_internalGlowStrength: 0.5,
      lumi_waveguideDiamMm: 1.5,
      lumi_bloomTerminals: 4,
      labTarget: "forge",
    },
    notes:
      "Motion (legacy `choreographic`) kingdom seed. Gesture-trajectory ancestry; the entry point for any lineage that begins as a recorded kata.",
  },
  {
    slug: "seed-thermal",
    genomeId: "S-H-001",
    kingdom: "thermal",
    generationNumber: 0,
    fitnessScore: 50,
    geneVector: {
      ancestry_thermal: 1.0,
      trait: 1,
      form: 0,
      scaleMod: 1.0,
      densityMod: 1.0,
      spiralMod: 0.5,
      lumi_externalBloomStrength: 0.5,
      lumi_internalGlowStrength: 0.5,
      lumi_waveguideDiamMm: 1.5,
      lumi_bloomTerminals: 4,
      labTarget: "forge",
    },
    notes:
      "Thermal kingdom seed. Heat-shed-surface ancestry; the function-first entry point that argues for surface area before form.",
  },
  {
    slug: "seed-protean",
    genomeId: "S-P-001",
    kingdom: "protean",
    generationNumber: 0,
    fitnessScore: 50,
    geneVector: {
      ancestry_protean: 1.0,
      trait: 2,
      form: 0,
      scaleMod: 1.0,
      densityMod: 1.0,
      spiralMod: 0.5,
      lumi_externalBloomStrength: 0.5,
      lumi_internalGlowStrength: 0.5,
      lumi_waveguideDiamMm: 1.5,
      lumi_bloomTerminals: 4,
      labTarget: "forge",
    },
    notes:
      "Protean kingdom seed. Hybrid-form ancestry; the catch-all the engine uses when a lineage resists single-kingdom classification.",
  },
  {
    slug: "seed-biomech-eve",
    genomeId: "S-B-001",
    kingdom: "biomech",
    generationNumber: 0,
    fitnessScore: 50,
    geneVector: {
      ancestry_biomech: 1.0,
      trait: 3,
      form: 0,
      scaleMod: 1.0,
      densityMod: 1.0,
      spiralMod: 0.5,
      lumi_externalBloomStrength: 0.5,
      lumi_internalGlowStrength: 0.5,
      lumi_waveguideDiamMm: 1.5,
      lumi_bloomTerminals: 4,
      labTarget: "forge",
    },
    notes:
      "Biomech kingdom seed (Eve-of-lineage). Murray&rsquo;s-law branching ancestry; the entry point that argues for grown-not-designed geometry.",
  },
];

export const sculptureKingdoms: {
  slug: SculptureKingdom;
  name: string;
  notes: string;
}[] = [
  {
    slug: "biomech",
    name: "Biomech",
    notes:
      "Branching, vascular, Murray's-law geometries; sculptures that read as if they grew rather than being designed.",
  },
  {
    slug: "techno",
    name: "Techno",
    notes:
      "Grids, lattices, regular tessellations; sculptures whose pattern resolves rather than dissolves.",
  },
  {
    slug: "artistic",
    name: "Artistic",
    notes:
      "Compositions optimised for aesthetic information rather than print or optical performance.",
  },
  {
    slug: "choreographic",
    name: "Choreographic",
    notes:
      "Sculptures generated from gesture trajectories; the frozen kata.",
  },
  {
    slug: "thermal",
    name: "Thermal",
    notes:
      "Surfaces optimised for heat-shed; the side of the catalogue that argues function first.",
  },
  {
    slug: "protean",
    name: "Protean",
    notes:
      "Hybrid forms; specimens that resist single-kingdom classification.",
  },
  {
    slug: "assemblage",
    name: "Assemblage",
    notes:
      "Multi-mesh compositions; pieces built from joined-together components rather than a single generator.",
  },
  {
    slug: "curvilinear",
    name: "Curvilinear",
    notes:
      "Pure-spline forms; sculptures whose surface is mathematically smooth at every point.",
  },
];

export function getGenome(slug: string): SculptureGenome | undefined {
  return genomes.find((g) => g.slug === slug);
}
