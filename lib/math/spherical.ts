/**
 * lib/math/spherical.ts — Spherical-coordinate helpers for yaw/pitch
 * data (gaze samples, head poses, drone bearings, sculpture-walk
 * positions).
 *
 * Lifted from D:/.github/Shadrerapp/src/libs/math-utils.ts
 * `SphericalMath` (Apache-2.0) per docs/SHADRERAPP_MIGRATION.md.
 * Atomised into named function exports (no namespace wrapper);
 * `degrees` suffix added to disambiguate from radian variants when
 * sibling helpers land.
 */

/**
 * Angular distance between two yaw/pitch points on the unit sphere
 * (degrees out, degrees in). Handles 360° wrap-around on the yaw axis
 * — a sample at yaw 359° and one at yaw 1° are 2° apart, not 358°.
 */
export function angularDistanceDegrees(
  a: readonly [number, number],
  b: readonly [number, number],
): number {
  const dy = a[1] - b[1];
  let dx = Math.abs(a[0] - b[0]);
  if (dx > 180) dx = 360 - dx;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Map yaw/pitch (degrees) → UV coordinates on a unit equirect.
 * `u` runs 0..1 across yaw -180..+180; `v` runs 0..1 down across
 * pitch +90 (top) .. -90 (bottom).
 */
export function degreesToUv(yaw: number, pitch: number): [number, number] {
  const u = (yaw + 180) / 360;
  const v = 1.0 - (pitch + 90) / 180;
  return [u, v];
}

/**
 * Inverse of `degreesToUv`. Equirect UV → yaw/pitch in degrees.
 */
export function uvToDegrees(u: number, v: number): [number, number] {
  const yaw = u * 360 - 180;
  const pitch = (1.0 - v) * 180 - 90;
  return [yaw, pitch];
}
