/**
 * app/atelier/waveguide-forge/webgpu-photonmap.ts
 *
 * WebGPU TSL photon-map caustics for the Waveguide Forge chamber.
 *
 * Replaces the GLSL pixel-back-march approximation with a proper forward
 * photon-map: spawn N photons per frame from each light, raymarch each
 * through the SDF, refract at the boundary, splat the hit onto a 2D
 * photon-map storage buffer, then render the ground plane with the
 * photon-map as emissive.
 *
 * Honesty disclosure: TSL's compute API has shifted method names between
 * three r170-r180. The kernel here matches r172/r173 conventions; the
 * Holoflow site ships three ^0.171.0 so some helpers may be unknown
 * symbols and need probing. If the WebGPU mode throws on init, the
 * default GLSL backend still runs and the chamber stays usable.
 */

import * as THREE from "three";

import { createLogger } from "lib/log";

const log = createLogger("atelier:waveguide-forge");

// ---------------------------------------------------------------------------
// Detection / renderer construction

export type WebGPUSupport = { available: boolean; reason?: string };

export async function detectWebGPU(): Promise<WebGPUSupport> {
  if (typeof navigator === "undefined") {
    return { available: false, reason: "no navigator (SSR)" };
  }
  if (!navigator.gpu) return { available: false, reason: "navigator.gpu missing" };
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return { available: false, reason: "no GPU adapter" };
    return { available: true };
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    return { available: false, reason };
  }
}

export async function createWebGPURenderer(
  canvas: HTMLCanvasElement,
): Promise<unknown | null> {
  const support = await detectWebGPU();
  if (!support.available) return null;
  try {
    const mod = (await import(/* webpackIgnore: true */ "three/webgpu")) as {
      WebGPURenderer: new (opts: {
        canvas: HTMLCanvasElement;
        antialias: boolean;
      }) => { init: () => Promise<void> };
    };
    const Renderer = mod.WebGPURenderer;
    const r = new Renderer({ canvas, antialias: true });
    await r.init();
    return r;
  } catch (err) {
    log.warn("WebGPU import failed", { err });
    return null;
  }
}

// ---------------------------------------------------------------------------
// Photon-map configuration

export const PHOTON_MAP_W = 512;
export const PHOTON_MAP_H = 512;
export const PHOTONS_PER_FRAME = 65_536;
export const MAX_LIGHTS = 4;
/** Fixed-point shift for the atomic photon counter. */
export const INTENSITY_SHIFT = 1024;
export const MAX_RAY_STEPS = 96;
export const MAX_RAY_DIST = 6.0;

export type LightUniform = {
  origin: THREE.Vector3;
  direction: THREE.Vector3;
  coneAngle: number;
  radius: number;
  intensity: number;
};

