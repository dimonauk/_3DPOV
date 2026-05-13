/**
 * lib/wardrobe/profiles.ts — Typed wardrobe catalogue keyed to OCEAN region.
 *
 * One-line role: the studio's canonical mapping from a personality vector
 * to a starting wardrobe profile — palette, silhouette, texture, vibe.
 * Full purpose in profiles.PURPOSE.md.
 */

import type { OceanVector } from "lib/state/aura";

/**
 * A typed half-open or open interval on a single OCEAN axis.
 * `min`/`max` are both optional so a profile can specify "high openness"
 * (min only), "low neuroticism" (max only), or a band (both).
 */
export type OceanRange = {
  min?: number;
  max?: number;
};

/** The OCEAN region a profile occupies. Any axis omitted is unconstrained. */
export type OceanRangeSpec = Partial<Record<keyof OceanVector, OceanRange>>;

/** A wardrobe profile — a starting palette + silhouette for an OCEAN region. */
export type WardrobeProfile = {
  /** Slug. Lowercase, hyphenated. */
  id: string;
  /** Display name. */
  name: string;
  /** The OCEAN region the profile occupies. Anchored by 1–3 dominant axes. */
  oceanRange: OceanRangeSpec;
  /** One-sentence description of the garment register. */
  garmentVibe: string;
  /** Hex strings (with leading #). 3–6 colours. */
  palette: string[];
  /** Silhouette keyword. */
  silhouette: string;
  /** One-line description of texture and material register. */
  textureNotes: string;
  /**
   * Optional reference back to a source-shape from the Hangar research doc.
   * Anonymised — names the *shape*, not the person. Free-form string.
   */
  sourceTraitProfile?: string;
};

/**
 * The catalogue. Eight entries spanning the OCEAN cube: high/low extremes
 * of each trait plus a few hybrid centres. Six-to-ten was the brief; eight
 * is what the studio committed to once the rooms were drawn.
 */
