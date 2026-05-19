/**
 * lib/tsl-materials/presets/chrome.ts — Polished metal with a hint of
 * pink tint.
 *
 * Canonical reference: the workshop's brushed chrome lab plates, plus
 * Studio Ghibli "Howl's Moving Castle" chrome boiler highlights —
 * almost-mirror with a faint warm bias rather than a cold technical
 * grey. metalness 1.0, roughness 0.08 keeps the highlight tight
 * without crossing into discoball territory.
 *
 * Backend: dual-path. MeshStandardNodeMaterial is PBR and the colour
 * is constant, so it compiles to both WebGPU + WebGL2 cleanly.
 */
import { paletteColor, type PaletteToken } from "../palette";
import type { TslMaterialPreset, TslMaterialOverrides } from "../types";
import { loadNodeMaterials, loadThree } from "../internal";

const DEFAULT_COLOR: PaletteToken = "chrome-100";
const DEFAULT_TINT = 0xfff5f9; // pink-50 — barely-there warm wash.

function build(overrides?: TslMaterialOverrides): unknown {
  const THREE = loadThree();
  const NM = loadNodeMaterials();
  const colorHex = paletteColor(overrides?.color ?? DEFAULT_COLOR);
  const params = {
    color: new THREE.Color(colorHex).lerp(new THREE.Color(DEFAULT_TINT), 0.18),
    metalness: overrides?.metalness ?? 1.0,
    roughness: overrides?.roughness ?? 0.08,
    envMapIntensity: 1.2,
  };

  if (NM?.MeshStandardNodeMaterial) {
    return new NM.MeshStandardNodeMaterial(params);
  }
  // WebGL-only build of three (or test environment) — drop back to
  // vanilla MeshStandardMaterial. Same visual at this surface.
  return new THREE.MeshStandardMaterial(params);
}

export const chromePreset: TslMaterialPreset = {
  id: "chrome",
  name: "Chrome",
  category: "metal",
  description:
    "Polished plate with a near-mirror highlight and a thread of pink warmth so it never reads cold.",
  cost: "cheap",
  backend: "dual",
  chip:
    "linear-gradient(135deg, #fff5f9 0%, #eef1f5 35%, #d6dde5 65%, #b5c0cd 100%)",
  build,
};

export default chromePreset;
