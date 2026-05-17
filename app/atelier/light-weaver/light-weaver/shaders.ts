/**
 * app/atelier/light-weaver/light-weaver/shaders.ts — Shared vertex
 * shader + six trail fragment shaders + the SHADER_LIBRARY registry.
 *
 * Extracted from light-weaver-client.tsx per ARCHITECTURE.md Rule 1.
 * Lifted from apps/Light_Weiver/src/input/TrailShaders.ts. Each
 * fragment shader reads vAge (0 at the head, 1 at the tail), vUv,
 * uTime, uIntensity, uSpeed.
 */

import type { ShaderKey } from "./types";

export const TRAIL_VERT = /* glsl */ `
  varying vec2 vUv;
  varying float vAge;
  varying float vSpeed;
  attribute float age;
  void main() {
    vUv = uv;
    vAge = age;
    vSpeed = uv.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FLAME_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uIntensity;
  varying vec2 vUv;
  varying float vAge;
  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float twist = sin(vUv.y * 8.0 + uTime * 3.5) * 0.4 * uSpeed;
    float d = abs(uv.x - twist);
    float core = 1.0 - smoothstep(0.0, 0.25, d);
    float outer = 1.0 - smoothstep(0.2, 0.7, d);
    float alpha = (1.0 - vAge) * outer;
    if (alpha < 0.01) discard;
    vec3 hot = vec3(1.0, 0.95, 0.7);
    vec3 mid = vec3(1.0, 0.4, 0.0);
    vec3 cool = vec3(0.6, 0.05, 0.0);
    vec3 col = mix(cool, mix(mid, hot, core), (1.0 - vAge));
    col = mix(col * 0.5, col, uSpeed);
    col += vec3(0.2, 0.1, 0.0) * uIntensity;
    gl_FragColor = vec4(col, alpha * 0.92);
  }
`;

const PLASMA_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;
  varying float vAge;
  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float p = sin(uv.x * 10.0 + uTime * 4.0)
            + sin(uv.y * 8.0 - uTime * 3.0)
            + sin((uv.x + uv.y) * 12.0 + uTime * 5.0)
            + sin(length(uv) * 14.0 - uTime * 6.0);
    p = p * 0.25 + 0.5;
    float alpha = (1.0 - vAge) * (1.0 - smoothstep(0.4, 0.9, length(uv)));
    if (alpha < 0.01) discard;
    vec3 col = mix(vec3(0.0, 0.8, 1.0), vec3(1.0, 0.2, 0.9), p);
    col = mix(col, vec3(1.0), pow(p, 4.0) * uIntensity);
    gl_FragColor = vec4(col, alpha * 0.92);
  }
`;

const AURORA_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;
  varying float vAge;
  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float b1 = sin(uv.y * 4.0 + uTime * 0.8 + uv.x * 2.0) * 0.5 + 0.5;
    float b2 = sin(uv.y * 7.0 - uTime * 0.5 + uv.x * 3.0) * 0.5 + 0.5;
    float b3 = sin(uv.y * 2.5 + uTime * 1.2) * 0.5 + 0.5;
    float curtain = (b1 * 0.5 + b2 * 0.3 + b3 * 0.2);
    float mask = 1.0 - smoothstep(0.3, 1.0, abs(uv.x));
    float alpha = (1.0 - vAge) * curtain * mask * 0.85;
    if (alpha < 0.01) discard;
    vec3 green = vec3(0.1, 1.0, 0.5);
    vec3 cyan = vec3(0.0, 0.9, 1.0);
    vec3 violet = vec3(0.7, 0.1, 1.0);
    vec3 col = mix(green, cyan, b1);
    col = mix(col, violet, uIntensity);
    col += vec3(0.0, 0.3, 0.2) * b3;
    gl_FragColor = vec4(col, alpha);
  }
`;

const MYCELIUM_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;
  varying float vAge;
  float hash(float n) { return fract(sin(n) * 43758.5453); }
  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float filament = 1.0 - smoothstep(0.0, 0.08, abs(uv.x + sin(vUv.y * 20.0 + uTime) * 0.1));
    float web = 0.0;
    for (int i = 0; i < 5; i++) {
      float fi = float(i);
      float angle = fi * 1.257 + uTime * 0.1;
      float d = abs(uv.x * cos(angle) + uv.y * sin(angle));
      web += (1.0 - smoothstep(0.0, 0.04, d)) * 0.15 * hash(fi * 3.3 + uTime * 0.2);
    }
    float pattern = clamp(filament + web, 0.0, 1.0);
    float alpha = pow(1.0 - vAge, 0.7) * pattern;
    if (alpha < 0.01) discard;
    vec3 col = mix(vec3(0.85, 0.82, 0.7), vec3(0.7, 0.5, 0.9), web / (web + 0.01));
    col += vec3(0.3, 0.1, 0.5) * uIntensity * pattern;
    gl_FragColor = vec4(col, alpha * 0.82);
  }
`;

const INK_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;
  varying float vAge;
  float inkBleed(vec2 uv, float age) {
    float d = length(uv);
    float spread = 0.2 + age * 0.6;
    return max((1.0 - smoothstep(spread - 0.15, spread, d)) * 0.4,
               1.0 - smoothstep(0.0, spread * 0.4, d));
  }
  void main() {
    float alpha = pow(1.0 - vAge, 0.6) * 0.95;
    if (alpha < 0.01) discard;
    vec2 uv = vUv * 2.0 - 1.0;
    float bleed = inkBleed(uv, vAge);
    float tex = sin(uv.x * 40.0 + sin(uv.y * 20.0) * 2.0) * 0.1 + 0.9;
    vec3 col = mix(vec3(0.04, 0.03, 0.06), vec3(0.15, 0.05, 0.35), (1.0 - bleed) * 0.6);
    col += vec3(0.3, 0.1, 0.5) * pow(bleed, 3.0) * uIntensity * 0.5;
    gl_FragColor = vec4(col, alpha * bleed * tex);
  }
`;

const NEON_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;
  varying float vAge;
  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float d = abs(uv.x);
    float tube = 1.0 - smoothstep(0.04, 0.18, d);
    float glow = (1.0 - smoothstep(0.0, 0.6, d)) * 0.4;
    float alpha = (1.0 - vAge) * (tube + glow);
    if (alpha < 0.01) discard;
    vec3 cyan = vec3(0.0, 1.0, 0.9);
    vec3 magenta = vec3(1.0, 0.1, 0.9);
    vec3 col = mix(cyan, magenta, uIntensity);
    col = mix(col, vec3(1.0, 1.0, 1.0), tube * 0.6);
    gl_FragColor = vec4(col, alpha * 0.88);
  }
`;

export const SHADER_LIBRARY: Record<ShaderKey, { label: string; frag: string }> = {
  flame: { label: "Flame ribbon", frag: FLAME_FRAG },
  plasma: { label: "Plasma", frag: PLASMA_FRAG },
  aurora: { label: "Aurora", frag: AURORA_FRAG },
  mycelium: { label: "Mycelium", frag: MYCELIUM_FRAG },
  ink: { label: "Ink bleed", frag: INK_FRAG },
  neon: { label: "Neon tube", frag: NEON_FRAG },
};