const PROFILES: WardrobeProfile[] = [
  {
    id: "openness-high-extraversion-high",
    name: "Vivid Maximalist",
    oceanRange: {
      openness: { min: 0.7 },
      extraversion: { min: 0.7 },
    },
    garmentVibe:
      "Layered colour-clash with metallic accents; brave silhouettes that ask to be looked at.",
    palette: ["#ff4fa3", "#ffd84a", "#39c0ff", "#9b5bff", "#0a0a12"],
    silhouette: "fitted-flowing",
    textureNotes:
      "Transparent organza over satin; foiled trims; mixed sheen and matte in one outfit.",
    sourceTraitProfile: "the high-openness, high-extraversion student shape.",
  },
  {
    id: "conscientiousness-high-neuroticism-low",
    name: "Lean Classic",
    oceanRange: {
      conscientiousness: { min: 0.75 },
      neuroticism: { max: 0.35 },
    },
    garmentVibe:
      "Sharp tailoring, contained palette, finishes that read as deliberate rather than ornamental.",
    palette: ["#1a1a1a", "#2d2d35", "#c8b89a", "#7f7468"],
    silhouette: "lean-classic",
    textureNotes:
      "Industrial satin, twill, crisp wool; pressed seams; low-damping fabrics that hold their crease.",
    sourceTraitProfile: "the chief-of-staff shape — high conscientiousness, low neuroticism.",
  },
  {
    id: "agreeableness-high-extraversion-low",
    name: "Soft Drape",
    oceanRange: {
      agreeableness: { min: 0.7 },
      extraversion: { max: 0.45 },
    },
    garmentVibe:
      "Quiet flowing layers; nothing in the silhouette demands attention; the eye rests.",
    palette: ["#e8d8c2", "#c9b89e", "#7a8d7a", "#3d4a44"],
    silhouette: "fitted-flowing",
    textureNotes:
      "Soft drape, high damping; jersey, washed linen, brushed cotton; nothing stiff.",
    sourceTraitProfile: "the high-agreeableness, low-extraversion student shape.",
  },
  {
    id: "neuroticism-high-openness-high",
    name: "Distressed Asymmetry",
    oceanRange: {
      neuroticism: { min: 0.65 },
      openness: { min: 0.6 },
    },
    garmentVibe:
      "Asymmetric hems, frayed edges, layers that look mid-transformation; the silhouette is unsettled on purpose.",
    palette: ["#0e0e14", "#3a1f2e", "#a14b5e", "#cfa07a", "#f6e6c8"],
    silhouette: "boxy-architectural",
    textureNotes:
      "Distressed knits, raw-cut hems, contrasting weights; high-frequency surface noise.",
    sourceTraitProfile: "the high-neuroticism shape — the agent mid-transformation.",
  },
  {
    id: "conscientiousness-high-extraversion-high",
    name: "Architectural Showpiece",
    oceanRange: {
      conscientiousness: { min: 0.7 },
      extraversion: { min: 0.7 },
    },
    garmentVibe:
      "Tailored volume — bold silhouette held by structure rather than draped; the room knows you arrived.",
    palette: ["#101018", "#dadada", "#c83b3b", "#f0c64a"],
    silhouette: "boxy-architectural",
    textureNotes:
      "Coated wool, sculpted shoulder, sharp lapel; minimal but high-contrast accent pieces.",
    sourceTraitProfile: "the high-conscientiousness, high-extraversion shape — the presenter.",
  },
  {
    id: "openness-low-conscientiousness-mid",
    name: "Habitual Uniform",
    oceanRange: {
      openness: { max: 0.35 },
      conscientiousness: { min: 0.45, max: 0.75 },
    },
    garmentVibe:
      "A standing kit repeated with small variation; comfort over surprise; the same shape five days running.",
    palette: ["#2c3138", "#4a525c", "#8b8f95", "#d6d8db"],
    silhouette: "lean-classic",
    textureNotes:
      "Cotton, denim, brushed flannel; mid-weight, mid-damping; nothing that demands ironing.",
    sourceTraitProfile: "the low-openness shape — the steady silhouette.",
  },
  {
    id: "agreeableness-low-neuroticism-low",
    name: "Direct Edge",
    oceanRange: {
      agreeableness: { max: 0.4 },
      neuroticism: { max: 0.45 },
    },
    garmentVibe:
      "Hard lines, contained colour, nothing soft on the silhouette; the outfit doesn't yield.",
    palette: ["#0c0c0e", "#1f1f24", "#5a5a62", "#a8a8b0"],
    silhouette: "boxy-architectural",
    textureNotes:
      "Heavy denim, waxed cotton, structured leather; low damping, high stiffness.",
    sourceTraitProfile: "the low-agreeableness, low-neuroticism shape — the operator.",
  },
  {
    id: "openness-high-agreeableness-high",
    name: "Layered Wanderer",
    oceanRange: {
      openness: { min: 0.7 },
      agreeableness: { min: 0.65 },
    },
    garmentVibe:
      "Many soft layers in adjacent hues; the silhouette is permeable, the texture is the message.",
    palette: ["#d8c4a8", "#a07f5a", "#5e6f4a", "#3a3b2d", "#e9e2d1"],
    silhouette: "fitted-flowing",
    textureNotes:
      "Hand-feel fabrics — washed linen, alpaca, raw silk — layered light over dark; high drape.",
    sourceTraitProfile: "the high-openness, high-agreeableness shape — the explorer.",
  },
];

const BY_ID: Record<string, WardrobeProfile> = Object.fromEntries(
  PROFILES.map((p) => [p.id, p]),
);

export function listProfiles(): WardrobeProfile[] {
  return PROFILES;
}

export function getProfile(id: string): WardrobeProfile | undefined {
  return BY_ID[id];
}

/**
 * Score how far the supplied OCEAN vector lies inside a profile's region.
 * Lower is closer. For each axis the profile constrains:
 *   - inside the range → distance 0
 *   - outside → distance to nearest bound (in [0..1])
 * Axes the profile does not constrain contribute nothing. The score is
 * the sum across constrained axes, weighted by axis count so profiles
 * with more constraints aren't penalised for being specific.
 */
function distanceToRegion(ocean: OceanVector, spec: OceanRangeSpec): number {
  const axes = Object.keys(spec) as (keyof OceanVector)[];
  if (axes.length === 0) return 1; // unconstrained profiles sort last
  let total = 0;
  for (const axis of axes) {
    const range = spec[axis];
    if (!range) continue;
    const v = ocean[axis];
    if (range.min !== undefined && v < range.min) total += range.min - v;
    else if (range.max !== undefined && v > range.max) total += v - range.max;
    // inside → 0
  }
  return total / axes.length;
}

/**
 * Return the top three profiles closest to the supplied OCEAN vector.
 * Ties broken by catalogue order. Always returns three entries when the
 * catalogue holds three or more.
 */
export function profilesForOcean(ocean: OceanVector): WardrobeProfile[] {
  return [...PROFILES]
    .map((profile, index) => ({
      profile,
      index,
      distance: distanceToRegion(ocean, profile.oceanRange),
    }))
    .sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      return a.index - b.index;
    })
    .slice(0, 3)
    .map((entry) => entry.profile);
}
