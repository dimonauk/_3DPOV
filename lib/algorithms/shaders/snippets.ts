/**
 * lib/algorithms/shaders/snippets.ts — Insertable GLSL function
 * snippets, grouped by category.
 *
 * Lifted from D:/.github/Shadrerapp/src/apps/ShaderEditor/components/
 * SnippetLibrary.tsx DEFAULT_SNIPPETS (Apache-2.0) per
 * docs/SHADRERAPP_MIGRATION.md. Stripped of the React component
 * shell — what's left is the typed data registry the chamber's
 * snippet panel renders from.
 *
 * Smaller than the preset registry; intentionally short snippets a
 * shader author drops into a render() body or above it to bring in
 * a primitive (hash, perlin, sdSphere, etc.).
 */

export type ShaderSnippet = {
  id: string;
  name: string;
  category: string;
  code: string;
};

export const SNIPPETS: ShaderSnippet[] = [
  {
    id: "hash11",
    name: "Hash 1D",
    category: "Noise & Random",
    code: `float hash11(float p) {
    p = fract(p * .1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
}`,
  },
  {
    id: "perlin",
    name: "Perlin Noise 2D",
    category: "Noise & Random",
    code: `float perlin(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash12(i + vec2(0.0, 0.0)), hash12(i + vec2(1.0, 0.0)), u.x),
               mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}`,
  },
  {
    id: "fbm",
    name: "Fractal Brownian Motion",
    category: "Noise & Random",
    code: `float fbm(vec2 p, int octaves) {
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
}`,
  },
  {
    id: "sdSphere",
    name: "SDF Sphere",
    category: "SDF Primitives",
    code: `float sdSphere(vec3 p, float s) {
    return length(p) - s;
}`,
  },
  {
    id: "sdBox",
    name: "SDF Box",
    category: "SDF Primitives",
    code: `float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}`,
  },
  {
    id: "rotate",
    name: "Rotate 2D",
    category: "Space & Math",
    code: `vec2 rotate(vec2 p, float a) {
    float s = sin(a), c = cos(a);
    return p * mat2(c, s, -s, c);
}`,
  },
  {
    id: "hsv2rgb",
    name: "HSV to RGB",
    category: "Color",
    code: `vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}`,
  },
];

export type SnippetCategory = (typeof SNIPPETS)[number]["category"];

/** Group snippets by their declared category for panel rendering. */
export function snippetsByCategory(): Map<string, ShaderSnippet[]> {
  const map = new Map<string, ShaderSnippet[]>();
  for (const s of SNIPPETS) {
    const list = map.get(s.category) ?? [];
    list.push(s);
    map.set(s.category, list);
  }
  return map;
}
