/**
 * lib/tsl-materials/types.ts — Public shape of a TSL material preset.
 *
 * Every preset in `lib/tsl-materials/presets/*` exports a single
 * `TslMaterialPreset` value. Authors pick one by id from
 * `ALL_MATERIAL_PRESETS` (or `getMaterialPreset(id)`) and call
 * `preset.build(overrides?)` to mint a fresh NodeMaterial instance.
 *
 * Why `unknown` on the build return:
 *   `@types/three` does not re-export `NodeMaterial` cleanly across
 *   the `three/webgpu` surface, so leaking a structurally-typed value
 *   keeps the preset modules from depending on private type paths.
 *   The few callers that need to attach the material to a mesh cast
 *   to `THREE.Material` at the call site — that's a one-line cast,
 *   not a project-wide type leak.
 */
import type { PaletteToken } from "./palette";

/**
 * Per-call overrides. Each field is optional; the preset's defaults
 * apply otherwise. Colour fields take a palette token (e.g.
 * "pink-200") rather than a raw hex so authors stay on-palette and
 * the swatches in `MaterialChip` resolve from the same source.
 */
export type TslMaterialOverrides = {
  /** Base albedo / tint. Palette token. */
  color?: PaletteToken;
  /** Emissive tint. Palette token. */
  emissive?: PaletteToken;
  /** PBR metalness [0..1]. */
  metalness?: number;
  /** PBR roughness [0..1]. */
  roughness?: number;
  /** Opacity [0..1]. Drives `transparent` on the resulting material. */
  opacity?: number;
};

/**
 * Material rendering cost band. Used by the showcase page and any
 * downstream catalogue to flag the "you probably don't want twenty
 * of these on screen at once" presets (holographic, glass).
 */
export type TslMaterialCost = "cheap" | "moderate" | "expensive";

/**
 * Shader backend the preset compiles to. TSL presets are usually
 * dual-path (WebGPU NodeMaterial + WebGL2 via the node backend);
 * the holographic and transmission-heavy ones we flag as WebGPU-only
 * because the WebGL backend either misses the feature or runs at
 * unusable cost.
 */
export type TslMaterialBackend = "webgpu-only" | "dual";

export type TslMaterialCategory =
  | "metal"
  | "glass"
  | "fabric"
  | "skin"
  | "glow"
  | "plastic"
  | "stone";

/**
 * A built material. We don't import THREE types here so the preset
 * modules stay loadable in SSR without pulling three. Callers cast
 * to `import("three").Material` at the consumption site.
 */
export type TslMaterialResult = unknown;

export type TslMaterialPreset = {
  /** Stable slug — used in URLs, lookup keys, telemetry labels. */
  id: string;
  /** Display name for editorial UI. */
  name: string;
  /** Category for the showcase filter strip. */
  category: TslMaterialCategory;
  /** Single-line description in workshop-Dimona voice. */
  description: string;
  /** Cost band for the page-budget calculation. */
  cost: TslMaterialCost;
  /** Which renderer backends the preset honestly supports. */
  backend: TslMaterialBackend;
  /** CSS hint for the static MaterialChip swatch — a CSS background value. */
  chip: string;
  /**
   * Build a NodeMaterial (or MeshPhysicalMaterial fallback). The
   * caller owns disposal. Returns `unknown` so this module avoids
   * import-time dependencies on three's type surface — cast to
   * `THREE.Material` where you assign it to a mesh.
   */
  build: (overrides?: TslMaterialOverrides) => TslMaterialResult;
};
