/**
 * lib/tsl-materials/index.ts — Barrel + registry for every TSL preset.
 *
 * Usage:
 *
 *   import { getMaterialPreset } from "lib/tsl-materials";
 *   const preset = getMaterialPreset("waveguide-glow");
 *   const mat = preset!.build({ emissive: "pink-400" });
 *
 * The presets register themselves into `ALL_MATERIAL_PRESETS` via
 * this barrel. Adding a new preset is: write `presets/foo.ts`,
 * import it here, push into the registry. The showcase page picks
 * it up automatically.
 */
export type {
  TslMaterialPreset,
  TslMaterialOverrides,
  TslMaterialCategory,
  TslMaterialCost,
  TslMaterialBackend,
  TslMaterialResult,
} from "./types";

export { paletteHex, paletteColor, tslPaletteColor } from "./palette";
export type { PaletteToken } from "./palette";

import type { TslMaterialPreset } from "./types";

import { chromePreset } from "./presets/chrome";
import { foilPreset } from "./presets/foil";
import { mattePreset } from "./presets/matte";
import { glassPreset } from "./presets/glass";
import { frostedGlassPreset } from "./presets/frosted-glass";
import { holographicPreset } from "./presets/holographic";
import { anodisedPreset } from "./presets/anodised";
import { waveguideGlowPreset } from "./presets/waveguide-glow";
import { paintedPlasticPreset } from "./presets/painted-plastic";
import { celShadedPreset } from "./presets/cel-shaded";
import { skinPreset } from "./presets/skin";
import { stonePreset } from "./presets/stone";

/**
 * Every shipped preset, in catalogue order. The showcase page renders
 * this array as-is; downstream consumers (StageStage's preset wrapper,
 * the brick library) lookup by id via `getMaterialPreset`.
 */
export const ALL_MATERIAL_PRESETS: readonly TslMaterialPreset[] = [
  chromePreset,
  foilPreset,
  mattePreset,
  glassPreset,
  frostedGlassPreset,
  holographicPreset,
  anodisedPreset,
  waveguideGlowPreset,
  paintedPlasticPreset,
  celShadedPreset,
  skinPreset,
  stonePreset,
];

const REGISTRY: ReadonlyMap<string, TslMaterialPreset> = new Map(
  ALL_MATERIAL_PRESETS.map((p) => [p.id, p]),
);

/**
 * Lookup by id. Returns undefined when the id is unknown — callers
 * should treat that as a typo on their side, not as a fallback path.
 */
export function getMaterialPreset(id: string): TslMaterialPreset | undefined {
  return REGISTRY.get(id);
}

/** Filter helper used by the showcase page's category strip. */
export function presetsByCategory(
  category: TslMaterialPreset["category"],
): TslMaterialPreset[] {
  return ALL_MATERIAL_PRESETS.filter((p) => p.category === category);
}

/** Direct re-exports for code that prefers named imports. */
export {
  chromePreset,
  foilPreset,
  mattePreset,
  glassPreset,
  frostedGlassPreset,
  holographicPreset,
  anodisedPreset,
  waveguideGlowPreset,
  paintedPlasticPreset,
  celShadedPreset,
  skinPreset,
  stonePreset,
};
