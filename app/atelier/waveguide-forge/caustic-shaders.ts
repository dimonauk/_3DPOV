/**
 * app/atelier/waveguide-forge/caustic-shaders.ts
 *
 * GLSL 3.00 ES raymarching shader pair used by the default backend.
 *
 * Two SDF sources:
 *   - Parametric gyroid (default; tweak via uDensity + uThickness)
 *   - Sampled `sampler3D` (when uHasSdf = true)
 *
 * Multi-light: up to MAX_LIGHTS area lights, jittered within `coneAngle`
 * and a disk of `radius`. The user-controlled SAMPLES_PER_LIGHT trades
 * caustic noise for FPS. 8 samples/light * 4 lights still runs > 60 fps
 * on a 3080. Ported as-is from the bench prototype at
 * apps/waveguide-forge/src/caustic.glsl.ts.
 */

export const vertexShader = /* glsl */ `
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const fragmentShader = /* glsl */ `
precision highp float;
precision highp sampler3D;

#define MAX_LIGHTS 4
#define SAMPLES_PER_LIGHT 8
#define MAX_STEPS 96
#define MAX_DIST 8.0

struct Light {
  vec3 origin;
  vec3 direction;
  float coneAngle;
  float radius;
  float intensity;
};

uniform vec2 uResolution;
uniform float uTime;
uniform float uIor;
uniform float uDensity;
uniform float uThickness;
uniform int uLightCount;
uniform Light uLights[MAX_LIGHTS];
uniform bool uHasSdf;
uniform sampler3D uSdf;
uniform vec3 uSdfMin;
uniform vec3 uSdfMax;

in vec2 vUv;
out vec4 fragColor;

float gyroid(vec3 p, float f) {
  p *= f;
  return (sin(p.x) * cos(p.y) + sin(p.y) * cos(p.z) + sin(p.z) * cos(p.x)) / f;
}

float sampleSdfTexture(vec3 p) {
  vec3 t = (p - uSdfMin) / (uSdfMax - uSdfMin);
  if (any(lessThan(t, vec3(0.0))) || any(greaterThan(t, vec3(1.0)))) {
    return 1.0;
  }
  return texture(uSdf, t).r;
}

float sdf(vec3 p) {
  if (uHasSdf) {
    return sampleSdfTexture(p);
  }
  float g = gyroid(p, uDensity) - 0.1;
  float bound = length(p) - 1.0;
  return max(g, bound);
}

vec3 sdfNormal(vec3 p) {
  float e = 0.001;
  return normalize(vec3(
    sdf(p + vec3(e, 0, 0)) - sdf(p - vec3(e, 0, 0)),
    sdf(p + vec3(0, e, 0)) - sdf(p - vec3(0, e, 0)),
    sdf(p + vec3(0, 0, e)) - sdf(p - vec3(0, 0, e))
  ));
}

float hash(vec3 v) {
  return fract(sin(dot(v, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
}

vec2 jitter2D(vec3 seed) {
  return vec2(hash(seed), hash(seed + 17.0));
}

float traceOne(vec3 ro, vec3 rd, vec2 uv) {
  float t = 0.0;
  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 p = ro + rd * t;
    float d = sdf(p);
    if (d < 0.001) {
      vec3 n = sdfNormal(p);
      vec3 refracted = refract(rd, n, 1.0 / uIor);
      if (refracted.y >= -0.001) return 0.0;
      float tg = (-1.0 - p.y) / refracted.y;
      vec3 hit = p + refracted * tg;
      return 1.0 / (0.5 + length(hit.xz - (uv - 0.5) * 3.0) * 4.0);
    }
    t += max(d, 0.001);
    if (t > MAX_DIST) break;
  }
  return 0.0;
}

float causticFromLight(Light L, vec2 uv) {
  float total = 0.0;
  for (int s = 0; s < SAMPLES_PER_LIGHT; s++) {
    vec2 j = jitter2D(vec3(uv * 1000.0, float(s) + uTime));
    float r = sqrt(j.x) * L.radius;
    float a = j.y * 6.2831853;
    vec3 ro = L.origin + vec3(cos(a) * r, 0.0, sin(a) * r) +
              vec3((uv - 0.5) * 3.0, 0.0).xzy;
    ro.y = 1.5 + L.origin.y;
    vec2 j2 = jitter2D(vec3(uv * 2000.0, float(s) * 17.0 + uTime));
    float ca = j2.x * L.coneAngle;
    float caa = j2.y * 6.2831853;
    vec3 perp1 = normalize(cross(L.direction, vec3(0.0, 0.0, 1.0)));
    vec3 perp2 = cross(L.direction, perp1);
    vec3 rd = normalize(
      L.direction * cos(ca) + (perp1 * cos(caa) + perp2 * sin(caa)) * sin(ca)
    );
    total += traceOne(ro, rd, uv);
  }
  return total * L.intensity / float(SAMPLES_PER_LIGHT);
}

void main() {
  vec2 uv = vUv;
  float c = 0.0;
  for (int li = 0; li < MAX_LIGHTS; li++) {
    if (li >= uLightCount) break;
    c += causticFromLight(uLights[li], uv);
  }
  c *= uThickness;
  vec3 col = mix(vec3(0.05, 0.05, 0.08), vec3(1.0, 0.85, 0.6), c);
  col += vec3(0.0, c * 0.3, c * 0.5);
  fragColor = vec4(col, 1.0);
}
`;
