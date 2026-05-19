/**
 * lib/tsl-materials/presets/painted-plastic.ts — Toy/figurine look.
 * Solid colour body with a clearcoat lacquer over the top.
 *
 * Canonical reference: vinyl figure paint — pink-300 body, glossy
 * clearcoat, no metalness. Clearcoat roughness is low so the body
 * colour stays saturated but the highlight stays tight.
 *
 * Backend: dual-path. Clearcoat is core MeshPhysical so the WebGL
 * fallback path is automatic.
 */
import { paletteColor, type PaletteToken } from "../palette";
import type { TslMaterialPreset, TslMaterialOverrides } from "../types";
import { loadNodeMaterials, loadThree } from "../internal";

const DEFAULT_COLOR: PaletteToken = "pink-300";

function build(overrides?: TslMaterialOverrides): unknown {
  const THREE = loadThree();
  const NM = loadNodeMaterials();
  const params = {
    color: new THREE.Color(paletteColor(overrides?.color ?? DEFAULT_COLOR)),
    metalness: overrides?.metalness ?? 0.0,
    roughness: overrides?.roughness ?? 0.55,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
  };
  if (NM?.MeshPhysicalNodeMaterial) {
    return new NM.MeshPhysicalNodeMaterial(params);
  }
  return new THREE.MeshPhysicalMaterial(params);
}

export const paintedPlasticPreset: TslMaterialPreset = {
  id: "painted-plastic",
  name: "Painted Plastic",
  category: "plastic",
  description:
    "Vinyl-figure paint. Solid colour body with a glossy clearcoat over it. Saturated, friendly, photographable.",
  cost: "cheap",
  backend: "dual",
  chip:
    "radial-gradient(circle at 35% 30%, #ffe4ee 0%, #ff9fbf 45%, #ff558f 90%)",
  build,
};

export default paintedPlasticPreset;
