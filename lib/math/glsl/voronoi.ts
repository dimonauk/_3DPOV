/**
 * lib/math/glsl/voronoi.ts — Cellular (Voronoi) noise. Depends on HASH.
 *
 * Lifted from Shadrerapp glsl-utils.ts (Apache-2.0) per
 * docs/SHADRERAPP_MIGRATION.md.
 */

export const VORONOI = `
  vec2 voronoi(vec2 x) {
      vec2 n = floor(x);
      vec2 f = fract(x);
      vec2 mg, mr;
      float md = 8.0;
      for (int j=-1; j<=1; j++)
      for (int i=-1; i<=1; i++) {
          vec2 g = vec2(float(i),float(j));
          vec2 o = hash22( n + g );
          vec2 r = g + o - f;
          float d = dot(r,r);
          if( d<md ) {
              md = d;
              mr = r;
              mg = g;
          }
      }
      return vec2(sqrt(md), hash12(n + mg));
  }
`;
