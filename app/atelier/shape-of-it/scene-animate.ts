/**
 * app/atelier/shape-of-it/scene-animate.ts
 *
 * Per-frame animation helpers pulled out of scene.ts to keep that file
 * under the 300-line cap. Each function mutates the live three.js
 * objects in place — no return values — and is called from the
 * orchestrator's tick loop with the global elapsed time.
 *
 * Loaded statically by scene.ts (also a client-only file, also TSL).
 */

import * as THREE from "three/webgpu";

import type { Chamber } from "lib/shape-of-it/chambers";
import { Y_BOTTOM, Y_RANGE } from "lib/shape-of-it/chambers";
import type { ThreadDef } from "lib/shape-of-it/threads";

import type { LabyrinthBuildResult } from "./scene-labyrinth";

export type OrbitLights = {
  lightA: THREE.PointLight;
  lightB: THREE.PointLight;
  lightC: THREE.PointLight;
};

export function animateLights(
  globalT: number,
  orbit: OrbitLights,
  chamberLights: THREE.PointLight[],
  chambers: Chamber[],
): void {
  const la = globalT * 0.31;
  orbit.lightA.position.set(
    Math.cos(la) * 2.9,
    Math.sin(la * 0.62) * 1.2,
    Math.sin(la) * 2.9,
  );
  orbit.lightB.position.set(
    Math.cos(la + Math.PI) * 2.7,
    Math.sin(la * 0.66 + 1) * 1.0,
    Math.sin(la + Math.PI) * 2.7,
  );
  orbit.lightC.intensity = Math.max(
    0,
    (3.6 - orbit.lightA.position.distanceTo(orbit.lightB.position)) * 0.66 +
      Math.sin(globalT * 1.08) * 0.28,
  );

  chamberLights.forEach((pl, i) => {
    const ch = chambers[i];
    if (!ch) return;
    pl.intensity = ch.dark
      ? 0.04 + Math.sin(globalT * 0.26 + i) * 0.02
      : 0.28 +
        Math.sin(globalT * 0.46 + i * 0.9) * 0.24 +
        (ch.top ? 0.5 : 0);
  });
}

export function animateThreads(
  globalT: number,
  dt: number,
  threadGroups: THREE.Group[],
  threadLights: THREE.PointLight[],
  defs: ThreadDef[],
): void {
  threadGroups.forEach((tg, ti) => {
    const def = defs[ti];
    if (!def) return;
    let lt = (globalT * 0.086 + ti * 0.22) % 1;
    lt = Math.min(0.9999, Math.max(0.0001, lt));
    const path = tg.userData.path as THREE.CatmullRomCurve3 | undefined;
    const tl = threadLights[ti];
    if (path && tl) {
      const pt = path.getPoint(lt);
      tl.position.copy(pt);
      tl.intensity = 0.76 + Math.sin(globalT * def.speed * 2.2 + ti) * 0.46;
    }
    tg.children.forEach((child) => {
      if (!(child instanceof THREE.Points)) return;
      if (!child.userData.isSparkSystem) return;
      advanceSparks(child, dt);
    });
  });
}

function advanceSparks(points: THREE.Points, dt: number): void {
  const geo = points.geometry as THREE.BufferGeometry;
  const sp = geo.attributes.position as THREE.BufferAttribute | undefined;
  const meta = geo.userData.meta as Float32Array | undefined;
  const path = geo.userData.path as THREE.CatmullRomCurve3 | undefined;
  if (!sp || !meta || !path) return;
  for (let s = 0; s < sp.count; s++) {
    const y = sp.getY(s) + dt * (1.2 + Math.random() * 0.8);
    sp.setY(s, y);
    const t = meta[s] ?? 0;
    const maxY = Y_BOTTOM + t * Y_RANGE + 0.36;
    if (y > maxY + 0.2) {
      const nt = Math.random();
      const pt = path.getPoint(Math.min(0.9999, Math.max(0.0001, nt)));
      const r = 0.06 + Math.random() * 0.14;
      const a = Math.random() * Math.PI * 2;
      sp.setXYZ(s, pt.x + Math.cos(a) * r, pt.y, pt.z + Math.sin(a) * r);
      meta[s] = nt;
    }
  }
  sp.needsUpdate = true;
}

export function animateLabyrinth(
  globalT: number,
  lab: LabyrinthBuildResult,
): void {
  lab.knowGroup.rotation.y = globalT * 0.055;
  lab.lifeGroup.rotation.y = -globalT * 0.042;
  lab.knowNodeRefs.forEach(({ mesh, node }) => {
    const baseY =
      (mesh.userData.baseY as number | undefined) ?? mesh.position.y;
    if (mesh.userData.baseY === undefined)
      mesh.userData.baseY = mesh.position.y;
    mesh.position.y = baseY + 0.1 * Math.sin(globalT * 0.2 + node.id * 0.72);
  });
  lab.lifeNodeRefs.forEach(({ mesh, node }) => {
    const baseY =
      (mesh.userData.baseY as number | undefined) ?? mesh.position.y;
    if (mesh.userData.baseY === undefined)
      mesh.userData.baseY = mesh.position.y;
    mesh.position.y =
      baseY + 0.1 * Math.sin(globalT * 0.16 + node.id * 0.85 + 1.1);
  });
  lab.synthMeshes.forEach((mesh, si) => {
    const pulse = 0.35 + 0.55 * Math.sin(globalT * 0.62 + si * 0.95);
    (mesh.material as THREE.Material & { opacity: number }).opacity =
      pulse * 0.65;
  });
}
