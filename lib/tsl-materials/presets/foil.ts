/**
 * lib/tsl-materials/presets/foil.ts — Animated holographic foil sweep.
 *
 * Canonical reference: the `.lux-foil` CSS treatment in app/globals.css.
 * We mirror its three-stop gradient (pink-200 → chrome-100 →
 * lavender-200) in TSL so the same look reads in 3D material space.
 * A diagonal sine wave drives the highlight position; the wave
 * frequency is tuned to roughly the same 9-second cycle the CSS
 * keyframes use.
 *
 * Backend: dual-path. The animated colour graph is a `mix(mix(...), …)`
 * over UV + time, which the WebGL2 node backend handles fine.
 *
 * Reduced-motion: returned material exposes a `phaseUniform` property;
 * callers either tick it from their loop, or leave it at zero so the
 * gradient sits as a static sweep. The SceneStage helper in
 * `lib/xr-scene/tsl-presets.ts` is the canonical ticker.
 */
import {
  loadNodeMaterials,
  loadThree,
  loadTSL,
  tokenHex,
} from "../internal";
import type { TslMaterialPreset, TslMaterialOverrides } from "../types";

const PINK_200 = "pink-200" as const;
const CHROME_100 = "chrome-100" as const;
const LAVENDER_200 = "lavender-200" as const;

function build(overrides?: TslMaterialOverrides): unknown {
  const THREE = loadThree();
  const TSL = loadTSL();
  const NM = loadNodeMaterials();

  if (!TSL || !NM?.MeshStandardNodeMaterial) {
    // No TSL — flat pink with a hint of metalness, near-foil look.
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(tokenHex(overrides?.color ?? PINK_200)),
      metalness: overrides?.metalness ?? 0.55,
      roughness: overrides?.roughness ?? 0.32,
    });
  }

  const phase = TSL.uniform(0);
  const material = new NM.MeshStandardNodeMaterial({
    metalness: overrides?.metalness ?? 0.45,
    roughness: overrides?.roughness ?? 0.28,
    color: new THREE.Color(tokenHex(overrides?.color ?? PINK_200)),
  }) as {
    colorNode?: unknown;
    emissiveNode?: unknown;
    phaseUniform?: unknown;
  };

  // Diagonal UV + phase → wrapped sine [0,1]. Three colour stops are
  // mixed across that sweep parameter so the highlight reads as the
  // chrome midpoint sliding under the pink and lavender bands.
  const uv = TSL.uv();
  const sweep = TSL.sin(
    TSL.add(uv.x, uv.y, phase).mul(TSL.float(6.2831853)),
  ).mul(0.5).add(0.5);
  const pink = TSL.color(tokenHex(PINK_200));
  const chrome = TSL.color(tokenHex(CHROME_100));
  const lavender = TSL.color(tokenHex(LAVENDER_200));
  // Two-stage mix: pink → chrome on the first half, chrome → lavender
  // on the second half. saturate keeps the parameter in range.
  const half = TSL.saturate(sweep.mul(2.0));
  const halfB = TSL.saturate(sweep.sub(0.5).mul(2.0));
  const blended = TSL.mix(TSL.mix(pink, chrome, half), lavender, halfB);

  material.colorNode = blended;
  material.emissiveNode = TSL.mul(pink, sweep.mul(0.18));
  material.phaseUniform = phase;
  return material;
}

export const foilPreset: TslMaterialPreset = {
  id: "foil",
  name: "Foil",
  category: "metal",
  description:
    "Holographic sweep, three stops, same gradient as .lux-foil. Animate the phase uniform or leave it still for reduced motion.",
  cost: "moderate",
  backend: "dual",
  chip:
    "linear-gradient(100deg, #ffc4d9 0%, #eef1f5 40%, #cfb7ff 70%, #ffc4d9 100%)",
  build,
};

export default foilPreset;
