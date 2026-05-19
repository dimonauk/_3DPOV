/**
 * lib/tsl-materials/presets/glass.ts — Pink-tinted translucent glass.
 *
 * Canonical reference: the studio's signature glass jewellery —
 * faintly pink-warm under bright light, not the cool optical glass of
 * a lab. transmission 0.92 + ior 1.45 gives the slight refraction
 * read; thickness 0.4 keeps the tint from going opaque on thick
 * geometry.
 *
 * Backend: dual-path via the node MeshPhysical surface. When the
 * three build doesn't ship the WebGPU node material we fall back to
 * vanilla MeshPhysicalMaterial — identical look on WebGL2 because
 * transmission is core there too.
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
    metalness: overrides?.metalness ?? 0.0,
    roughness: overrides?.roughness ?? 0.05,
    transmission: 0.92,
    thickness: 0.4,
    ior: 1.45,
    transparent: true,
    opacity: overrides?.opacity ?? 1.0,
  };
  if (NM?.MeshPhysicalNodeMaterial) {
    return new NM.MeshPhysicalNodeMaterial(params);
  }
  return new THREE.MeshPhysicalMaterial(params);
}

export const glassPreset: TslMaterialPreset = {
  id: "glass",
  name: "Glass",
  category: "glass",
  description:
    "Pink-tinted transmission with a slight refraction read. The signature studio glass look.",
  cost: "expensive",
  backend: "dual",
  chip:
    "linear-gradient(135deg, rgba(255,228,238,0.85) 0%, rgba(255,196,217,0.55) 50%, rgba(255,159,191,0.65) 100%)",
  build,
};

export default glassPreset;
