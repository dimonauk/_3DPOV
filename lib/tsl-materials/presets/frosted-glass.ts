/**
 * lib/tsl-materials/presets/frosted-glass.ts — Pink-tinted frosted
 * transmission.
 *
 * Canonical reference: bath-house frosted screens — diffuse refraction
 * with a faint warm-pink wash. Roughness drives the blur. Slightly
 * higher metalness than clear glass to push the rim back toward a
 * chrome highlight.
 *
 * Backend: dual-path. MeshPhysicalNodeMaterial on WebGPU, vanilla
 * MeshPhysicalMaterial on WebGL2. Both surfaces honour transmission +
 * roughness for the frost.
 */
import { paletteColor, type PaletteToken } from "../palette";
import type { TslMaterialPreset, TslMaterialOverrides } from "../types";
import { loadNodeMaterials, loadThree } from "../internal";

const DEFAULT_COLOR: PaletteToken = "pink-100";

function build(overrides?: TslMaterialOverrides): unknown {
  const THREE = loadThree();
  const NM = loadNodeMaterials();
  const params = {
    color: new THREE.Color(paletteColor(overrides?.color ?? DEFAULT_COLOR)),
    metalness: overrides?.metalness ?? 0.05,
    roughness: overrides?.roughness ?? 0.55,
    transmission: 0.88,
    thickness: 0.6,
    ior: 1.42,
    transparent: true,
    opacity: overrides?.opacity ?? 1.0,
    attenuationDistance: 1.2,
    attenuationColor: new THREE.Color(paletteColor("pink-200")),
  };
  if (NM?.MeshPhysicalNodeMaterial) {
    return new NM.MeshPhysicalNodeMaterial(params);
  }
  return new THREE.MeshPhysicalMaterial(params);
}

export const frostedGlassPreset: TslMaterialPreset = {
  id: "frosted-glass",
  name: "Frosted Glass",
  category: "glass",
  description:
    "Higher-roughness transmission with a pink attenuation. Light diffuses through like a bath-house screen.",
  cost: "expensive",
  backend: "dual",
  chip:
    "linear-gradient(135deg, rgba(255,228,238,0.7) 0%, rgba(255,196,217,0.55) 50%, rgba(232,221,255,0.55) 100%)",
  build,
};

export default frostedGlassPreset;
