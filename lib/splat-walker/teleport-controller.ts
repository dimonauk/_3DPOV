/**
 * lib/splat-walker/teleport-controller.ts — Virtual ground-plane
 * teleport for the splat walker.
 *
 * The reason this exists: Gaussian splats are clouds of fuzzy
 * primitives, not triangles. There is no walkable geometry to
 * raycast against, so the standard @react-three/xr `TeleportTarget`
 * → mesh dance doesn't work out of the box. We sidestep by mounting
 * an invisible mesh at Y=0 that acts as the ground plane the user
 * teleports onto. The mesh covers a generous radius around the scene
 * origin so the user can step anywhere within the capture's working
 * volume.
 *
 * The controller also clamps the teleport destination — if the user
 * tries to walk off the plane (long-range thumb-stick aim), we snap
 * them to the nearest point inside the safe radius rather than
 * letting them end up far outside the splat's coverage.
 *
 * The hit-test mesh stays invisible (transparent material, no
 * depthWrite) so it doesn't tint the scene or block clicks on the
 * splat. Inside an XR session the @react-three/xr `TeleportTarget`
 * wraps it and feeds the controller's teleport ray.
 */

import type { Vector3 } from "three";

export type TeleportControllerOptions = {
  /** Y coordinate of the virtual ground. Default 0. */
  groundY?: number;
  /** Half-extent of the walkable square (metres). Default 12. */
  radius?: number;
};

export type TeleportControllerResult = {
  /** Clamped landing point on the virtual ground. */
  landing: { x: number; y: number; z: number };
  /** True if the requested point was outside `radius` and got snapped. */
  snapped: boolean;
};

/**
 * Resolve a teleport request to a safe landing point on the virtual
 * ground plane. Pass the raw `Vector3` from
 * `TeleportTarget#onTeleport` — we return clean coordinates and a
 * flag so the caller can decide whether to flash a "snapped" hint.
 */
export function resolveTeleportLanding(
  point: Vector3,
  opts: TeleportControllerOptions = {},
): TeleportControllerResult {
  const groundY = opts.groundY ?? 0;
  const radius = opts.radius ?? 12;
  const clampedX = clamp(point.x, -radius, radius);
  const clampedZ = clamp(point.z, -radius, radius);
  const snapped = clampedX !== point.x || clampedZ !== point.z;
  return {
    landing: { x: clampedX, y: groundY, z: clampedZ },
    snapped,
  };
}

/**
 * Geometry sizing helper for the invisible ground mesh. We use a
 * `<planeGeometry>` rotated -PI/2 about X to lie flat. Returns the
 * side length the geometry should be built with (2× radius).
 */
export function groundMeshSide(
  opts: TeleportControllerOptions = {},
): number {
  return (opts.radius ?? 12) * 2;
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
