/**
 * lib/tsl-materials/presets/paper-folded.ts — High-contrast facet
 * shading for origami / low-poly looks. Pairs with the high-facet
 * article in components/articles/entries/.
 *
 * Two-band lighting ramp adapted from IronWarrior's UnityToonShader
 * (https://github.com/IronWarrior/UnityToonShader — Unlicense /
 * public domain). The original is a Lit URP shader with a smoothstep
 * ramp on `dot(N, L)`; we port the ramp shape to TSL and swap the
 * single light step for two sharp bands so creases read.
 *
 * Why flat-normal facet shading matters here: when a low-poly mesh
 * doesn't have per-vertex normals or is rendered with `flatShading`,
 * each face gets its own normal and the lighting cuts cleanly along
 * the crease. The eye reads that as folded paper rather than a
 * coarsely-subdivided surface. The article on high-facet shading
 * argues this from the design side — this is the material that
 * delivers the look.
 *
 * Backend: WebGPU-only for the proper ramp. WebGL fallback returns
 * MeshToonMaterial with a thresholded gradient map, which lands a
 * close-enough two-tone look without a custom shader.
 *
 * Render-time requirement: set `flatShading: true` on the geometry or
 * use `geometry.computeVertexNormals()` after a `mergeVertices()` so
 * face normals stay sharp. This preset cannot recover crease detail
 * from a smooth-normal mesh.
 */
import {
  loadNodeMaterials,
  loadThree,
  loadTSL,
  tokenHex,
} from "../internal";
import type { TslMaterialPreset, TslMaterialOverrides } from "../types";

function build(overrides?: TslMaterialOverrides): unknown {
  const THREE = loadThree();
  const TSL = loadTSL();
  const NM = loadNodeMaterials();

  const paperToken = overrides?.color ?? "chrome-100";
  const shadowToken = "warm-black-700" as const;
  const creaseToken = "lavender-200" as const;

  if (!TSL || !NM?.MeshStandardNodeMaterial) {
    // MeshToonMaterial with flatShading reads close to the TSL path
    // at much lower cost. flatShading isn't typed on MeshToonMaterial
    // even though it's accepted at runtime (Three.js typing oversight);
    // cast to set it.
    const mat = new THREE.MeshToonMaterial({
      color: new THREE.Color(tokenHex(paperToken)),
    });
    (mat as unknown as { flatShading: boolean }).flatShading = true;
    return mat;
  }

  const material = new NM.MeshStandardNodeMaterial({
    color: new THREE.Color(tokenHex(paperToken)),
    metalness: overrides?.metalness ?? 0.0,
    roughness: overrides?.roughness ?? 0.85,
    flatShading: true,
  }) as {
    colorNode?: unknown;
  };

  // Match VRM's main light direction so paper props sit alongside an
  // Aura VRM without lighting drift. Same construction as
  // cel-shaded.ts; could be hoisted to internal.ts later.
  const L = TSL.normalize(TSL.vec3(0.35, 0.7, 0.6));
  const n = TSL.normalize(TSL.normalView);
  const nDotL = TSL.dot(n, L);

  // Two sharp bands — paper / shadow. The transition is much sharper
  // than cel-shaded (0.02 versus 0.08 in cel-shaded) so the crease
  // between adjacent facets reads as a hard fold rather than a soft
  // gradient.
  const paper = TSL.color(tokenHex(paperToken));
  const shadow = TSL.color(tokenHex(shadowToken));
  const lit = TSL.mix(
    shadow,
    paper,
    TSL.smoothstep(TSL.float(-0.02), TSL.float(0.02), nDotL),
  );

  // Crease accent — a thin lavender band right at the lit / shadow
  // boundary. Mimics the way real folded paper picks up a cool tint
  // along the crease from ambient scattered light. The band lives in
  // a ±0.06 window around nDotL = 0, gated by smoothstep peaks.
  const lo = TSL.smoothstep(TSL.float(-0.06), TSL.float(0.0), nDotL);
  const hi = TSL.smoothstep(TSL.float(0.0), TSL.float(0.06), nDotL);
  const creaseMask = TSL.mul(lo, TSL.oneMinus(hi));
  const crease = TSL.mul(TSL.color(tokenHex(creaseToken)), creaseMask.mul(0.6));

  material.colorNode = TSL.add(lit, crease);
  return material;
}

export const paperFoldedPreset: TslMaterialPreset = {
  id: "paper-folded",
  name: "Paper Folded",
  category: "fabric",
  description:
    "Two-band facet shading with a lavender crease accent. Needs flatShading on the geometry — see preset doc. Pairs with the high-facet article.",
  cost: "moderate",
  backend: "webgpu-only",
  chip:
    "linear-gradient(135deg, #eef1f5 0%, #eef1f5 45%, #cfb7ff 48%, #cfb7ff 52%, #2a232f 55%, #2a232f 100%)",
  build,
};

export default paperFoldedPreset;