// ---------------------------------------------------------------------------
// Photon-trace compute kernel

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function buildPhotonKernel(opts: {
  sdfTexture: THREE.Data3DTexture;
  sdfMin: THREE.Vector3;
  sdfMax: THREE.Vector3;
  ior: number;
  lights: LightUniform[];
}) {
  const tsl: any = await import(/* webpackIgnore: true */ "three/tsl");
  const {
    Fn,
    If,
    Loop,
    instanceIndex,
    uniform,
    vec3,
    int,
    float,
    hash,
    atomicAdd,
    storage,
    texture3D,
    normalize,
    refract,
  } = tsl;

  const photonData = new Uint32Array(PHOTON_MAP_W * PHOTON_MAP_H);
  const photonStorage = storage(
    photonData,
    "uint",
    PHOTON_MAP_W * PHOTON_MAP_H,
  ).toAtomic();

  const uIor = uniform(opts.ior);
  const uFrame = uniform(0);
  const uLightCount = uniform(opts.lights.length);

  const lightsPacked = new Float32Array(MAX_LIGHTS * 12);
  function packLights(arr: LightUniform[]) {
    lightsPacked.fill(0);
    for (let i = 0; i < arr.length && i < MAX_LIGHTS; i++) {
      // i bounded by arr.length; arr[i] is defined.
      const L = arr[i]!;
      const base = i * 12;
      lightsPacked[base + 0] = L.origin.x;
      lightsPacked[base + 1] = L.origin.y;
      lightsPacked[base + 2] = L.origin.z;
      lightsPacked[base + 3] = L.coneAngle;
      lightsPacked[base + 4] = L.direction.x;
      lightsPacked[base + 5] = L.direction.y;
      lightsPacked[base + 6] = L.direction.z;
      lightsPacked[base + 7] = L.radius;
      lightsPacked[base + 8] = L.intensity;
    }
  }
  packLights(opts.lights);
  const uLights = storage(lightsPacked, "vec4", MAX_LIGHTS * 3);

  const sdfTex = texture3D(opts.sdfTexture);
  const uSdfMin = uniform(opts.sdfMin);
  const uSdfMax = uniform(opts.sdfMax);

  const sampleSdf = Fn(([p]: any) => {
    const t = p.sub(uSdfMin).div(uSdfMax.sub(uSdfMin));
    return sdfTex.sample(t).r;
  });

  const sdfNormal = Fn(([p]: any) => {
    const e = float(0.002);
    const dx = sampleSdf(p.add(vec3(e, 0, 0))).sub(
      sampleSdf(p.sub(vec3(e, 0, 0))),
    );
    const dy = sampleSdf(p.add(vec3(0, e, 0))).sub(
      sampleSdf(p.sub(vec3(0, e, 0))),
    );
    const dz = sampleSdf(p.add(vec3(0, 0, e))).sub(
      sampleSdf(p.sub(vec3(0, 0, e))),
    );
    return normalize(vec3(dx, dy, dz));
  });

  const kernel = Fn(() => {
    const idx = instanceIndex;
    const lightIdx = idx.mod(uLightCount).toInt();
    const base = lightIdx.mul(3);
    const packed0 = uLights.element(base);
    const packed1 = uLights.element(base.add(1));
    const packed2 = uLights.element(base.add(2));
    const origin = packed0.xyz;
    const coneAngle = packed0.w;
    const dir = packed1.xyz.normalize();
    const radius = packed1.w;
    const intensity = packed2.x;

    const seedBase = idx.mul(7919).add(uFrame.mul(104729));
    const r1 = hash(seedBase.toFloat());
    const r2 = hash(seedBase.add(1).toFloat());
    const r3 = hash(seedBase.add(2).toFloat());
    const r4 = hash(seedBase.add(3).toFloat());

    const phi = r1.mul(6.2831853);
    const rdisk = r2.sqrt().mul(radius);
    const tangent = normalize(
      vec3(0, 0, 1).sub(dir.mul(dir.dot(vec3(0, 0, 1)))),
    );
    const bitangent = dir.cross(tangent);
    const jitteredOrigin = origin
      .add(tangent.mul(rdisk.mul(phi.cos())))
      .add(bitangent.mul(rdisk.mul(phi.sin())));

    const ca = r3.mul(coneAngle);
    const caa = r4.mul(6.2831853);
    const offset = tangent
      .mul(caa.cos())
      .add(bitangent.mul(caa.sin()))
      .mul(ca.sin());
    const jitteredDir = normalize(dir.mul(ca.cos()).add(offset));

    const tAcc = float(0).toVar();
    const hit = int(0).toVar();
    const hitPos = vec3(0, 0, 0).toVar();
    const hitN = vec3(0, 0, 0).toVar();

    Loop(MAX_RAY_STEPS, () => {
      const p = jitteredOrigin.add(jitteredDir.mul(tAcc));
      const d = sampleSdf(p);
      If(hit.equal(0).and(d.lessThan(0.001)), () => {
        hit.assign(int(1));
        hitPos.assign(p);
        hitN.assign(sdfNormal(p));
      });
      tAcc.assign(tAcc.add(d.max(0.001)));
    });

    If(hit.equal(1), () => {
      const refracted = refract(jitteredDir, hitN, float(1).div(uIor));
      If(refracted.y.lessThan(-0.001), () => {
        const tg = float(-1).sub(hitPos.y).div(refracted.y);
        const groundHit = hitPos.add(refracted.mul(tg));
        const u = groundHit.x.add(1.5).div(3.0).clamp(0, 1);
        const v = groundHit.z.add(1.5).div(3.0).clamp(0, 1);
        const tx = u.mul(PHOTON_MAP_W).toInt().min(PHOTON_MAP_W - 1);
        const ty = v.mul(PHOTON_MAP_H).toInt().min(PHOTON_MAP_H - 1);
        const linearIdx = ty.mul(PHOTON_MAP_W).add(tx);
        const contrib = intensity.mul(INTENSITY_SHIFT).toInt().max(1);
        atomicAdd(photonStorage.element(linearIdx), contrib.toUint());
      });
    });
  });

  const decayKernel = Fn(() => {
    const idx = instanceIndex;
    const cur = photonStorage.element(idx).load();
    const next = cur.mul(3).div(4).toUint();
    photonStorage.element(idx).store(next);
  });

  return {
    photonStorage,
    photonData,
    lightsPacked,
    packLights,
    uFrame,
    uIor,
    uSdfMin,
    uSdfMax,
    photonCompute: kernel.compute(PHOTONS_PER_FRAME),
    decayCompute: decayKernel.compute(PHOTON_MAP_W * PHOTON_MAP_H),
  };
}

