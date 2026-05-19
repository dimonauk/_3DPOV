/**
 * lib/sculpture-gallery/catalogue.ts — Seed catalogue for the
 * `/atelier/sculpture-gallery` WebXR walk.
 *
 * The catalogue is a flat, hand-edited list of fictionalised editions
 * matching the studio's actual register: resin-printed waveguide
 * objects, light-painting sculptural objects, belt-printed wall
 * reliefs. Each entry either resolves to a real GLB at `modelUrl` or
 * falls back to a primitive shape so the scene always has something
 * to walk past — the gallery is the demo surface; the assets land
 * later.
 *
 * Adding an entry: append to `CATALOGUE` and the layout function
 * picks it up. Slug must be unique and URL-safe (lowercase, hyphen).
 * `accent` is an OKLCH-friendly CSS colour string used for the
 * plinth spot tint + the wall placard underline.
 *
 * Voice on `note`: workshop-Dimona — the bench writing, plain prose.
 * Voice on `blurb`: catalogue mode — short, what-it-is.
 */

export type SculpturePrimitive = {
  kind: "icosphere" | "torus" | "knot" | "waveguide";
  scale?: number;
};

export type SculptureEdition = {
  number: number;
  of: number;
};

export type SculptureEntry = {
  /** URL-safe identifier, used in `/atelier/sculpture-gallery/<slug>`. */
  slug: string;
  /** Title as it appears on the placard. Sentence case. */
  title: string;
  /** Year of edition. */
  year: number;
  /** Edition marker. Omit for one-offs. */
  edition?: SculptureEdition;
  /** GLB asset URL, public-served. When absent we fall back to the
   *  primitive shape so the gallery still walks. */
  modelUrl?: string;
  /** Fallback primitive if `modelUrl` is missing or fails to load. */
  primitive?: SculpturePrimitive;
  /** CSS colour for the plinth spot tint + placard accent. */
  accent: string;
  /** Short catalogue-mode description, one or two sentences. */
  blurb: string;
  /** Workshop-Dimona note for the wall card. Bench-side reasoning. */
  note: string;
};

/**
 * The seed catalogue. Six floor pieces (`primitive: icosphere | torus
 * | knot | waveguide`) read as resin-printed waveguide objects and
 * light-painting sculptural objects; the remaining four are wall
 * reliefs the scene re-uses on the back wall.
 */
export const CATALOGUE: ReadonlyArray<SculptureEntry> = [
  {
    slug: "filament-bloom-i",
    title: "Filament bloom I",
    year: 2025,
    edition: { number: 1, of: 8 },
    primitive: { kind: "waveguide", scale: 1.0 },
    accent: "#ffb3df",
    blurb:
      "A resin-printed waveguide bloom in clear methacrylate. Internal channels guide light from a single LED to a hundred surface points.",
    note: "Printed on the bureau's MSLA at 25-micron layers, post-cured for forty minutes. The channel network was solved as a Voronoi tessellation over the bounding sphere; every leaf reaches the surface within six millimetres.",
  },
  {
    slug: "lattice-knot-iii",
    title: "Lattice knot III",
    year: 2025,
    edition: { number: 3, of: 12 },
    primitive: { kind: "knot", scale: 0.9 },
    accent: "#c8b1ff",
    blurb:
      "A trefoil knot rendered as a triply-periodic lattice. The interior is a Schoen gyroid, so the object is solid and translucent at once.",
    note: "The knot is parameterised — radius, tube, twist. This is the third pull from the run; the printer's wall thickness budget caps the edition at twelve before the lattice walls start failing slicer checks.",
  },
  {
    slug: "long-exposure-poi-curve",
    title: "Long-exposure poi curve",
    year: 2024,
    edition: { number: 7, of: 21 },
    primitive: { kind: "torus", scale: 1.05 },
    accent: "#ffd166",
    blurb:
      "A single antispin-flower spin frozen as printable solid. The trail is what the studio's POV rig writes in a long-exposure photograph — same maths, two outputs.",
    note: "Generated from the poi-sculptor bench, exported at 0.4mm tube radius. The petals count is the difference between hand and head angular velocities; this one is the five-petal variant from the 2024 set.",
  },
  {
    slug: "tessellate-bloom",
    title: "Tessellate bloom",
    year: 2026,
    edition: { number: 2, of: 6 },
    primitive: { kind: "icosphere", scale: 1.1 },
    accent: "#7fe7d4",
    blurb:
      "A subdivided icosphere with each face raised into a petal. The whole reads as flower; the parts as crystal facets.",
    note: "Subdivision level 3, petal extrusion driven by face normal. The piece is hollow with a single bottom vent so the resin drains during printing. Six editions; the seventh would need a larger build plate than the bureau owns.",
  },
  {
    slug: "schoen-fragment-ii",
    title: "Schoen fragment II",
    year: 2025,
    edition: { number: 2, of: 10 },
    primitive: { kind: "waveguide", scale: 0.85 },
    accent: "#a8e6ff",
    blurb:
      "A boxed sample of the Schoen gyroid surface, edge-trimmed so the cell topology is visible from any angle.",
    note: "The gyroid is the body's preferred shape — bone trabeculae, butterfly wing scales. This is twelve cells in each axis, marched at 96-cubed resolution, exported watertight in a single piece.",
  },
  {
    slug: "lissajous-knot-vi",
    title: "Lissajous knot VI",
    year: 2026,
    edition: { number: 6, of: 8 },
    primitive: { kind: "knot", scale: 1.0 },
    accent: "#ff9fbf",
    blurb:
      "A 5,7,11 Lissajous knot in three-axis print, finished with a satin matte to read in low light.",
    note: "Lissajous knots are parameterised by three coprime integers; the 5,7,11 set holds the printer's wall thickness budget comfortably. Sixth pull; the early ones had support marks the bureau's now solved.",
  },
  {
    slug: "wall-relief-strata",
    title: "Wall relief — strata",
    year: 2024,
    primitive: { kind: "torus", scale: 0.7 },
    accent: "#d8a0ff",
    blurb:
      "Belt-printed wall relief. Geological strata as repeating band, eighteen layers deep, mounted on a black aluminium back-plate.",
    note: "The belt printer extrudes a continuous tile — the strata pattern is one tile, repeated five times across the width. Open edition; the bureau cuts to length on order.",
  },
  {
    slug: "wall-relief-caustic-grid",
    title: "Wall relief — caustic grid",
    year: 2025,
    primitive: { kind: "icosphere", scale: 0.65 },
    accent: "#ffe2a8",
    blurb:
      "A grid of caustic-pattern tiles, each one a frozen light-on-water sample, belt-printed and mounted edge-to-edge.",
    note: "Captured from the caustic-projector visualiser. The grid is twelve by eight; each tile is its own random seed. The wall behind the piece needs to be matte — gloss reflects the pattern back into itself and the read collapses.",
  },
];

/**
 * Look up a catalogue entry by slug. Returns undefined when the slug
 * doesn't match — callers should 404.
 */
export function findEntry(slug: string): SculptureEntry | undefined {
  return CATALOGUE.find((entry) => entry.slug === slug);
}

/**
 * Defensive copy of the catalogue, so consumers can sort or filter
 * without mutating the seed array.
 */
export function listCatalogue(): SculptureEntry[] {
  return CATALOGUE.slice();
}
