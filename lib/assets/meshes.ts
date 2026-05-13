/**
 * lib/assets/meshes.ts — Typed catalogue of every mesh in /public/assets/meshes/.
 *
 * Migrated from The Hangar workshop. Each entry names what the bench
 * actually produced; the URL points to the published .glb file.
 *
 * Source: D:\The_Hangar\.infrastructure\blender_python_library\ and
 * D:\The_Hangar\assets\blender\. Generation scripts live under
 * /python-services (the same Blender Python that produced these files).
 */

export type MeshCategory =
  | "biomimetic"
  | "sculpture"
  | "pendant"
  | "wall-relief"
  | "gesture-mesh"
  | "studio-object"
  | "evolution";

export type MeshFormat = "glb" | "gltf" | "obj" | "ply" | "stl";

export type MeshAsset = {
  slug: string;
  name: string;
  category: MeshCategory;
  url: string;
  format: MeshFormat;
  fileSizeBytes: number;
  thumbnailUrl?: string;
  /** Which generation script (in /python-services) produced this mesh, if known. */
  sourceAlgorithm?: string;
  /** One-sentence description of what this mesh is. */
  notes: string;
};

export const meshes: MeshAsset[] = [
  {
    slug: "dragon-scales-wall-art",
    name: "Dragon Scales Wall Art",
    category: "wall-relief",
    url: "/assets/meshes/biomimetic/dragon-scales-wall-art.glb",
    format: "glb",
    fileSizeBytes: 81920,
    sourceAlgorithm: "generators.py / dragon_scales_radial",
    notes:
      "Overlapping placoid-scale tessellation arranged as a radial wall-relief panel; printable in resin and the source mesh behind the dragon-scale brush variant.",
  },
  {
    slug: "phyllotaxis-dense",
    name: "Phyllotaxis (Dense)",
    category: "biomimetic",
    url: "/assets/meshes/biomimetic/phyllotaxis-dense.glb",
    format: "glb",
    fileSizeBytes: 166912,
    sourceAlgorithm: "generators.py / phyllotaxis_pattern",
    notes:
      "Sunflower seed-head packing at high density; the Vogel-spiral with the golden angle 137.5 degrees, projected onto a near-planar disc.",
  },
  {
    slug: "phyllotaxis-inverse",
    name: "Phyllotaxis (Inverse)",
    category: "biomimetic",
    url: "/assets/meshes/biomimetic/phyllotaxis-inverse.glb",
    format: "glb",
    fileSizeBytes: 82944,
    sourceAlgorithm: "generators.py / phyllotaxis_inverse",
    notes:
      "Same Vogel spiral, inverted radial-density curve so seeds cluster at the perimeter rather than the centre.",
  },
  {
    slug: "phyllotaxis-triangular",
    name: "Phyllotaxis (Triangular)",
    category: "biomimetic",
    url: "/assets/meshes/biomimetic/phyllotaxis-triangular.glb",
    format: "glb",
    fileSizeBytes: 13312,
    sourceAlgorithm: "generators.py / phyllotaxis_triangular",
    notes:
      "Phyllotaxis with triangular seed elements rather than discs; the same packing logic produces a sharper tactile surface.",
  },
  {
    slug: "phyllotaxis-wall-art",
    name: "Phyllotaxis Wall Art",
    category: "wall-relief",
    url: "/assets/meshes/biomimetic/phyllotaxis-wall-art.glb",
    format: "glb",
    fileSizeBytes: 62464,
    sourceAlgorithm: "generators.py / phyllotaxis_pattern",
    notes:
      "Phyllotaxis arrangement sized and bordered for wall-mount; the production geometry behind the Phyllotaxis Disc pendant series.",
  },
  {
    slug: "template-sculpture",
    name: "Template Sculpture",
    category: "sculpture",
    url: "/assets/meshes/sculpture/template-sculpture.glb",
    format: "glb",
    fileSizeBytes: 566272,
    sourceAlgorithm: "generators.py / radial_sculpture",
    notes:
      "Baseline sculpture template the evolution engine starts from; used as the seed mesh for the genome registry's generation-0 specimens.",
  },

  // -------------------------------------------------------------------
  // Wave 2 — evolution-engine renders. A curated sample from the
  // 23,200 .glb outputs at D:\The_Hangar\outputs\holoflow_renders\.
  // Two per kingdom across early / late generations, to show the
  // morphological drift the breeding engine introduces.
  // -------------------------------------------------------------------

  {
    slug: "gen0001-biomech-seed",
    name: "Gen 1 — Biomech (Seed)",
    category: "evolution",
    url: "/assets/meshes/evolution/gen0001-biomech-seed.glb",
    format: "glb",
    fileSizeBytes: 7724,
    sourceAlgorithm: "evolution-engine / biomech kingdom",
    notes:
      "First-generation biomech specimen. Single arm, minimal branching; the simplest shape the kingdom accepts.",
  },
  {
    slug: "gen1429-biomech-late",
    name: "Gen 1429 — Biomech (Late)",
    category: "evolution",
    url: "/assets/meshes/evolution/gen1429-biomech-late.glb",
    format: "glb",
    fileSizeBytes: 6348,
    sourceAlgorithm: "evolution-engine / biomech kingdom",
    notes:
      "Late-generation biomech specimen. 1429 generations of selection have narrowed the surviving forms; the silhouette is tighter than gen-1's.",
  },
  {
    slug: "gen0003-techno-grid",
    name: "Gen 3 — Techno (Grid)",
    category: "evolution",
    url: "/assets/meshes/evolution/gen0003-techno-grid.glb",
    format: "glb",
    fileSizeBytes: 4100,
    sourceAlgorithm: "evolution-engine / techno kingdom",
    notes:
      "Early techno specimen. Regular grid pattern; the lattice geometry the kingdom is named for.",
  },
  {
    slug: "gen0006-techno-twisted",
    name: "Gen 6 — Techno (Twisted)",
    category: "evolution",
    url: "/assets/meshes/evolution/gen0006-techno-twisted.glb",
    format: "glb",
    fileSizeBytes: 2424,
    sourceAlgorithm: "evolution-engine / techno kingdom",
    notes:
      "Sixth-generation techno specimen with a small twist gene; the lattice now spirals slightly.",
  },
  {
    slug: "gen0002-artistic-early",
    name: "Gen 2 — Expressive (Early)",
    category: "evolution",
    url: "/assets/meshes/evolution/gen0002-artistic-early.glb",
    format: "glb",
    fileSizeBytes: 7640,
    sourceAlgorithm: "evolution-engine / expressive kingdom",
    notes:
      "Second-generation expressive (legacy `artistic`) specimen. Composition optimised for aesthetic information rather than print or optical performance.",
  },
  {
    slug: "gen1429-artistic-mature",
    name: "Gen 1429 — Expressive (Mature)",
    category: "evolution",
    url: "/assets/meshes/evolution/gen1429-artistic-mature.glb",
    format: "glb",
    fileSizeBytes: 53568,
    sourceAlgorithm: "evolution-engine / expressive kingdom",
    notes:
      "Late-generation expressive specimen. 1429 generations of selection have produced a substantially denser mesh than the early sibling.",
  },
  {
    slug: "gen0001-choreographic-trace",
    name: "Gen 1 — Motion (Trace)",
    category: "evolution",
    url: "/assets/meshes/evolution/gen0001-choreographic-trace.glb",
    format: "glb",
    fileSizeBytes: 14068,
    sourceAlgorithm: "evolution-engine / motion kingdom",
    notes:
      "First-generation motion (legacy `choreographic`) specimen — the frozen kata trace, generated directly from a gesture trajectory.",
  },
  {
    slug: "gen1429-choreographic-mature",
    name: "Gen 1429 — Motion (Mature)",
    category: "evolution",
    url: "/assets/meshes/evolution/gen1429-choreographic-mature.glb",
    format: "glb",
    fileSizeBytes: 14160,
    sourceAlgorithm: "evolution-engine / motion kingdom",
    notes:
      "Late-generation motion specimen. The kata-trace shape has accumulated detail through selection pressure on its swept volume.",
  },
  {
    slug: "gen0162-thermal-shed",
    name: "Gen 162 — Thermal (Heat-Shed)",
    category: "evolution",
    url: "/assets/meshes/evolution/gen0162-thermal-shed.glb",
    format: "glb",
    fileSizeBytes: 195256,
    sourceAlgorithm: "evolution-engine / thermal kingdom",
    notes:
      "Mid-generation thermal specimen. Surface area is the fitness target; the result reads as a finned dissipator-jewellery hybrid.",
  },
  {
    slug: "gen0443-thermal-late",
    name: "Gen 443 — Thermal (Late)",
    category: "evolution",
    url: "/assets/meshes/evolution/gen0443-thermal-late.glb",
    format: "glb",
    fileSizeBytes: 195168,
    sourceAlgorithm: "evolution-engine / thermal kingdom",
    notes:
      "Later-generation thermal specimen. Same fitness target as gen-162; the lineage has converged on a tighter family resemblance.",
  },
  {
    slug: "gen0002-protean-hybrid",
    name: "Gen 2 — Protean (Hybrid)",
    category: "evolution",
    url: "/assets/meshes/evolution/gen0002-protean-hybrid.glb",
    format: "glb",
    fileSizeBytes: 335144,
    sourceAlgorithm: "evolution-engine / protean kingdom",
    notes:
      "Second-generation protean specimen. Resists single-kingdom classification — the engine's catch-all for hybrid genomes.",
  },
  {
    slug: "gen1429-protean-elite",
    name: "Gen 1429 — Protean (Elite)",
    category: "evolution",
    url: "/assets/meshes/evolution/gen1429-protean-elite.glb",
    format: "glb",
    fileSizeBytes: 373376,
    sourceAlgorithm: "evolution-engine / protean kingdom",
    notes:
      "Late-generation protean elite. The largest mesh in this Wave-2 selection at 373 KB; the lineage's complexity has grown rather than narrowed.",
  },
  {
    slug: "gen0001-assemblage-seed",
    name: "Gen 1 — Assemblage (Seed)",
    category: "evolution",
    url: "/assets/meshes/evolution/gen0001-assemblage-seed.glb",
    format: "glb",
    fileSizeBytes: 4196,
    sourceAlgorithm: "evolution-engine / assemblage kingdom",
    notes:
      "Seed-generation assemblage specimen — multiple joined components rather than a single generator output.",
  },
  {
    slug: "gen0002-assemblage-joined",
    name: "Gen 2 — Assemblage (Joined)",
    category: "evolution",
    url: "/assets/meshes/evolution/gen0002-assemblage-joined.glb",
    format: "glb",
    fileSizeBytes: 2332,
    sourceAlgorithm: "evolution-engine / assemblage kingdom",
    notes:
      "Second-generation assemblage; joining geometry has tightened, the silhouette reads as one piece rather than several.",
  },
  {
    slug: "gen0001-curvilinear-spline",
    name: "Gen 1 — Curvilinear (Spline)",
    category: "evolution",
    url: "/assets/meshes/evolution/gen0001-curvilinear-spline.glb",
    format: "glb",
    fileSizeBytes: 14068,
    sourceAlgorithm: "evolution-engine / curvilinear kingdom",
    notes:
      "First-generation curvilinear specimen. Pure spline form; smooth at every surface point.",
  },
  {
    slug: "gen1429-curvilinear-mature",
    name: "Gen 1429 — Curvilinear (Mature)",
    category: "evolution",
    url: "/assets/meshes/evolution/gen1429-curvilinear-mature.glb",
    format: "glb",
    fileSizeBytes: 14076,
    sourceAlgorithm: "evolution-engine / curvilinear kingdom",
    notes:
      "Late-generation curvilinear specimen. The spline continuity that defines the kingdom has been preserved across 1429 generations of selection.",
  },
];

export function getMesh(slug: string): MeshAsset | undefined {
  return meshes.find((m) => m.slug === slug);
}

export function meshesByCategory(
  category: MeshCategory,
): MeshAsset[] {
  return meshes.filter((m) => m.category === category);
}

export const meshCategories: MeshCategory[] = [
  "biomimetic",
  "wall-relief",
  "sculpture",
  "evolution",
  "pendant",
  "gesture-mesh",
  "studio-object",
];
