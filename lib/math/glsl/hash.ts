/**
 * lib/math/glsl/hash.ts — GLSL hash + pseudo-random primitives.
 *
 * Lifted from D:/.github/Shadrerapp/src/libs/glsl-utils.ts (Apache-2.0)
 * per docs/SHADRERAPP_MIGRATION.md. Atomised into a single named-string
 * export so the injection-by-detection helper in ./index.ts can compose
 * fragments from only the libraries a given shader actually needs.
 */

export const HASH = `
  float hash11(float p) {
      p = fract(p * .1031);
      p *= p + 33.33;
      p *= p + p;
      return fract(p);
  }
  float hash12(vec2 p) {
      vec3 p3  = fract(vec3(p.xyx) * .1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
  }
  vec2 hash22(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * .1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.xx+p3.yz)*p3.zy);
  }
`;
