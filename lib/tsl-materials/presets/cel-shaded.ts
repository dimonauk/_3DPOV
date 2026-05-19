/**
 * lib/tsl-materials/presets/cel-shaded.ts — Three-step lighting ramp
 * with a fresnel rim. VRM-compatible lighting direction.
 *
 * Canonical reference: MToon (VRM) and Studio Ghibli stylised plates.
 * The ramp is keyed off the same light direction VRM avatars expect
 * (the scene's first directional light, normalised), so a cel-shaded
 * prop in front of an Aura VRM holds together visually. Three flat
 * bands — shadow, midtone, highlight — plus an indigo fresnel rim.
 *
 * Backend: WebGPU-only. The step/smoothstep nodes are lightweight on
 * WebGL2 too, but the fallback below is cheaper and visually close.
 * If you need true cel-shading on WebGL, use VRM's MToon material
 * directly.
 */
import {
  loadNodeMaterials,
  loadThree,
  loadTSL,
  tokenHex,
} from "../internal";
import type { TslMaterialPreset, TslMaterialOverrides } from "../types";

function build(overrides?: TslMaterialOverrides): unknown {
  const THREE = loadThree();
  const TSL = loadTSL();
  const NM = loadNodeMaterials();

  if (!TSL || !NM?.MeshBasicNodeMaterial) {
    // Toon-ish fallback — flat color + onBeforeCompile-free toon mat.
    return new THREE.MeshToonMaterial({
      color: new THREE.Color(tokenHex(overrides?.color ?? "pink-200")),
    });
  }

  const baseHex = tokenHex(overrides?.color ?? "pink-200");
  const material = new NM.MeshBasicNodeMaterial({
    color: new THREE.Color(baseHex),
  }) as {
    colorNode?: unknown;
  };

  // Light direction — matches VRM MToon's default mainLightDirection
  // (the scene's first DirectionalLight, normalised). We bake it as
  // a const node here so the cel ramp doesn't depend on the scene's
  // light array. Callers that need a per-scene direction should set
  // a `lightDirection` uniform on the returned material.
  const L = TSL.normalize(TSL.vec3(0.35, 0.7, 0.6));
  const n = TSL.normalize(TSL.normalView);
  const nDotL = TSL.dot(n, L);

  // Three-step ramp — shadow at -1..0.0, mid at 0.0..0.5, hi above.
  const shadow = TSL.color(tokenHex("warm-black-700"));
  const mid = TSL.color(baseHex);
  const hi = TSL.color(tokenHex("pink-100"));
  const stepMid = TSL.smoothstep(TSL.float(0.0), TSL.float(0.08), nDotL);
  const stepHi = TSL.smoothstep(TSL.float(0.45), TSL.float(0.55), nDotL);
  const lit = TSL.mix(TSL.mix(shadow, mid, stepMid), hi, stepHi);

  // Fresnel rim — indigo against the warmer body, painted on as
  // additive.
  const v = TSL.normalize(TSL.cameraPosition.sub(TSL.positionView));
  const rim = TSL.pow(
    TSL.oneMinus(TSL.saturate(TSL.dot(n, v))),
    TSL.float(3.0),
  );
  const rimColor = TSL.mul(TSL.color(tokenHex("lavender-300")), rim.mul(0.7));

  material.colorNode = TSL.add(lit, rimColor);
  return material;
}

export const celShadedPreset: TslMaterialPreset = {
  id: "cel-shaded",
  name: "Cel Shaded",
  category: "plastic",
  description:
    "Three-band ramp keyed off the VRM main light direction, lavender fresnel rim. Plays nicely next to an Aura VRM.",
  cost: "moderate",
  backend: "webgpu-only",
  chip:
    "linear-gradient(135deg, #2a232f 0%, #2a232f 20%, #ffc4d9 22%, #ffc4d9 65%, #ffe4ee 68%, #ffe4ee 100%)",
  build,
};

export default celShadedPreset;
