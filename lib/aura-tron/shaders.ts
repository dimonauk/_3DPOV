/**
 * lib/aura-tron/shaders.ts
 *
 * GLSL shaders for the AuraTron landscape — face, wireframe, and orbit
 * particles. Lifted from
 * `D:\The_Hangar\Dolly_OS\src\components\void\aura-tron-landscape\shaders.ts`
 * with one addition: the WIRE_VERT shader now mixes the baked-in
 * LILAC/BLUSH/MINT band colour with a `uTint` uniform supplied by the React
 * component, so the whole grid can take a mood-coloured wash without the
 * geometry being rebuilt.
 *
 * All wave/height computation stays on the GPU. CPU cost is one float-uniform
 * write per frame (uTime), plus uTint when the mood prop changes.
 */
import { COLS, ROWS, GW, Z_EXTENT, Y_BASE, Y_SCALE, FADE_FRAC } from "./terrain";

// ── Vertex shader: replicates hAt() + fade() + sink in GLSL ─────────────────
export const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uSlowT;
  varying float vAlpha;
  varying vec3  vColor;

  float depthFromCamera(float zi) {
    float zWorld = -${Z_EXTENT.toFixed(1)} + (zi / ${ROWS.toFixed(1)}) * ${(Z_EXTENT * 2).toFixed(1)};
    return abs(zWorld) / ${Z_EXTENT.toFixed(1)};
  }

  float fadeFn(float zi) {
    float d = depthFromCamera(zi);
    float ff = ${FADE_FRAC.toFixed(2)};
    return d <= ff ? 1.0 : max(0.0, 1.0 - (d - ff) / (1.0 - ff));
  }

  float hAt(float xi, float zi, float slowT) {
    float xn = xi / ${COLS.toFixed(1)};
    float dn = depthFromCamera(zi);
    float meander = sin(dn * 3.0 + slowT * 0.2) * 0.12
                  + sin(dn * 1.2 + slowT * 0.08 + 1.8) * 0.08;
    float dc = abs(xn - 0.5 + meander) * 2.0;
    float r1 = 0.22 * sin(xi * 0.18 + zi * 0.20 + slowT * 0.35 + 1.3);
    float r2 = 0.10 * sin(xi * 0.42 - zi * 0.32 + slowT * 0.18 + 7.2);
    float r3 = 0.04 * sin(xi * 0.80 + zi * 0.65 + slowT * 0.12 + 3.1);
    float h = -0.6 + 1.2 * dc * dc + (r1 + r2 + r3) * (0.3 + 0.7 * dc);
    float farFactor = pow(max(0.0, 1.0 - dn * 1.15), 2.5);
    float mtnRaw = 0.40 * sin(xi * 0.06 + slowT * 0.04)
                 + 0.25 * sin(xi * 0.12 + slowT * 0.025 + 130.0)
                 + 0.15 * sin(xi * 0.28 + slowT * 0.03  + 70.0);
    h += max(0.0, mtnRaw) * farFactor * (1.8 + 1.2 * dc);
    return h;
  }

  void main() {
    float xi = position.x;
    float zi = position.z;
    float f    = fadeFn(zi);
    float sink = f < 1.0 ? (1.0 - f) * 8.0 : 0.0;
    float xn   = xi / ${COLS.toFixed(1)};
    float xWorld = (xn - 0.5) * ${GW.toFixed(1)};
    float zWorld = -${Z_EXTENT.toFixed(1)} + (zi / ${ROWS.toFixed(1)}) * ${(Z_EXTENT * 2).toFixed(1)};
    float yWorld = ${Y_BASE.toFixed(1)} + hAt(xi, zi, uSlowT) * ${Y_SCALE.toFixed(1)} - sink;
    vAlpha = f;
    vColor = vec3(0.02, 0.01, 0.048);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(xWorld, yWorld, zWorld, 1.0);
  }
`;

export const FRAG = /* glsl */ `
  varying float vAlpha;
  varying vec3  vColor;
  void main() {
    gl_FragColor = vec4(vColor, vAlpha * 0.92);
  }
