/**
 * app/atelier/shape-of-it/scene-threads.ts
 *
 * Builds the six brush threads as variable-radius tubes coiling around
 * the spine. Each thread is sleeved in two additive glow shells and
 * surrounded by a per-thread spark Points system whose position
 * attributes the animate loop pushes upward over time.
 *
 * Loaded dynamically by scene.ts.
 */

import * as THREE from "three/webgpu";
import {
  abs,
  float,
  mx_fractal_noise_float,
  normalWorld,
  positionWorld,
  smoothstep,
  vec3,
} from "three/tsl";

import { BREAK_Y, Y_BOTTOM, Y_RANGE } from "lib/shape-of-it/chambers";
import { getBodyBright, getTightness, moundR } from "lib/shape-of-it/mound";
import type { ThreadDef } from "lib/shape-of-it/threads";

import { makeRootsAlong, type TimeUniform } from "./scene-mat";

export type ThreadBuildResult = {
  group: THREE.Group;
  threadGroups: THREE.Group[];
};

export function buildThreads(
  threadsData: ThreadDef[],
  chamberMeshes: THREE.Mesh[],
  uTime: TimeUniform,
): ThreadBuildResult {
  const group = new THREE.Group();
  const threadGroups: THREE.Group[] = [];

  threadsData.forEach((thread, ti) => {
    const tg = new THREE.Group();
    const baseCol = new THREE.Color(thread.col[0], thread.col[1], thread.col[2]);
    const emCol = new THREE.Color(thread.em[0], thread.em[1], thread.em[2]);
    tg.userData = { thread, ti };

    const N = 500;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const y = Y_BOTTOM + t * Y_RANGE;
      const chamFlare = chamberMeshes.reduce((acc, cM) => {
        const dt = Math.abs(y - cM.position.y) / Y_RANGE;
        return acc + Math.exp(-dt * 45) * 0.16;
      }, 0);

      const tight = getTightness(t);
      const mR = moundR((y - Y_BOTTOM) / Y_RANGE);
      const spiralR = tight * 0.5 + mR * thread.rf * 1.5 + chamFlare * thread.rf;

      const angle =
        t * Math.PI * 2 * thread.twist +
        ti * ((Math.PI * 2) / threadsData.length);
      const dFreq = 1.8 + ti * 0.28;
      const dx =
        thread.driftX *
        Math.sin(t * Math.PI * dFreq + thread.phaseX) *
        (0.22 + t * 0.78);
      const dz =
        thread.driftZ *
        Math.cos(t * Math.PI * dFreq + thread.phaseZ) *
        (0.22 + t * 0.78);

      pts.push(
        new THREE.Vector3(
          Math.cos(angle) * spiralR + dx * 0.36,
          y,
          Math.sin(angle) * spiralR + dz * 0.36,
        ),
      );
    }
    const path = new THREE.CatmullRomCurve3(pts);
    tg.userData.path = path;

    const geo = new THREE.TubeGeometry(path, 340, thread.radius, 8, false);
    const pa = geo.attributes.position;
    const vc: number[] = [];
    if (pa) {
      for (let i = 0; i < pa.count; i++) {
        const tv = Math.max(0, Math.min(1, (pa.getY(i) - Y_BOTTOM) / Y_RANGE));
        let bright = thread.bright;
        if (thread.darkSection) bright *= getBodyBright(tv);
        if (thread.grows) bright *= 0.26 + tv * 1.12;
        const c = baseCol.clone().multiplyScalar(bright);
        vc.push(c.r, c.g, c.b);
      }
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(vc, 3));

    const mat = new THREE.MeshStandardNodeMaterial({
      vertexColors: true,
      roughness: 0.0,
      metalness: 0.08,
    });
    const tp = positionWorld
      .mul(3.0)
      .add(vec3(float(ti * 1.9), uTime.mul(thread.speed * 0.5), float(ti * 0.7)));
    const tn = mx_fractal_noise_float(tp, 3, 1.8, 0.5, 1.0).mul(0.5).add(0.5);
    const rim = abs(normalWorld.dot(vec3(0, 0, 1))).oneMinus().pow(float(2.2));
    const bf = smoothstep(
      float(0.0),
      float(0.48),
      abs(positionWorld.y.sub(float(BREAK_Y))),
    );
    const pulse = tn.mul(1.88).mul(bf);
    const rimB = rim.mul(0.52).mul(bf);
    mat.emissiveNode = vec3(
      float(emCol.r).mul(pulse.add(rimB)),
      float(emCol.g).mul(pulse.add(rimB)),
      float(emCol.b).mul(pulse.add(rimB)),
    );
    tg.add(new THREE.Mesh(geo, mat));

    const glowM = new THREE.MeshBasicMaterial({
      color: baseCol,
      transparent: true,
      opacity: 0.06,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    makeRootsAlong(tg, path, thread.radius, mat, 3, 1.5, 1.0, glowM);

    tg.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(path, 200, thread.radius * 3.0, 8, false),
        new THREE.MeshBasicMaterial({
          color: baseCol,
          transparent: true,
          opacity: 0.088,
          side: THREE.BackSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      ),
    );
    tg.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(path, 100, thread.radius * 6.2, 6, false),
        new THREE.MeshBasicMaterial({
          color: baseCol,
          transparent: true,
          opacity: 0.034,
          side: THREE.BackSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      ),
    );

    addSparks(tg, path, baseCol, ti);
    group.add(tg);
    threadGroups.push(tg);
  });

  return { group, threadGroups };
}

function addSparks(
  tg: THREE.Group,
  path: THREE.CatmullRomCurve3,
  baseCol: THREE.Color,
  ti: number,
): void {
  const sparkN = 85;
  const sGeo = new THREE.BufferGeometry();
  const sPos = new Float32Array(sparkN * 3);
  const sCol = new Float32Array(sparkN * 3);
  const sMeta = new Float32Array(sparkN);
  for (let s = 0; s < sparkN; s++) {
    const st = Math.random();
    const clampedSt = Math.min(Math.max(st, 0.0001), 0.9999);
    const pt = path.getPoint(clampedSt);
    const r = 0.06 + Math.random() * 0.16;
    const a = Math.random() * Math.PI * 2;
    sPos[s * 3] = pt.x + Math.cos(a) * r;
    sPos[s * 3 + 1] = pt.y + (Math.random() - 0.5) * 0.2;
    sPos[s * 3 + 2] = pt.z + Math.sin(a) * r;
    const c = baseCol.clone().multiplyScalar(0.28 + Math.random() * 0.72);
    sCol[s * 3] = c.r;
    sCol[s * 3 + 1] = c.g;
    sCol[s * 3 + 2] = c.b;
    sMeta[s] = st;
  }
  sGeo.setAttribute("position", new THREE.Float32BufferAttribute(sPos, 3));
  sGeo.setAttribute("color", new THREE.Float32BufferAttribute(sCol, 3));
  sGeo.userData = { meta: sMeta, path };
  const sparks = new THREE.Points(
    sGeo,
    new THREE.PointsMaterial({
      vertexColors: true,
      size: 0.018 + ti * 0.003,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  sparks.userData.isSparkSystem = true;
  tg.add(sparks);
}
