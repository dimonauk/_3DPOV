/**
 * lib/tsl-materials/presets/anodised.ts — Brushed anodised metal with
 * an anisotropic highlight, lavender tint.
 *
 * Canonical reference: anodised camera bodies and bicycle headsets —
 * brushed grain along one axis, slight lavender oxide, mid-roughness.
 * The anisotropy is approximated via the standard `anisotropy` prop
 * on MeshPhysicalNodeMaterial rather than a hand-rolled BRDF — gets
 * us 80% of the look at 5% of the shader cost.
 *
 * Backend: dual-path. MeshPhysical anisotropy lands on both backends
 * (WebGL2 needs three r160+).
 */
import { paletteColor, type PaletteToken } from "../palette";
import type { TslMaterialPreset, TslMaterialOverrides } from "../types";
import { loadNodeMaterials, loadThree } from "../internal";

const DEFAULT_COLOR: PaletteToken = "lavender-200";

function build(overrides?: TslMaterialOverrides): unknown {
  const THREE = loadThree();
  const NM = loadNodeMaterials();
  const params = {
    color: new THREE.Color(paletteColor(overrides?.color ?? DEFAULT_COLOR)),
    metalness: overrides?.metalness ?? 0.85,
    roughness: overrides?.roughness ?? 0.4,
    anisotropy: 0.8,
    anisotropyRotation: 0,
  };
  if (NM?.MeshPhysicalNodeMaterial) {
    return new NM.MeshPhysicalNodeMaterial(params);
  }
  return new THREE.MeshPhysicalMaterial(params);
}

export const anodisedPreset: TslMaterialPreset = {
  id: "anodised",
  name: "Anodised",
  category: "metal",
  description:
    "Brushed anodised body with a lavender oxide and a streaked anisotropic highlight along the grain.",
  cost: "moderate",
  backend: "dual",
  chip:
    "repeating-linear-gradient(90deg, #cfb7ff 0px, #cfb7ff 2px, #b490ff 2px, #b490ff 4px), linear-gradient(135deg, #cfb7ff, #8d9bad)",
  build,
};

export default anodisedPreset;
