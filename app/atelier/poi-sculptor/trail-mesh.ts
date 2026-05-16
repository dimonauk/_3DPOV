/**
 * app/atelier/poi-sculptor/trail-mesh.ts
 *
 * Two responsibilities:
 *   1. buildTube — extrude a Catmull-Rom-like tube along an arbitrary
 *      polyline of trail points. Returns an indexed BufferGeometry with
 *      position, normal, uv.
 *   2. buildTrailMaterial — TSL MeshStandardNodeMaterial whose emissive
 *      output is driven by fractal noise (heat), rim brightness, and a
 *      slow pulse. The base material values come from the move's chosen
 *      surface palette entry.
 *
 * Loaded dynamically by scene.ts; safe to top-level import three/tsl.
 */

import * as THREE from "three/webgpu";
import {
  abs,
  color,
  mx_fractal_noise_float,
  normalWorld,
  positionWorld,
  sin,
  time,
  uniform,
  uv,
  vec3,
} from "three/tsl";

import type { TrailMaterial } from "lib/poi-sculptor/materials";
import type { TrailPoint } from "lib/poi-sculptor/moves";

export type TrailUniforms = {
  uHeat: ReturnType<typeof uniform>;
  uRim: ReturnType<typeof uniform>;
  uPulse: ReturnType<typeof uniform>;
  uThick: ReturnType<typeof uniform>;
};

export function makeTrailUniforms(): TrailUniforms {
  return {
    uHeat: uniform(0.75),
    uRim: uniform(0.8),
    uPulse: uniform(0.55),
    uThick: uniform(1.0),
  };
}

export function buildTube(
  pts: TrailPoint[],
  radius = 0.038,
  segs = 12,
): THREE.BufferGeometry | null {
  const n = pts.length;
  if (n < 2) return null;
  const pos: number[] = [];
  const nrm: number[] = [];
  const uvA: number[] = [];
  const idx: number[] = [];

  const tgts = pts.map((_, i) => {
    const a = pts[Math.max(0, i - 1)]!;
    const b = pts[Math.min(n - 1, i + 1)]!;
    return new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
  });

  const TAU = Math.PI * 2;
  const S = Math.sin;
  const C = Math.cos;

  for (let i = 0; i < n; i++) {
    const p = new THREE.Vector3(...pts[i]!);
    const t = tgts[i]!;
    const up = new THREE.Vector3(0, 1, 0);
    if (Math.abs(t.dot(up)) > 0.9) up.set(1, 0, 0);
    const r = new THREE.Vector3().crossVectors(t, up).normalize();
    const nm = new THREE.Vector3().crossVectors(r, t).normalize();
    for (let s = 0; s <= segs; s++) {
      const a = (s / segs) * TAU;
      const nx = C(a) * r.x + S(a) * nm.x;
      const ny = C(a) * r.y + S(a) * nm.y;
      const nz = C(a) * r.z + S(a) * nm.z;
      pos.push(p.x + nx * radius, p.y + ny * radius, p.z + nz * radius);
      nrm.push(nx, ny, nz);
      uvA.push(s / segs, i / (n - 1));
    }
  }

  const vpr = segs + 1;
  for (let i = 0; i < n - 1; i++) {
    for (let s = 0; s < segs; s++) {
      const a = i * vpr + s;
      const b = a + 1;
      const c = (i + 1) * vpr + s;
      const d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvA, 2));
  g.setIndex(idx);
  return g;
}

export function buildTrailMaterial(
  matDef: TrailMaterial,
  u: TrailUniforms,
): THREE.MeshStandardNodeMaterial {
  const mat = new THREE.MeshStandardNodeMaterial();
  mat.roughness = matDef.rough;
  mat.metalness = matDef.metal;
  mat.color = new THREE.Color(matDef.base);
  mat.emissive = new THREE.Color(matDef.emissive);
  mat.side = THREE.DoubleSide;

  const wp = positionWorld.mul(2.8).add(vec3(0, time.mul(0.5), 0));
  const heat = mx_fractal_noise_float(wp, 3, 2, 0.5)
    .mul(u.uHeat)
    .clamp(0.1, 1.2);
  const rimDot = abs(normalWorld.dot(vec3(0, 0, 1))).oneMinus().pow(2.8);
  const rimGlow = rimDot.mul(u.uRim);
  const pulse = sin(uv().y.mul(6.28).add(time.mul(2)))
    .mul(0.5)
    .add(0.5)
    .mul(u.uPulse.mul(0.4));
  const emC = color(matDef.emissive);
  mat.emissiveNode = emC.mul(heat.add(rimGlow).add(pulse).mul(2.2));
  return mat;
}

export type TrailMeshes = {
  group: THREE.Group;
  meshes: THREE.Mesh[];
  vertexCount: number;
  mid0: [number, number, number];
  mid1: [number, number, number];
};

export function buildTrailGroup(
  h0: TrailPoint[],
  h1: TrailPoint[],
  matDef: TrailMaterial,
  uniforms: TrailUniforms,
): TrailMeshes {
  const thick = (uniforms.uThick.value as number) ?? 1.0;
  const g0 = buildTube(h0, 0.038 * thick);
  const g1 = buildTube(h1, 0.028 * thick);

  const emDimmed = new THREE.Color(matDef.emissive).multiplyScalar(0.6).getHex();
  const m0 = buildTrailMaterial(matDef, uniforms);
  const m1 = buildTrailMaterial({ ...matDef, emissive: emDimmed }, uniforms);

  const group = new THREE.Group();
  const meshes: THREE.Mesh[] = [];
  if (g0) {
    const mesh = new THREE.Mesh(g0, m0);
    meshes.push(mesh);
    group.add(mesh);
  }
  if (g1) {
    const mesh = new THREE.Mesh(g1, m1);
    meshes.push(mesh);
    group.add(mesh);
  }

  const v0 = g0?.attributes.position?.count ?? 0;
  const v1 = g1?.attributes.position?.count ?? 0;

  const midPt0 = h0[Math.floor(h0.length / 2)] ?? [0, 0, 0];
  const midPt1 = h1[Math.floor(h1.length / 2)] ?? [0, 0, 0];

  return {
    group,
    meshes,
    vertexCount: v0 + v1,
    mid0: midPt0,
    mid1: midPt1,
  };
}
