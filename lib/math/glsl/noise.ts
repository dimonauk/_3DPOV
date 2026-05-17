/**
 * lib/math/glsl/noise.ts — Perlin noise + fBm. Depends on HASH.
 *
 * Lifted from Shadrerapp glsl-utils.ts (Apache-2.0) per
 * docs/SHADRERAPP_MIGRATION.md.
 */

export const NOISE = `
  float perlin(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash12(i + vec2(0.0, 0.0)), hash12(i + vec2(1.0, 0.0)), u.x),
                 mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  float fbm(vec2 p, int octaves) {
      float v = 0.0;
      float a = 0.5;
      vec2 shift = vec2(100);
      for (int i = 0; i < 16; ++i) {
          if(i >= octaves) break;
          v += a * perlin(p);
          p = p * 2.0 + shift;
          a *= 0.5;
      }
      return v;
  }
`;