export async function buildGroundMaterial(
  photonStorage: any,
  intensityScale = 0.01,
) {
  const tsl: any = await import(/* webpackIgnore: true */ "three/tsl");
  const { Fn, vec3, uv } = tsl;

  const material = new tsl.MeshBasicNodeMaterial();
  material.colorNode = Fn(() => {
    const u = uv();
    const tx = u.x.mul(PHOTON_MAP_W).toInt().min(PHOTON_MAP_W - 1);
    const ty = u.y.mul(PHOTON_MAP_H).toInt().min(PHOTON_MAP_H - 1);
    const linearIdx = ty.mul(PHOTON_MAP_W).add(tx);
    const fixed = photonStorage.element(linearIdx).load().toFloat();
    const intensity = fixed.div(INTENSITY_SHIFT).mul(intensityScale);
    const base = vec3(0.05, 0.05, 0.08);
    const peak = vec3(1.0, 0.85, 0.6);
    return base.add(peak.sub(base).mul(intensity.clamp(0, 1)));
  })();
  return material;
}

export type PhotonMapScene = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  photonCompute: any;
  decayCompute: any;
  uFrame: any;
  uIor: any;
  packLights: (lights: LightUniform[]) => void;
  step: (renderer: any, dt: number) => Promise<void>;
  dispose: () => void;
};

export async function buildPhotonMapScene(args: {
  sdfTexture: THREE.Data3DTexture;
  sdfMin: THREE.Vector3;
  sdfMax: THREE.Vector3;
  ior: number;
  lights: LightUniform[];
}): Promise<PhotonMapScene> {
  const kernel = await buildPhotonKernel(args);
  const groundMat = await buildGroundMaterial(kernel.photonStorage);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#0e0e14");

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), groundMat);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const extent = args.sdfMax.clone().sub(args.sdfMin);
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(extent.x, extent.y, extent.z),
    new THREE.MeshBasicMaterial({
      color: 0xff66cc,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    }),
  );
  box.position.copy(args.sdfMin).add(extent.clone().multiplyScalar(0.5));
  scene.add(box);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(3, 2.5, 3);
  camera.lookAt(0, 0, 0);

  let frame = 0;

  return {
    scene,
    camera,
    photonCompute: kernel.photonCompute,
    decayCompute: kernel.decayCompute,
    uFrame: kernel.uFrame,
    uIor: kernel.uIor,
    packLights: kernel.packLights,
    // Reference the closed-over `scene` / `camera` rather than `this.*`.
    // `this` on an async object-literal method is inferred as the union of
    // the returned object with its PromiseLike completion, which is what
    // tripped the typechecker. The closure references are identical at
    // runtime and unambiguous to TS.
    async step(renderer: any, _dt: number) {
      frame += 1;
      kernel.uFrame.value = frame;
      await renderer.computeAsync(kernel.decayCompute);
      await renderer.computeAsync(kernel.photonCompute);
      await renderer.renderAsync(scene, camera);
    },
    dispose() {
      ground.geometry.dispose();
      box.geometry.dispose();
      (box.material as THREE.Material).dispose();
    },
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