`;

// Wire vertex shader — adds a uTint uniform so the wires can take a mood wash
export const WIRE_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uSlowT;
  uniform vec3  uTint;
  uniform float uTintAmount;
  attribute vec3 aColor;
  attribute float aSeed;
  attribute float aT;
  varying vec4 vCol;

  float depthFromCamera(float zi) {
    float zWorld = -${Z_EXTENT.toFixed(1)} + (zi / ${ROWS.toFixed(1)}) * ${(Z_EXTENT * 2).toFixed(1)};
    return abs(zWorld) / ${Z_EXTENT.toFixed(1)};
  }
  float fadeFn(float zi) {
    float d = depthFromCamera(zi);
    float ff = ${FADE_FRAC.toFixed(2)};
    return d <= ff ? 1.0 : max(0.0, 1.0 - (d - ff) / (1.0 - ff));
  }
  float hAt(float xi, float zi, float slowT) {
    float xn = xi / ${COLS.toFixed(1)};
    float dn = depthFromCamera(zi);
    float meander = sin(dn * 3.0 + slowT * 0.2) * 0.12
                  + sin(dn * 1.2 + slowT * 0.08 + 1.8) * 0.08;
    float dc = abs(xn - 0.5 + meander) * 2.0;
    float r1 = 0.22 * sin(xi * 0.18 + zi * 0.20 + slowT * 0.35 + 1.3);
    float r2 = 0.10 * sin(xi * 0.42 - zi * 0.32 + slowT * 0.18 + 7.2);
    float r3 = 0.04 * sin(xi * 0.80 + zi * 0.65 + slowT * 0.12 + 3.1);
    float h = -0.6 + 1.2 * dc * dc + (r1 + r2 + r3) * (0.3 + 0.7 * dc);
    float farFactor = pow(max(0.0, 1.0 - dn * 1.15), 2.5);
    float mtnRaw = 0.40 * sin(xi * 0.06 + slowT * 0.04)
                 + 0.25 * sin(xi * 0.12 + slowT * 0.025 + 130.0)
                 + 0.15 * sin(xi * 0.28 + slowT * 0.03  + 70.0);
    h += max(0.0, mtnRaw) * farFactor * (1.8 + 1.2 * dc);
    return h;
  }

  void main() {
    float xi = position.x;
    float zi = position.z;
    float f    = fadeFn(zi);
    float sink = f < 1.0 ? (1.0 - f) * 8.0 : 0.0;
    float xWorld = (xi / ${COLS.toFixed(1)} - 0.5) * ${GW.toFixed(1)};
    float zWorld = -${Z_EXTENT.toFixed(1)} + (zi / ${ROWS.toFixed(1)}) * ${(Z_EXTENT * 2).toFixed(1)};
    float yWorld = ${Y_BASE.toFixed(1)} + hAt(xi, zi, uSlowT) * ${Y_SCALE.toFixed(1)} - sink;

    float speed    = 0.3 + aSeed * 1.8;
    float phase    = aSeed * 6.28318;
    float pulsePos = fract(uTime * speed + phase);
    float d     = aT - pulsePos;
    float pulse = exp(-d * d * 120.0);
    float pulse2 = 0.0;
    if (aSeed > 0.6) {
      float d2 = aT - fract(uTime * speed * 0.5 + phase + 0.35);
      pulse2 = exp(-d2 * d2 * 80.0) * 0.5;
    }
    float totalPulse = clamp(pulse + pulse2, 0.0, 1.0);

    vec3 baseCol  = mix(aColor, uTint, clamp(uTintAmount, 0.0, 1.0));
    vec3 pulseCol = vec3(0.85, 0.95, 1.0);
    vec3 col = mix(baseCol, pulseCol, totalPulse);

    bool isMaj = mod(xi, 5.0) < 0.5 || mod(zi, 4.0) < 0.5;
    float baseA = isMaj ? 0.85 : 0.50;
    float a = (baseA + totalPulse * 0.5) * f;
    vCol = vec4(col * a, a);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(xWorld, yWorld, zWorld, 1.0);
  }
`;

export const WIRE_FRAG = /* glsl */ `
  varying vec4 vCol;
  void main() { gl_FragColor = vCol; }
`;

export const PARTICLE_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uSlowT;
  uniform vec3  uTint;
  uniform float uTintAmount;
  attribute vec2 aWireStart;
  attribute vec2 aWireEnd;
  attribute float aSpeed;
  attribute float aSeed;
  varying float vBrightness;
  varying vec3  vColor;

  float depthFromCamera(float zi) {
    float zWorld = -120.0 + (zi / 64.0) * 240.0;
    return abs(zWorld) / 120.0;
  }
  float fadeFn(float zi) {
    float d = depthFromCamera(zi);
    return d <= 0.55 ? 1.0 : max(0.0, 1.0 - (d - 0.55) / 0.45);
  }
  float hAt(float xi, float zi, float slowT) {
    float xn = xi / 48.0;
    float dn = depthFromCamera(zi);
    float meander = sin(dn*3.0+slowT*0.2)*0.12 + sin(dn*1.2+slowT*0.08+1.8)*0.08;
    float dc = abs(xn - 0.5 + meander) * 2.0;
    float r1 = 0.22*sin(xi*0.18+zi*0.20+slowT*0.35+1.3);
    float r2 = 0.10*sin(xi*0.42-zi*0.32+slowT*0.18+7.2);
    float r3 = 0.04*sin(xi*0.80+zi*0.65+slowT*0.12+3.1);
    float h = -0.6 + 1.2*dc*dc + (r1+r2+r3)*(0.3+0.7*dc);
    float ff = pow(max(0.0, 1.0-dn*1.15), 2.5);
    float mtn = 0.40*sin(xi*0.06+slowT*0.04) + 0.25*sin(xi*0.12+slowT*0.025+130.0) + 0.15*sin(xi*0.28+slowT*0.03+70.0);
    h += max(0.0, mtn)*ff*(1.8+1.2*dc);
    return h;
  }
  void main() {
    float t = fract(uTime * aSpeed + aSeed);
    float xi = mix(aWireStart.x, aWireEnd.x, t);
    float zi = mix(aWireStart.y, aWireEnd.y, t);
    float f = fadeFn(zi);
    float sink = f < 1.0 ? (1.0 - f) * 8.0 : 0.0;
    float xWorld = (xi / 48.0 - 0.5) * 240.0;
    float zWorld = -120.0 + (zi / 64.0) * 240.0;
    float yWorld = -4.0 + hAt(xi, zi, uSlowT) * 3.5 - sink + 0.08;
    vBrightness = f;
    vColor = mix(vec3(0.5, 0.85, 1.0), uTint, clamp(uTintAmount, 0.0, 1.0));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(xWorld, yWorld, zWorld, 1.0);
    gl_PointSize = 4.0 + aSeed * 4.0;
  }
`;

export const PARTICLE_FRAG = /* glsl */ `
  varying float vBrightness;
  varying vec3  vColor;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    if (dist > 0.5) discard;
    float glow = pow(1.0 - smoothstep(0.0, 0.5, dist), 1.8);
    vec3 col = mix(vColor, vec3(1.0, 1.0, 1.0), glow);
    gl_FragColor = vec4(col, glow * vBrightness * 0.95);
  }
`;
