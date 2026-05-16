// Mask + depth -> 3D scalar field for marching cubes.
//
// Earlier maskToField just extruded the 2D mask along Z, producing
// flat slabs. With a per-pixel depth map we place each masked pixel at
// its actual position in space, so a poi spiral becomes a 3D spiral
// rather than a pancake.
//
// depthConfidence blends between flat-extrusion (0) and fully
// depth-driven placement (1). Useful when the depth estimate is
// unreliable (very dark trail, no scene context) — the operator can
// dial back without losing the rest of the pipeline.

import type { Field } from "./field";

export type DepthMap = { data: Float32Array; width: number; height: number };

export function maskAndDepthToField(
  mask: ImageData,
  depth: DepthMap | null,
  res: number,
  thickness = 0.2,
  depthConfidence = 0.85,
): Field {
  const data = new Float32Array(res * res * res);
  const mw = mask.width;
  const mh = mask.height;

  // Resample mask + depth to a `res × res` 2D buffer first.
  const alpha = new Float32Array(res * res);
  const depthVal = new Float32Array(res * res);
  for (let y = 0; y < res; y++) {
    for (let x = 0; x < res; x++) {
      const sx = Math.floor((x / res) * mw);
      const sy = Math.floor((y / res) * mh);
      alpha[y * res + x] = mask.data[(sy * mw + sx) * 4 + 3] / 255;
      depthVal[y * res + x] = depth
        ? sampleBilinear(depth, x / res, y / res)
        : 0.5;
    }
  }

  const halfThickness = thickness * res * 0.5;

  for (let y = 0; y < res; y++) {
    for (let x = 0; x < res; x++) {
      const a = alpha[y * res + x];
      if (a < 0.05) continue;

      const d = depthVal[y * res + x];
      const zCentreDepth = d * (res - 1);
      // Low confidence -> recentre to slab middle (mimics flat extrusion).
      const zCentre =
        depthConfidence * zCentreDepth + (1 - depthConfidence) * (res / 2);
      // Mask alpha controls slab thickness — thicker line = deeper sculpture.
      const thicknessHere = halfThickness * (0.4 + 0.6 * a);

      for (let z = 0; z < res; z++) {
        const dz = Math.abs(z - zCentre);
        if (dz > thicknessHere) continue;
        const profile = a * (1 - dz / thicknessHere);
        const idx = z * res * res + y * res + x;
        if (profile > data[idx]) data[idx] = profile;
      }
    }
  }

  // Subtract a small constant so background sits below the iso surface.
  for (let i = 0; i < data.length; i++) {
    if (data[i] === 0) data[i] = -1;
  }

  return { data, res };
}

function sampleBilinear(map: DepthMap, u: number, v: number): number {
  const fx = u * (map.width - 1);
  const fy = v * (map.height - 1);
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(map.width - 1, x0 + 1);
  const y1 = Math.min(map.height - 1, y0 + 1);
  const tx = fx - x0;
  const ty = fy - y0;
  const a = map.data[y0 * map.width + x0];
  const b = map.data[y0 * map.width + x1];
  const c = map.data[y1 * map.width + x0];
  const d = map.data[y1 * map.width + x1];
  return (
    a * (1 - tx) * (1 - ty) +
    b * tx * (1 - ty) +
    c * (1 - tx) * ty +
    d * tx * ty
  );
}
