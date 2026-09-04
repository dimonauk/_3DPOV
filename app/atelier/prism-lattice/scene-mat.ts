/**
 * app/atelier/prism-lattice/scene-mat.ts
 *
 * TSL materials + InstancedMesh builders for the lattice. Every strut
 * and joint is unlit and GPU-driven: the growth pulse, the radius
 * pulse, and the spectrum hue are all computed per-instance in the
 * vertex/fragment graph from a handful of instanced attributes plus a
 * shared time uniform. No per-frame JS work, no `setMatrixAt` — the
 * whole animation lives on the GPU. Additive blending + no depth
 * write means far-side struts show through the near side, which is
 * the "you can see the inner layers" read the reference has.
 *
 * Loaded dynamically by scene.ts; safe to top-level import
 * `three/webgpu` + `three/tsl` here.
 */

import * as THREE from "three/webgpu";
import {
  abs,
  Fn,
  float,
  fract,
  instancedBufferAttribute,
  mix,
  positionLocal,
  saturate,
  sin,
  uniform,
  vec3,
} from "three/tsl";

import type { LatticeInstanceData } from "./scene-geometry";

export type TimeUniform = ReturnType<typeof uniform>;

export type LatticeUniforms = {
  uTime: TimeUniform;
  /** How fast the spectrum sweeps across the lattice. */
  uHueSpeed: TimeUniform;
  /** How fast each strut breathes through its growth cycle. */
  uPulseSpeed: TimeUniform;
  /** 0 = struts hold their rest length, 1 = full grow/shrink swing. */
  uPulseDepth: TimeUniform;
  /** Overall emissive brightness multiplier. */
  uBrightness: TimeUniform;
};

export function makeLatticeUniforms(): LatticeUniforms {
  return {
    uTime: uniform(0),
    uHueSpeed: uniform(0.06),
    uPulseSpeed: uniform(0.6),
    uPulseDepth: uniform(0.75),
    uBrightness: uniform(1.0),
  };
}

const TAU = Math.PI * 2;

/** Pure-spectrum rainbow ramp (S = V = 1) — cheap, no palette lookup. */
const hueSpectrum = Fn(([h]: [ReturnType<typeof float>]) => {
  const hh = fract(h);
  const r = saturate(abs(hh.mul(6).sub(3)).sub(1));
  const g = saturate(float(2).sub(abs(hh.mul(6).sub(2))));
  const b = saturate(float(2).sub(abs(hh.mul(6).sub(4))));
  return vec3(r, g, b);
});

/** 0..1 breathing pulse, decorrelated per instance by `phase`. */
function growthNode(u: LatticeUniforms, phase: ReturnType<typeof float>) {
  return sin(u.uTime.mul(u.uPulseSpeed).add(phase.mul(TAU)))
    .mul(0.5)
    .add(0.5);
}

/** The spatial+temporal hue a strut/joint reads at right now. */
function hueNode(
  u: LatticeUniforms,
  phase: ReturnType<typeof float>,
  wave: ReturnType<typeof float>,
) {
  return fract(u.uTime.mul(u.uHueSpeed).add(wave).add(phase.mul(0.12)));
}

function attr3(data: Float32Array) {
  return instancedBufferAttribute(new THREE.InstancedBufferAttribute(data, 3));
}
function attr1(data: Float32Array) {
  return instancedBufferAttribute(new THREE.InstancedBufferAttribute(data, 1));
}

/**
 * The struts. Base geometry is a unit cylinder (radius 1, height 1,
 * axis Y) with NO per-instance matrix — every instance's position,
 * orientation, length, and radius is reconstructed in `positionNode`
 * from the `mid` / `dir` / `right` / `up` / `halfLen` / `barRadius`
 * attributes, then modulated by the growth pulse.
 */
export function buildStruts(
  data: LatticeInstanceData,
  u: LatticeUniforms,
): THREE.InstancedMesh {
  const geometry = new THREE.CylinderGeometry(1, 1, 1, 8, 1, false);
  const material = new THREE.MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const mid = attr3(data.mid);
  const dir = attr3(data.dir);
  const right = attr3(data.right);
  const up = attr3(data.up);
  const halfLen = attr1(data.halfLen);
  const barRadius = attr1(data.barRadius);
  const phase = attr1(data.phase);
  const wave = attr1(data.wave);

  const growth = growthNode(u, phase)
    .mul(u.uPulseDepth)
    .add(u.uPulseDepth.oneMinus());
  const lenScale = mix(0.4, 1.1, growth);
  const radScale = mix(0.55, 1.3, growth);

  // Cylinder x/z are the radial cross-section (strut basis × radius),
  // cylinder y (-0.5..0.5) is the axial position (strut direction ×
  // half-length) — reconstructing the whole instance transform here
  // rather than via `setMatrixAt` is what lets the growth pulse run
  // entirely on the GPU.
  material.positionNode = Fn(() => {
    const axial = dir.mul(positionLocal.y.mul(2).mul(halfLen).mul(lenScale));
    const radial = right
      .mul(positionLocal.x.mul(barRadius).mul(radScale))
      .add(up.mul(positionLocal.z.mul(barRadius).mul(radScale)));
    return mid.add(axial).add(radial);
  })();

  const spectrum = hueSpectrum(hueNode(u, phase, wave));
  const brightness = mix(0.7, 2.2, growth).mul(u.uBrightness);
  material.colorNode = spectrum.mul(brightness);
  material.opacityNode = mix(0.35, 0.95, growth);

  const mesh = new THREE.InstancedMesh(geometry, material, data.edgeCount);
  mesh.count = data.edgeCount;
  mesh.frustumCulled = false;
  return mesh;
}

/**
 * The joints — small bright spheres marking every vertex, standing in
 * for the lit acrylic nodes where struts meet. Steady-bright with a
 * gentler pulse than the struts so the lattice always reads as
 * connected even when every strut has shrunk toward its midpoint.
 */
export function buildJoints(
  data: LatticeInstanceData,
  u: LatticeUniforms,
  jointRadius: number,
): THREE.InstancedMesh {
  const geometry = new THREE.IcosahedronGeometry(jointRadius, 1);
  const material = new THREE.MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const pos = attr3(data.jointPos);
  const phase = attr1(data.jointPhase);
  const wave = attr1(data.jointWave);

  const growth = growthNode(u, phase).mul(0.35).add(0.65); // gentle pulse, never fully dark
  material.positionNode = pos.add(positionLocal.mul(mix(0.7, 1.15, growth)));

  const spectrum = hueSpectrum(hueNode(u, phase, wave));
  material.colorNode = spectrum.mul(mix(1.4, 2.6, growth)).mul(u.uBrightness);
  material.opacityNode = mix(0.7, 1.0, growth);

  const mesh = new THREE.InstancedMesh(geometry, material, data.jointCount);
  mesh.count = data.jointCount;
  mesh.frustumCulled = false;
  return mesh;
}
