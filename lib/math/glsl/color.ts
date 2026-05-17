/**
 * lib/math/glsl/color.ts — GLSL color-space helpers (HSV→RGB,
 * Iñigo-Quílez cosine palette).
 *
 * Lifted from Shadrerapp glsl-utils.ts (Apache-2.0) per
 * docs/SHADRERAPP_MIGRATION.md.
 */

export const COLOR = `
  vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  vec3 cosPalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
      return a + b * cos(6.28318 * (c * t + d));
  }
`;
