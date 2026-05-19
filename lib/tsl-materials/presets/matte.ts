/**
 * lib/tsl-materials/presets/matte.ts — Warm-black flat with a soft
 * ambient response.
 *
 * Canonical reference: the studio's matte stage flats — never pure
 * black, always carries a pink/indigo bias against which pastels stay
 * luminous. Same intent as the `--color-warm-black-*` CSS tokens.
 * Used for floors, backdrops, anything that should recede behind the
 * focal mesh.
 *
 * Backend: dual-path. No TSL nodes — constant PBR uniforms only.
 */
import { paletteColor, type PaletteToken } from "../palette";
import type { TslMaterialPreset, TslMaterialOverrides } from "../types";
import { loadNodeMaterials, loadThree } from "../internal";

const DEFAULT_COLOR: PaletteToken = "warm-black-900";

function build(overrides?: TslMaterialOverrides): unknown {
  const THREE = loadThree();
  const NM = loadNodeMaterials();
  const params = {
    color: new THREE.Color(paletteColor(overrides?.color ?? DEFAULT_COLOR)),
    metalness: overrides?.metalness ?? 0.04,
    roughness: overrides?.roughness ?? 0.92,
  };
  if (NM?.MeshStandardNodeMaterial) {
    return new NM.MeshStandardNodeMaterial(params);
  }
  return new THREE.MeshStandardMaterial(params);
}

export const mattePreset: TslMaterialPreset = {
  id: "matte",
  name: "Matte",
  category: "fabric",
  description:
    "Flat warm-black with a soft ambient. Pairs with cel-shaded sets so the focal mesh keeps the spotlight.",
  cost: "cheap",
  backend: "dual",
  chip:
    "linear-gradient(180deg, #1d181f 0%, #14111a 60%, #0c0a12 100%)",
  build,
};

export default mattePreset;
