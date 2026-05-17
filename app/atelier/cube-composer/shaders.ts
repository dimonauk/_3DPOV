/**
 * app/atelier/cube-composer/shaders.ts — Equirect → cube-face projection
 * shader pair for the cube-composer chamber.
 *
 * Each face plane samples an equirectangular texture by reconstructing
 * a unit world-space direction from the face's local UVs.
 *
 * Convention nailed down (subtle gotchas — same notes as the original
 * inline version):
 *  - We render the planes with `side: BackSide` so the visitor inside
 *    the cube sees them. The vertex shader runs in the plane's local
 *    space — UV (0..1) maps to (-1..+1) on the face. We pass per-face
 *    basis vectors so the same shader covers all six faces.
 *  - World ray dir = right * u + up * v + forward  (then normalised).
 *  - Equirect mapping uses the OpenGL/three convention: longitude
 *    runs around +X-forward / -Z by convention, latitude is asin(y).
 *    We use atan2(dir.z, dir.x) for longitude so a panorama whose
 *    centre column is "front" sits at -Z (which is what three's
 *    default camera looks at, and what our `front` face occupies).
 *    The +0.5 offset rotates the seam to the back face — equirects
 *    conventionally put the seam at lon = ±π, which is exactly behind.
 *  - We flip latitude because the texture's +V is "down" in image
 *    space but we want "up" in world space.
 */

export const FACE_VERT_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const FACE_FRAG_SHADER = /* glsl */ `
  precision highp float;

  uniform sampler2D uEquirect;
  uniform vec3 uRight;
  uniform vec3 uUp;
  uniform vec3 uForward;
  uniform float uTint;
  uniform vec3 uTintColor;
  uniform float uOpacity;

  varying vec2 vUv;

  void main() {
    // UV 0..1 → -1..+1 on the face plane.
    vec2 s = vUv * 2.0 - 1.0;
    vec3 dir = normalize(uRight * s.x + uUp * s.y + uForward);

    // Equirect sampling. lon ∈ [-π, π], lat ∈ [-π/2, π/2].
    float lon = atan(dir.z, dir.x);
    float lat = asin(clamp(dir.y, -1.0, 1.0));

    // Map to UV. +0.5 places the seam at the back face. The 0.25
    // rotation aligns the panorama centre with -Z (our front face).
    vec2 uv = vec2(
      0.5 + lon / (2.0 * 3.14159265359) + 0.25,
      0.5 - lat / 3.14159265359
    );
    // Wrap longitude (texture wraps in U).
    uv.x = fract(uv.x);

    vec4 col = texture2D(uEquirect, uv);
    // Optional tint mixes the autoregressive face colour in slightly
    // when this face is "active", so the operator can still read the
    // ordering even after the panorama lands.
    vec3 rgb = mix(col.rgb, col.rgb * uTintColor, uTint);
    gl_FragColor = vec4(rgb, col.a * uOpacity);
  }
`;
