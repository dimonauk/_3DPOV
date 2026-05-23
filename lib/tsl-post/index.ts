/**
 * lib/tsl-post/index.ts — Barrel for the TSL post-process pack.
 *
 * Exports:
 *   - Every effect by name (`bloomEffect`, `foilSheenEffect`, …)
 *   - `ALL_POST_EFFECTS` — frozen array, stable order
 *   - `XR_SAFE_EFFECTS` — subset where `config.xrSafe` is true
 *   - `getPostEffect(id)` — lookup by id, returns `undefined` on miss
 *   - Re-export of the shared types from `./types`
 *
 * Order in `ALL_POST_EFFECTS` is the recommended composition order:
 * grading (cel, posterise) → tonal (bloom, god-rays) → screen-anchored
 * (foil, scan-lines, grain) → optical artefacts (CA, vignette, DoF) →
 * structural (outline, pixelate). See docs/TSL-POST.md for the why.
 */

import { bitcrushPosteriseEffect } from "./effects/bitcrush-posterise";
import { bloomEffect } from "./effects/bloom";
import { celPostEffect } from "./effects/cel-post";
import {
  chromaticAberrationEffect,
  chromaticAberrationLowPreset,
} from "./effects/chromatic-aberration";
import { dctBlocksEffect } from "./effects/dct-blocks";
import { ditherBayerEffect } from "./effects/dither-bayer";
import { dofEffect } from "./effects/dof";
import { filmGrainEffect } from "./effects/film-grain";
import { foilSheenEffect } from "./effects/foil-sheen";
import { glitchCompositeEffect } from "./effects/glitch-composite";
import { godRaysEffect } from "./effects/god-rays";
import { outlineEffect } from "./effects/outline";
import { paperGrainEffect } from "./effects/paper-grain";
import { pixelateEffect } from "./effects/pixelate";
import { scanLinesEffect } from "./effects/scan-lines";
import { vhsTrackingEffect } from "./effects/vhs-tracking";
import { vignetteEffect } from "./effects/vignette";
import { waveWarpEffect } from "./effects/wave-warp";

import type { TslPostEffect } from "./types";

export {
  bitcrushPosteriseEffect,
  bloomEffect,
  celPostEffect,
  chromaticAberrationEffect,
  chromaticAberrationLowPreset,
  dctBlocksEffect,
  ditherBayerEffect,
  dofEffect,
  filmGrainEffect,
  foilSheenEffect,
  glitchCompositeEffect,
  godRaysEffect,
  outlineEffect,
  paperGrainEffect,
  pixelateEffect,
  scanLinesEffect,
  vhsTrackingEffect,
  vignetteEffect,
  waveWarpEffect,
};

export type {
  TslPostAttach,
  TslPostAttachOptions,
  TslPostCost,
  TslPostEffect,
  TslPostEffectConfig,
  TslPostEffectInstance,
} from "./types";

/**
 * Frozen — order matters. Grading → tonal → screen-anchored → optical
 * → structural. Effects stacked outside this order still work, this is
 * just the sensible default the showcase mounts with.
 */
export const ALL_POST_EFFECTS: ReadonlyArray<TslPostEffect> = Object.freeze([
  // Grading
  celPostEffect,
  bitcrushPosteriseEffect,
  // Tonal
  bloomEffect,
  godRaysEffect,
  foilSheenEffect,
  // Screen-anchored
  scanLinesEffect,
  vhsTrackingEffect,
  filmGrainEffect,
  paperGrainEffect,
  ditherBayerEffect,
  // Optical artefacts
  chromaticAberrationEffect,
  waveWarpEffect,
  dctBlocksEffect,
  glitchCompositeEffect,
  vignetteEffect,
  dofEffect,
  // Structural
  outlineEffect,
  pixelateEffect,
]);

/**
 * Effects that are safe to attach inside a live WebXR session. The
 * composer in `./composer.ts` filters by this when `xrActive` is set,
 * so the operator never sees an effect that breaks stereo comfort.
 */
export const XR_SAFE_EFFECTS: ReadonlyArray<TslPostEffect> = Object.freeze(
  ALL_POST_EFFECTS.filter((e) => e.config.xrSafe),
);

/**
 * Lookup by id. Returns `undefined` on miss — callers should fall back
 * to logging a warning rather than throwing so a typo in a saved
 * preset does not crash the page.
 */
export function getPostEffect(id: string): TslPostEffect | undefined {
  return ALL_POST_EFFECTS.find((e) => e.config.id === id);
}
