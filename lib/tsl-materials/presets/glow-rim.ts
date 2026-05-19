/**
 * lib/tsl-materials/presets/glow-rim.ts — Pure additive rim-only
 * material. Body is dark, silhouette glows.
 *
 * Rim-light pattern adapted from MToon
 * (https://github.com/Santarh/MToon — MIT, authors: Santarh + VRM Consortium).
 * MToon's `_RimColor` + `_RimFresnelPower` + `_RimLift` parameters map
 * one-to-one onto the rim node + power + lift fields here. The rest
 * (palette tokens, additive composition, dual-path fallback) is
 * studio code.
 *
 * Why this is its own preset rather than a knob on `waveguide-glow`:
 * waveguide-glow uses transmission, which is expensive and only renders
 * convincingly on closed manifolds. This preset is unlit + additive,
 * so it works on any geometry (open shells, particles, sprite quads)
 * at cheap cost. Use it for halos, dock pips, screen-space markers.
 *
 * Backend: WebGPU-only for the proper rim node. WebGL fallback returns
 * a MeshBasicMaterial with the rim colour as a flat tint — the
 * silhouette glow drops out, but the colour stays on-brand.
 */
import {
  loadNodeMaterials,
  loadThree,
  loadTSL,
  tokenHex,
} from "../internal";
import type { TslMaterialPreset, TslMaterialOverrides } from "../types";

const DEFAULT_RIM_POWER = 3.2;
const DEFAULT_RIM_LIFT = 0.08;

function build(overrides?: TslMaterialOverrides): unknown {
  const THREE = loadThree();
  const TSL = loadTSL();
  const NM = loadNodeMaterials();

  const rimToken = overrides?.emissive ?? "pink-300";
  const bodyToken = overrides?.color ?? "warm-black-900";

  if (!TSL || !NM?.MeshBasicNodeMaterial) {
    // Flat fallback — rim colour as the tint. The silhouette glow
    // drops out, but at least the chip reads right.
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(tokenHex(rimToken)),
      transparent: true,
      opacity: overrides?.opacity ?? 0.85,
    });
    mat.blending = THREE.AdditiveBlending;
    return mat;
  }

  const material = new NM.MeshBasicNodeMaterial({
    color: new THREE.Color(tokenHex(bodyToken)),
    transparent: true,
    opacity: overrides?.opacity ?? 1,
  }) as {
    colorNode?: unknown;
    blending?: number;
  };

  // Additive blending so the rim adds on top of whatever it overlays
  // rather than masking it. Matches MToon's recommended rim setup.
  material.blending = THREE.AdditiveBlending;

  // Standard rim — 1 - saturate(dot(normal, view)) raised to a tight
  // power so only the silhouette band lights up. `lift` adds a small
  // constant so the inner body is not pure black, which would crush
  // detail when this is composited over a scene.
  const n = TSL.normalView;
  const v = TSL.normalize(TSL.cameraPosition.sub(TSL.positionView));
  const fres = TSL.pow(
    TSL.oneMinus(TSL.saturate(TSL.dot(n, v))),
    TSL.float(DEFAULT_RIM_POWER),
  );
  const rim = TSL.add(fres, TSL.float(DEFAULT_RIM_LIFT));

  const rimColor = TSL.color(tokenHex(rimToken));
  const body = TSL.color(tokenHex(bodyToken));

  // Body sits at near-zero, rim multiplied up. Additive blending in
  // the scene composes the result over whatever is behind.
  material.colorNode = TSL.add(body, TSL.mul(rimColor, rim));
  return material;
}

export const glowRimPreset: TslMaterialPreset = {
  id: "glow-rim",
  name: "Glow Rim",
  category: "glow",
  description:
    "Pure additive silhouette halo. Cheap, geometry-agnostic — use for dock pips, focus markers, anything that needs an outline glow without transmission cost.",
  cost: "cheap",
  backend: "webgpu-only",
  chip:
    "radial-gradient(closest-side at 50% 50%, transparent 30%, #ff9fbf 75%, #ff558f 100%)",
  build,
};

export default glowRimPreset;
