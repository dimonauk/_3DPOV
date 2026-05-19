/**
 * lib/tsl-materials/presets/stone.ts — Rough marbled stone with a
 * subtle procedural variation in albedo.
 *
 * Canonical reference: cool quartz countertop slabs — mostly
 * chrome-300 with veins of warm-black, a hint of pink-50 where the
 * surface catches light. The colour variation is driven by TSL's
 * built-in MaterialX noise so the stone reads as material rather
 * than a flat grey shape.
 *
 * Backend: dual-path. mx_noise_float compiles to both backends. The
 * WebGL2 path is a hair slower but still cheap enough to scatter
 * across a scene.
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

  const baseParams = {
    color: new THREE.Color(tokenHex(overrides?.color ?? "chrome-300")),
    metalness: overrides?.metalness ?? 0.05,
    roughness: overrides?.roughness ?? 0.85,
  };

  if (!TSL || !NM?.MeshStandardNodeMaterial) {
    return new THREE.MeshStandardMaterial(baseParams);
  }

  const material = new NM.MeshStandardNodeMaterial(baseParams) as {
    colorNode?: unknown;
  };

  // Two octaves of noise — coarse for the slab variation, fine for
  // the surface grain. Mixed across chrome-200 / chrome-400 with a
  // pink-50 spike on the brighter peaks.
  const p = TSL.positionLocal.mul(2.5);
  const coarse = TSL.add(TSL.mx_noise_float(p).mul(0.5), 0.5);
  const fine = TSL.add(TSL.mx_noise_float(p.mul(7.0)).mul(0.5), 0.5);
  const v = TSL.add(TSL.mul(coarse, 0.7), TSL.mul(fine, 0.3));
  const dark = TSL.color(tokenHex("chrome-400"));
  const light = TSL.color(tokenHex("chrome-200"));
  const warm = TSL.color(tokenHex("pink-50"));
  const stoneCol = TSL.mix(TSL.mix(dark, light, v), warm, TSL.pow(v, TSL.float(4.0)));
  material.colorNode = stoneCol;
  return material;
}

export const stonePreset: TslMaterialPreset = {
  id: "stone",
  name: "Stone",
  category: "stone",
  description:
    "Rough quartz slab with two octaves of MaterialX noise driving colour variation. Reads as marble at any zoom.",
  cost: "moderate",
  backend: "dual",
  chip:
    "linear-gradient(135deg, #b5c0cd 0%, #d6dde5 30%, #8d9bad 70%, #fff5f9 100%)",
  build,
};

export default stonePreset;
