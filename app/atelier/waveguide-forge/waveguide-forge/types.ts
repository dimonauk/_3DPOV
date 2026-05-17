/**
 * app/atelier/waveguide-forge/waveguide-forge/types.ts — Light config
 * shared between the GLSL caustic plane and the WebGPU photon-map
 * backend.
 *
 * Extracted from waveguide-forge-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import * as THREE from "three";

export type LightCfg = {
  origin: [number, number, number];
  direction: [number, number, number];
  coneAngle: number;
  radius: number;
  intensity: number;
};

export const DEFAULT_LIGHT: LightCfg = {
  origin: [0, 0, 0],
  direction: [0, -1, 0],
  coneAngle: 0.05,
  radius: 0.05,
  intensity: 1,
};

// Always returns exactly 4 padded entries (the GLSL fragment expects
// uLights to be a fixed-size array). Slots past the live light count
// fall back to DEFAULT_LIGHT.
export function padLights(lights: LightCfg[]): unknown[] {
  const out: unknown[] = [];
  for (let i = 0; i < 4; i++) {
    const l = lights[i] ?? DEFAULT_LIGHT;
    out.push({
      origin: new THREE.Vector3(...l.origin),
      direction: new THREE.Vector3(...l.direction).normalize(),
      coneAngle: l.coneAngle,
      radius: l.radius,
      intensity: l.intensity,
    });
  }
  return out;
}
