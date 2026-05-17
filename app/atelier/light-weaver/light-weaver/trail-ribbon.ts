/**
 * app/atelier/light-weaver/light-weaver/trail-ribbon.ts — Camera-
 * facing quad-strip ribbon that follows the trail head. Per-vertex
 * `age` attribute drives shader fade; positions are extruded each
 * frame perpendicular to the camera right vector so the ribbon
 * always faces the viewer.
 *
 * Also exports buildTipGeometry — the four head-shape variants.
 *
 * Extracted from light-weaver-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import * as THREE from "three";

import type { TipKey } from "./types";

export const TRAIL_SEGMENTS = 64;

export class TrailRibbon {
  readonly geometry: THREE.BufferGeometry;
  readonly mesh: THREE.Mesh;
  private positions: Float32Array;
  private uvs: Float32Array;
  private ages: Float32Array;
  private indices: Uint16Array;
  private points: THREE.Vector3[] = [];
  private baseWidth = 0.04;

  constructor(material: THREE.ShaderMaterial) {
    const N = TRAIL_SEGMENTS;
    const V = N * 2;
    const F = (N - 1) * 2;
    this.positions = new Float32Array(V * 3);
    this.uvs = new Float32Array(V * 2);
    this.ages = new Float32Array(V);
    this.indices = new Uint16Array(F * 3);
    for (let i = 0; i < N - 1; i++) {
      const a = i * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      const base = i * 6;
      this.indices[base + 0] = a;
      this.indices[base + 1] = b;
      this.indices[base + 2] = c;
      this.indices[base + 3] = b;
      this.indices[base + 4] = d;
      this.indices[base + 5] = c;
    }
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.positions, 3),
    );
    this.geometry.setAttribute("uv", new THREE.BufferAttribute(this.uvs, 2));
    this.geometry.setAttribute("age", new THREE.BufferAttribute(this.ages, 1));
    this.geometry.setIndex(new THREE.BufferAttribute(this.indices, 1));
    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.frustumCulled = false;
  }

  setBaseWidth(w: number): void {
    this.baseWidth = w;
  }

  clear(): void {
    this.points = [];
    this.ages.fill(1);
    // age attribute is added in the constructor; always present.
    this.geometry.attributes.age!.needsUpdate = true;
  }

  update(headPos: THREE.Vector3, speed: number, camera: THREE.Camera): void {
    this.points.push(headPos.clone());
    if (this.points.length > TRAIL_SEGMENTS) this.points.shift();
    const N = this.points.length;
    if (N < 2) return;

    const camRight = new THREE.Vector3();
    camRight.setFromMatrixColumn(camera.matrixWorld, 0);
    const width = this.baseWidth + speed * 0.12;

    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const age = 1 - t;
      const w = width * t;
      const p = this.points[i]!;
      const left = p.clone().addScaledVector(camRight, -w);
      const right = p.clone().addScaledVector(camRight, w);
      const vi = i * 2;
      this.positions[vi * 3 + 0] = left.x;
      this.positions[vi * 3 + 1] = left.y;
      this.positions[vi * 3 + 2] = left.z;
      this.uvs[vi * 2 + 0] = 0;
      this.uvs[vi * 2 + 1] = t;
      this.ages[vi] = age;
      this.positions[(vi + 1) * 3 + 0] = right.x;
      this.positions[(vi + 1) * 3 + 1] = right.y;
      this.positions[(vi + 1) * 3 + 2] = right.z;
      this.uvs[(vi + 1) * 2 + 0] = 1;
      this.uvs[(vi + 1) * 2 + 1] = t;
      this.ages[vi + 1] = age;
    }

    for (let i = N; i < TRAIL_SEGMENTS; i++) {
      const vi = i * 2;
      const last = this.points[N - 1]!;
      for (let k = 0; k < 2; k++) {
        this.positions[(vi + k) * 3 + 0] = last.x;
        this.positions[(vi + k) * 3 + 1] = last.y;
        this.positions[(vi + k) * 3 + 2] = last.z;
        this.ages[vi + k] = 1;
      }
    }

    // position / uv / age attributes are all added in the constructor.
    this.geometry.attributes.position!.needsUpdate = true;
    this.geometry.attributes.uv!.needsUpdate = true;
    this.geometry.attributes.age!.needsUpdate = true;
  }

  tick(time: number, resonance: number, speed: number): void {
    const mat = this.mesh.material as THREE.ShaderMaterial;
    mat.uniforms.uTime!.value = time;
    mat.uniforms.uIntensity!.value = resonance;
    mat.uniforms.uSpeed!.value = speed;
  }

  dispose(): void {
    this.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

export function buildTipGeometry(tip: TipKey): THREE.BufferGeometry {
  switch (tip) {
    case "crystal": {
      const g = new THREE.OctahedronGeometry(0.16, 0);
      g.scale(0.7, 1.6, 0.7);
      return g;
    }
    case "torus":
      return new THREE.TorusGeometry(0.13, 0.055, 8, 20);
    case "icosahedron":
      return new THREE.IcosahedronGeometry(0.16, 1);
    default:
      return new THREE.SphereGeometry(0.14, 16, 12);
  }
}
