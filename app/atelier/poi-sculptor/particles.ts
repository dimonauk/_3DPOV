/**
 * app/atelier/poi-sculptor/particles.ts
 *
 * GPU compute particle system. PARTICLE_COUNT instances on a single
 * SpriteNodeMaterial, updated each frame by a TSL compute kernel that
 * applies curl noise, dual attractors, gravity, and respawn-on-death.
 * The attractors are driven from JS each frame so the trail spawns
 * sparks that orbit and reset toward the trail's hand centres.
 *
 * Loaded dynamically by scene.ts. Requires three.js ≥ 0.171 for
 * `instancedArray` and `time` from three/tsl.
 *
 * TypeScript note: the TSL `Fn` overloads in 0.171 require the inner
 * function to return a `Node`, but a compute kernel just writes into
 * storage and has no meaningful return. We append a `float(0)` to keep
 * the type checker happy; the value is discarded by the compute
 * pipeline. We also pass an explicit `[64]` workgroup size to
 * `.compute()` because the chained signature requires it in 0.171.
 */

import * as THREE from "three/webgpu";
import {
  color,
  cos,
  Fn,
  float,
  instancedArray,
  instanceIndex,
  length,
  mix,
  mx_noise_float,
  sin,
  time,
  uniform,
  vec3,
} from "three/tsl";

export const PARTICLE_COUNT = 300_000;
const WORKGROUP: number[] = [64];

export type ParticleSystem = {
  mesh: THREE.InstancedMesh;
  uAtt0: { value: THREE.Vector3 };
  uAtt1: { value: THREE.Vector3 };
  uCurl: { value: number };
  uDt: { value: number };
  computeInit: THREE.ComputeNode;
  computeUpdate: THREE.ComputeNode;
};

const curlNoise3D = Fn(([p]: [ReturnType<typeof vec3>]) => {
  const e = float(0.002);
  const px = mx_noise_float(p.add(vec3(e, 0, 0)));
  const nx = mx_noise_float(p.sub(vec3(e, 0, 0)));
  const py = mx_noise_float(p.add(vec3(0, e, 0)));
  const ny = mx_noise_float(p.sub(vec3(0, e, 0)));
  const pz = mx_noise_float(p.add(vec3(0, 0, e)));
  const nz = mx_noise_float(p.sub(vec3(0, 0, e)));
  return vec3(
    py.sub(ny).sub(pz.sub(nz)),
    pz.sub(nz).sub(px.sub(nx)),
    px.sub(nx).sub(py.sub(ny)),
  ).div(e.mul(2));
});

export function buildParticleSystem(): ParticleSystem {
  const N = PARTICLE_COUNT;
  const posBuffer = instancedArray(N, "vec3");
  const velBuffer = instancedArray(N, "vec3");
  const lifeBuffer = instancedArray(N, "float");

  const uAtt0 = uniform(new THREE.Vector3(0.5, 0, 0));
  const uAtt1 = uniform(new THREE.Vector3(-0.5, 0, 0));
  const uCurl = uniform(0.65);
  const uDt = uniform(0.016);

  const computeInit = Fn(() => {
    const i = instanceIndex;
    const fi = float(i);
    const phi = fi.mul(2.3999632).mod(6.28318);
    const theta = fi.div(N).sqrt().mul(3.14159);
    const r = fi.div(N).sqrt().mul(2.5);
    posBuffer.element(i).assign(
      vec3(
        r.mul(sin(theta)).mul(cos(phi)),
        r.mul(cos(theta)),
        r.mul(sin(theta)).mul(sin(phi)),
      ),
    );
    velBuffer.element(i).assign(vec3(0, 0, 0));
    lifeBuffer.element(i).assign(fi.div(N));
    return float(0);
  })().compute(N, WORKGROUP);

  const computeUpdate = Fn(() => {
    const i = instanceIndex;
    const pos = posBuffer.element(i);
    const vel = velBuffer.element(i);
    const life = lifeBuffer.element(i);

    const nP = pos.mul(0.7).add(vec3(time.mul(0.15), 0, time.mul(0.08)));
    const curlVel = curlNoise3D(nP).mul(uCurl.mul(0.018));

    const toA0 = uAtt0.sub(pos);
    const toA1 = uAtt1.sub(pos);
    const d0 = length(toA0).add(0.001);
    const d1 = length(toA1).add(0.001);
    const f0 = toA0.div(d0.mul(d0)).mul(0.0008);
    const f1 = toA1.div(d1.mul(d1)).mul(0.0008);

    const nV = vel.add(curlVel).add(f0).add(f1).add(vec3(0, -0.0002, 0)).mul(0.97);
    const nL = life.sub(uDt.mul(0.18));
    const dead = float(nL.lessThan(0));
    // `i` is `instanceIndex` (uint). `i.mod(2)` compiles to `mod(uint, int)`
    // which has no overload in WebGL2's GLSL ES 3.0 — shader fails with
    // `'mod' : no matching overloaded function found` and the canvas stays
    // black. Float-cast both sides so the emitted call is `mod(float, float)`.
    const spawn = mix(uAtt0, uAtt1, float(i).mod(2));
    const jit = vec3(
      mx_noise_float(vec3(float(i).mul(0.01), time, 0)).sub(0.5).mul(0.3),
      mx_noise_float(vec3(float(i).mul(0.01), time, 1)).sub(0.5).mul(0.3),
      mx_noise_float(vec3(float(i).mul(0.01), time, 2)).sub(0.5).mul(0.3),
    );

    posBuffer.element(i).assign(mix(pos.add(nV), spawn.add(jit), dead));
    velBuffer.element(i).assign(mix(nV, vec3(0, 0, 0), dead));
    lifeBuffer.element(i).assign(mix(nL, float(1), dead));
    return float(0);
  })().compute(N, WORKGROUP);

  const sMat = new THREE.SpriteNodeMaterial();
  sMat.blending = THREE.AdditiveBlending;
  sMat.depthWrite = false;
  sMat.transparent = true;
  sMat.positionNode = posBuffer.element(instanceIndex);
  const lv = lifeBuffer.element(instanceIndex).clamp(0, 1);
  sMat.scaleNode = lv.mul(0.012).add(0.003);
  sMat.colorNode = mix(color(0xff4400), color(0xffd080), lv.pow(0.5));
  sMat.opacityNode = lv.mul(lv).mul(0.7);

  const sGeo = new THREE.PlaneGeometry(1, 1);
  const mesh = new THREE.InstancedMesh(sGeo, sMat, N);
  mesh.count = N;
  mesh.frustumCulled = false;

  return {
    mesh,
    uAtt0: uAtt0 as unknown as { value: THREE.Vector3 },
    uAtt1: uAtt1 as unknown as { value: THREE.Vector3 },
    uCurl: uCurl as unknown as { value: number },
    uDt: uDt as unknown as { value: number },
    computeInit: computeInit as unknown as THREE.ComputeNode,
    computeUpdate: computeUpdate as unknown as THREE.ComputeNode,
  };
}
