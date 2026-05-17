/**
 * lib/math/glsl/sdf.ts — Signed-distance primitives + domain
 * manipulators + the Mandelbulb fractal SDF.
 *
 * Lifted from Shadrerapp glsl-utils.ts (Apache-2.0) per
 * docs/SHADRERAPP_MIGRATION.md.
 */

export const SDF = `
  float sdSphere(vec3 p, float s) {
      return length(p) - s;
  }
  float sdBox(vec3 p, vec3 b) {
      vec3 q = abs(p) - b;
      return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
  }
  float sdTorus(vec3 p, vec2 t) {
      vec2 q = vec2(length(p.xz) - t.x, p.y);
      return length(q) - t.y;
  }
  float sdOctahedron(vec3 p, float s) {
      p = abs(p);
      return (p.x + p.y + p.z - s) * 0.57735027;
  }
  float sdCylinder(vec3 p, vec2 h) {
      vec2 d = abs(vec2(length(p.xz), p.y)) - h;
      return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
  }
  float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
      vec3 pa = p - a, ba = b - a;
      float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
      return length(pa - ba * h) - r;
  }

  // --- DOMAIN MANIPULATORS ---
  vec2 rotate(vec2 p, float a) {
      float s = sin(a), c = cos(a);
      return p * mat2(c, s, -s, c);
  }
  vec3 opRepeat(vec3 p, vec3 c) {
      return mod(p + 0.5 * c, c) - 0.5 * c;
  }
  vec2 opRepeat(vec2 p, vec2 c) {
      return mod(p + 0.5 * c, c) - 0.5 * c;
  }
  vec3 opMirror(vec3 p, vec3 c) {
      return abs(p) - c;
  }
  vec3 opTwist(vec3 p, float k) {
      float c = cos(k * p.y);
      float s = sin(k * p.y);
      mat2  m = mat2(c, -s, s, c);
      return vec3(m * p.xz, p.y);
  }
  vec3 opCheapBend(vec3 p, float k) {
      float c = cos(k * p.x);
      float s = sin(k * p.x);
      mat2  m = mat2(c, -s, s, c);
      return vec3(m * p.xy, p.z);
  }

  float smin(float a, float b, float k) {
      float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
      return mix(b, a, h) - k * h * (1.0 - h);
  }

  // --- FRACTAL SDFs ---
  float sdMandelbulb(vec3 p, float power) {
      vec3 z = p;
      float dr = 1.0;
      float r = 0.0;
      for (int i = 0; i < 10; i++) {
          r = length(z);
          if (r > 2.0) break;

          // convert to polar coordinates
          float theta = acos(z.z / r);
          float phi = atan(z.y, z.x);
          dr = pow(r, power - 1.0) * power * dr + 1.0;

          // scale and rotate the point
          float zr = pow(r, power);
          theta = theta * power;
          phi = phi * power;

          // convert back to cartesian coordinates
          z = zr * vec3(sin(theta) * cos(phi), sin(phi) * sin(theta), cos(theta));
          z += p;
      }
      return 0.5 * log(r) * r / dr;
  }
`;
