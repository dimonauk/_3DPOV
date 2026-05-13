/**
 * Total Internal Reflection &mdash; the maths, in pure functions.
 *
 * The four equations a TIR visualiser needs:
 *
 *   1. Critical angle:        theta_c = arcsin(n2 / n1)   (only defined for n2 < n1)
 *   2. Snell&rsquo;s Law:     n1 * sin(theta_i) = n2 * sin(theta_t)
 *   3. TIR test:              theta_i > theta_c
 *   4. Fresnel reflectance:   the fraction of incident power that reflects
 *
 * All inputs and outputs are in DEGREES at the boundary of this module;
 * conversion to radians happens internally and never leaks. Callers should
 * never see a radian.
 *
 * Pure functions, no side effects, no React, no Three.js. Importable from
 * a server component, a client component, or a Node test runner.
 */

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

/**
 * Critical angle for the n1 &rarr; n2 interface, in degrees.
 *
 * Defined only when n2 < n1 (the only case where TIR is possible). When the
 * light is going from a less dense medium into a denser one, every angle
 * refracts and there is no critical angle &mdash; this returns null.
 *
 * Edge cases:
 *   - n1 &le; 0 or n2 &le; 0 &rarr; null (unphysical)
 *   - n2 / n1 &gt; 1 &rarr; null (no TIR; arcsin would be out of domain)
 *   - n2 === n1 &rarr; 90&deg; (the trivial case; the boundary is invisible)
 */
export function criticalAngle(n1: number, n2: number): number | null {
  if (!(n1 > 0) || !(n2 > 0)) return null;
  const ratio = n2 / n1;
  if (ratio > 1) return null;
  return Math.asin(ratio) * RAD;
}

/**
 * Refraction angle in degrees, given an incident angle in degrees and the
 * two refractive indices. Returns null when the ray undergoes TIR (no
 * refracted ray exists).
 *
 * Implements Snell&rsquo;s Law:  n1 * sin(theta_i) = n2 * sin(theta_t)
 * Solved for theta_t:            theta_t = arcsin(n1 * sin(theta_i) / n2)
 *
 * Incident angle is measured from the normal, clamped to [0, 90]. Outside
 * the valid domain (sin out of range, i.e. TIR), returns null.
 */
export function refractionAngle(
  incidentDeg: number,
  n1: number,
  n2: number,
): number | null {
  if (!(n1 > 0) || !(n2 > 0)) return null;
  if (incidentDeg < 0 || incidentDeg > 90) return null;
  const sinT = (n1 / n2) * Math.sin(incidentDeg * DEG);
  if (sinT > 1 || sinT < -1) return null;
  return Math.asin(sinT) * RAD;
}

/**
 * True if the incident ray undergoes total internal reflection.
 *
 * Requires both that TIR is possible at all (n2 < n1) AND that the incident
 * angle exceeds the critical angle. If TIR is impossible at the interface,
 * always returns false regardless of incident angle.
 */
export function isTIR(
  incidentDeg: number,
  n1: number,
  n2: number,
): boolean {
  const theta_c = criticalAngle(n1, n2);
  if (theta_c === null) return false;
  return incidentDeg > theta_c;
}

/**
 * Fresnel reflectance &mdash; the fraction of incident power that reflects.
 *
 * APPROXIMATION CHOSEN: the unpolarised average of the s- and p-polarisation
 * reflectances. This is the &ldquo;full&rdquo; Fresnel result for natural
 * (unpolarised) light, NOT Schlick&rsquo;s approximation. Schlick is faster
 * but loses accuracy near Brewster&rsquo;s angle and at glancing incidence,
 * both of which are interesting for the visualiser, so we pay the cost of
 * the real formula.
 *
 * Equations (theta_i from the normal, theta_t from Snell):
 *
 *   r_s = (n1*cos(theta_i) - n2*cos(theta_t)) / (n1*cos(theta_i) + n2*cos(theta_t))
 *   r_p = (n2*cos(theta_i) - n1*cos(theta_t)) / (n2*cos(theta_i) + n1*cos(theta_t))
 *   R   = 0.5 * (r_s^2 + r_p^2)
 *
 * Above the critical angle the ray totally reflects and we return 1
 * exactly (the physical answer; numerically Snell would give NaN through
 * an out-of-domain arcsin, so we short-circuit).
 *
 * Returns a value in [0, 1].
 */
export function fresnelReflectance(
  incidentDeg: number,
  n1: number,
  n2: number,
): number {
  if (!(n1 > 0) || !(n2 > 0)) return 0;
  if (incidentDeg < 0 || incidentDeg > 90) return 0;

  // Total internal reflection short-circuit.
  if (isTIR(incidentDeg, n1, n2)) return 1;

  const thetaI = incidentDeg * DEG;
  const sinT = (n1 / n2) * Math.sin(thetaI);

  // Defensive: even though isTIR() should have caught this, clamp.
  if (sinT > 1 || sinT < -1) return 1;

  const thetaT = Math.asin(sinT);
  const cosI = Math.cos(thetaI);
  const cosT = Math.cos(thetaT);

  const rs = (n1 * cosI - n2 * cosT) / (n1 * cosI + n2 * cosT);
  const rp = (n2 * cosI - n1 * cosT) / (n2 * cosI + n1 * cosT);

  const R = 0.5 * (rs * rs + rp * rp);

  // Numerical safety: clamp to [0, 1].
  if (R < 0) return 0;
  if (R > 1) return 1;
  return R;
}
