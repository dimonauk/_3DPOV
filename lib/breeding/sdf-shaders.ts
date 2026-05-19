/**
 * lib/breeding/sdf-shaders.ts — fragment shader for the breeding preview.
 *
 * Ray-marches the smooth-minimum (`smin`) blend of two parent SDFs picked from
 * five kingdom prototypes. Uniforms:
 *   - uParentA, uParentB : int   (kingdom id 0..4)
 *   - uK                 : float (softness, world-units; 0 -> hard union)
 *   - uTime              : float (seconds, drives turing/slime animation)
 *   - uResolution        : vec2  (canvas px)
 *   - uShowOnlyA, uShowOnlyB : int (0/1; for mini-canvases — when 1, the
 *                          second SDF is pushed far away so we render only one)
 *
 * Kingdom ids:
 *   0 gyroid     — triply-periodic level set
 *   1 turing     — hashed reaction-diffusion stand-in on a sphere
 *   2 wgm        — three offset tori (waveguide-mosaic stand-in)
 *   3 ctenophore — helically swept tube
 *   4 slime      — fibonacci-spiral sphere union
 *
 * smin is the polynomial form from Inigo Quilez,
 * https://iquilezles.org/articles/smin/
 */

export const BREEDING_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const BREEDING_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform vec2  uResolution;
  uniform float uTime;
  uniform int   uParentA;
  uniform int   uParentB;
  uniform float uK;
  uniform int   uShowOnlyA;
  uniform int   uShowOnlyB;

  const float PI = 3.14159265359;
  const int   MAX_STEPS = 96;
  const float MIN_DIST  = 0.001;
  const float MAX_DIST  = 12.0;
  const float EPS       = 0.001;

  // ----- IQ polynomial smooth-min ---------------------------------------
  float smin(float a, float b, float k) {
    k = max(k, 1e-4);
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
  }

  // ----- cheap hash for turing/slime ------------------------------------
  float hash13(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  // ===== kingdom SDFs ===================================================

  // gyroid: triply-periodic level set, bounded inside a unit-ish sphere
  float sdfGyroid(vec3 p) {
    float scale = 2.4;
    vec3  q = p * scale;
    float g = sin(q.x) * cos(q.y)
            + sin(q.y) * cos(q.z)
            + sin(q.z) * cos(q.x);
    // distance approximation: scale-corrected, bounded by a sphere
    float bound = length(p) - 0.95;
    float gyr   = g * 0.5 / scale;
    return max(bound, gyr);
  }

  // turing: noise-displaced sphere, cheap reaction-diffusion stand-in
  float sdfTuring(vec3 p) {
    float r = 0.7;
    vec3  q = p * 4.0 + vec3(0.0, uTime * 0.3, 0.0);
    float n = hash13(floor(q));
    float s = smoothstep(0.3, 0.7, n);
    float disp = (s - 0.5) * 0.18;
    return length(p) - (r + disp);
  }

  // wgm: three offset tori on different axes
  float sdfTorus(vec3 p, float R, float r) {
    return length(vec2(length(p.xy) - R, p.z)) - r;
  }
  float sdfWgm(vec3 p) {
    float t1 = sdfTorus(p,                   0.55, 0.10);
    float t2 = sdfTorus(p.yzx + vec3(0.15, 0.0, 0.0), 0.45, 0.09);
    float t3 = sdfTorus(p.zxy - vec3(0.0, 0.10, 0.0), 0.40, 0.08);
    return min(t1, min(t2, t3));
  }

  // ctenophore: helically swept tube
  float sdfCtenophore(vec3 p) {
    float N = 5.0;
    float R = 0.45;
    float r = 0.12;
    vec2  c = vec2(cos(p.y * N), sin(p.y * N)) * R;
    float tube = length(p.xz - c) - r;
    // cap along y so it isn't infinite
    float cap = abs(p.y) - 0.85;
    return max(tube, cap);
  }

  // slime: fibonacci-spiral union of N spheres
  float sdfSlime(vec3 p) {
    const int N = 9;
    float ga = PI * (3.0 - sqrt(5.0));
    float d = MAX_DIST;
    for (int i = 0; i < N; i++) {
      float fi    = float(i);
      float t     = fi / float(N - 1);
      float y     = 1.0 - 2.0 * t;
      float rad   = sqrt(max(0.0, 1.0 - y * y));
      float theta = ga * fi + uTime * 0.4;
      vec3  c     = 0.55 * vec3(cos(theta) * rad, y, sin(theta) * rad);
      float sd    = length(p - c) - 0.22;
      d = min(d, sd);
    }
    return d;
  }

  float kingdomSdf(int id, vec3 p) {
    if (id == 0) return sdfGyroid(p);
    if (id == 1) return sdfTuring(p);
    if (id == 2) return sdfWgm(p);
    if (id == 3) return sdfCtenophore(p);
    return sdfSlime(p);
  }

  float sceneSdf(vec3 p) {
    if (uShowOnlyA == 1) return kingdomSdf(uParentA, p);
    if (uShowOnlyB == 1) return kingdomSdf(uParentB, p);
    float a = kingdomSdf(uParentA, p);
    float b = kingdomSdf(uParentB, p);
    return smin(a, b, uK);
  }

  vec3 sceneNormal(vec3 p) {
    vec2 e = vec2(EPS, 0.0);
    return normalize(vec3(
      sceneSdf(p + e.xyy) - sceneSdf(p - e.xyy),
      sceneSdf(p + e.yxy) - sceneSdf(p - e.yxy),
      sceneSdf(p + e.yyx) - sceneSdf(p - e.yyx)
    ));
  }

  float rayMarch(vec3 ro, vec3 rd) {
    float t = 0.0;
    for (int i = 0; i < MAX_STEPS; i++) {
      vec3  p = ro + rd * t;
      float d = sceneSdf(p);
      if (d < MIN_DIST) return t;
      if (t > MAX_DIST) break;
      t += max(d, MIN_DIST * 0.5);
    }
    return -1.0;
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy / uResolution) * 2.0 - 1.0;
    uv.x *= uResolution.x / uResolution.y;

    vec3 ro = vec3(0.0, 0.0, 3.0);
    vec3 rd = normalize(vec3(uv, -1.6));

    float t = rayMarch(ro, rd);

    vec3 col;
    if (t < 0.0) {
      // soft vignette background — matches site warm-black palette
      float v = smoothstep(1.6, 0.2, length(uv));
      col = mix(vec3(0.04, 0.035, 0.05), vec3(0.10, 0.09, 0.11), v);
    } else {
      vec3 p = ro + rd * t;
      vec3 n = sceneNormal(p);
      vec3 lightDir = normalize(vec3(0.6, 0.8, 0.4));
      float diff = clamp(dot(n, lightDir), 0.0, 1.0);
      float amb  = 0.18;
      vec3  base = 0.5 + 0.5 * n; // normal-tinted base
      base = mix(base, vec3(0.95, 0.78, 0.85), 0.35); // warm chrome tint
      col = base * (amb + diff * 0.9);
      // soft fog by depth
      col = mix(col, vec3(0.06, 0.05, 0.07), clamp(t / 6.0, 0.0, 0.85));
    }

    gl_FragColor = vec4(pow(col, vec3(0.95)), 1.0);
  }
`;

export type KingdomId = 0 | 1 | 2 | 3 | 4;

export const KINGDOMS: { id: KingdomId; key: string; label: string }[] = [
  { id: 0, key: "gyroid", label: "gyroid" },
  { id: 1, key: "turing", label: "turing" },
  { id: 2, key: "wgm", label: "wgm" },
  { id: 3, key: "ctenophore", label: "ctenophore" },
  { id: 4, key: "slime", label: "slime" },
];
