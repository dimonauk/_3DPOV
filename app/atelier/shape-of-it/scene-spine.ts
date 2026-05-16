/**
 * app/atelier/shape-of-it/scene-spine.ts
 *
 * Builders for the central axis: the spine itself, the nine chambers,
 * and the transmissive gyroid shell that hangs over the whole
 * arrangement. The recursive branch builder lives in scene-branch.ts;
 * the labyrinth rings live in scene-labyrinth.ts.
 *
 * Loaded dynamically by scene.ts.
 */

import * as THREE from "three/webgpu";
import {
  abs,
  float,
  mx_noise_float,
  positionWorld,
  smoothstep,
  vec3,
} from "three/tsl";

import type { Chamber } from "lib/shape-of-it/chambers";
import { BREAK_T, BREAK_Y, Y_BOTTOM, Y_RANGE } from "lib/shape-of-it/chambers";

import { buildBranch } from "./scene-branch";
import { makeCastMat, makeRootsAlong, type TimeUniform } from "./scene-mat";

export function buildSpine(uTime: TimeUniform): THREE.Group {
  const group = new THREE.Group();
  const N = 320;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const y = Y_BOTTOM + t * Y_RANGE;
    const bDist = Math.abs(t - BREAK_T);
    const constrict = Math.exp(-bDist * 22);
    const baseFlare = 1.0 + 1.8 * Math.exp(-t * 12);
    const w = 0.02 * (1 - constrict * 0.96) * baseFlare;
    pts.push(
      new THREE.Vector3(
        w * Math.sin(t * Math.PI * 8.2 + 0.4) * Math.sin(t * Math.PI * 3.1),
        y,
        w * Math.cos(t * Math.PI * 6.7 + 1.1) * Math.sin(t * Math.PI * 4.3),
      ),
    );
  }
  const path = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(path, 300, 0.011, 7, false);
  const pa = geo.attributes.position;
  const vc: number[] = [];
  if (pa) {
    for (let i = 0; i < pa.count; i++) {
      const tv = Math.max(0, Math.min(1, (pa.getY(i) - Y_BOTTOM) / Y_RANGE));
      const bDist = Math.abs(tv - BREAK_T);
      const dim = Math.exp(-bDist * 24);
      const bright = (0.08 + tv * 0.92) * (1 - dim * 0.97);
      const c = new THREE.Color().setHSL(0.73 - tv * 0.05, 0.88, bright * 0.5);
      vc.push(c.r, c.g, c.b);
    }
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(vc, 3));

  const mat = new THREE.MeshStandardNodeMaterial({
    vertexColors: true,
    roughness: 0.0,
    metalness: 0.12,
  });
  const sp = positionWorld.mul(4.2).add(vec3(0, uTime.mul(0.11), 0));
  const sn = mx_noise_float(sp).mul(0.5).add(0.5);
  const sf = smoothstep(
    float(0.0),
    float(0.36),
    abs(positionWorld.y.sub(float(BREAK_Y))),
  );
  mat.emissiveNode = vec3(
    float(0.18).mul(sn).mul(sf),
    float(0.06).mul(sn).mul(sf),
    float(0.5).mul(sn).mul(sf),
  );

  group.add(new THREE.Mesh(geo, mat));
  group.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(path, 160, 0.03, 5, false),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.5, 0.28, 0.9),
        transparent: true,
        opacity: 0.04,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
      }),
    ),
  );

  makeRootsAlong(group, path, 0.056, mat, 6, 2.0, 1.8);
  return group;
}

export function buildGyroidShell(uTime: TimeUniform): THREE.Group {
  const group = new THREE.Group();
  const N = 32;
  const iGeo = new THREE.BufferGeometry();
  const iPos: number[] = [];
  for (let i = 0; i <= N; i++) {
    for (let j = 0; j <= N; j++) {
      const u = (i / N) * Math.PI * 2;
      const v = (j / N) * Math.PI;
      const n =
        0.12 * Math.sin(u * 3) * Math.cos(v * 2) +
        0.08 * Math.sin(v * 3) * Math.cos(u * 2) +
        0.05 * Math.sin((u + v) * 4);
      const r = 0.5 + n;
      iPos.push(
        r * Math.sin(v) * Math.cos(u),
        r * Math.cos(v) * 2.05,
        r * Math.sin(v) * Math.sin(u),
      );
    }
  }
  const iIdx: number[] = [];
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const a = i * (N + 1) + j;
      const b = a + 1;
      const c = a + (N + 1);
      const d = c + 1;
      iIdx.push(a, b, d, a, d, c);
    }
  }
  iGeo.setAttribute("position", new THREE.Float32BufferAttribute(iPos, 3));
  iGeo.setIndex(iIdx);
  iGeo.computeVertexNormals();

  const iMat = new THREE.MeshPhysicalNodeMaterial({
    color: 0xffffff,
    roughness: 0.0,
    metalness: 0,
    transmission: 0.96,
    thickness: 1.2,
    ior: 1.52,
    transparent: true,
    side: THREE.DoubleSide,
    opacity: 0.05,
  });
  const iN = mx_noise_float(
    positionWorld.mul(1.5).add(vec3(0, uTime.mul(0.044), 0)),
  )
    .mul(0.5)
    .add(0.5);
  iMat.emissiveNode = vec3(iN.mul(0.032), iN.mul(0.042), iN.mul(0.058));

  group.add(new THREE.Mesh(iGeo, iMat));
  group.add(
    new THREE.Mesh(
      iGeo.clone(),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.02,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    ),
  );
  return group;
}

export type ChamberBuildResult = {
  group: THREE.Group;
  meshes: THREE.Mesh[];
};

export function buildChambers(
  chambers: Chamber[],
  uTime: TimeUniform,
): ChamberBuildResult {
  const group = new THREE.Group();
  const chamberMeshes: THREE.Mesh[] = [];

  chambers.forEach((ch, ci) => {
    const col = new THREE.Color(ch.hex);
    const cg = new THREE.Group();
    const res = ch.dark ? 12 : ch.wide ? 26 : 18;
    const sGeo = new THREE.SphereGeometry(ch.r, res, res);
    const sp = sGeo.attributes.position;
    if (sp) {
      for (let i = 0; i < sp.count; i++) {
        const x = sp.getX(i);
        const y = sp.getY(i);
        const z = sp.getZ(i);
        const l = Math.sqrt(x * x + y * y + z * z) || 1;
        let n =
          0.13 * Math.sin(x * 4.8 + ci * 1.4) * Math.cos(y * 3.9) +
          0.09 * Math.sin(y * 5.8 + ci * 0.9) * Math.cos(z * 4.6) +
          0.05 * Math.sin(z * 4.1 + x * 2.5 + ci * 1.1);
        if (ch.wide)
          n +=
            (0.14 * Math.abs(Math.sin(y * 1.9 + ci)) * (Math.abs(x) + Math.abs(z))) /
            (l + 0.001);
        const nr = l * (1 + n);
        sp.setXYZ(i, (x / l) * nr, (y / l) * nr, (z / l) * nr);
      }
    }
    sGeo.computeVertexNormals();

    const chamMat = makeCastMat(
      col,
      uTime,
      ch.dark ? 0.04 : 0.76,
      ch.dark ? 0.2 : 0.9,
      ch.dark ? 0.001 : 0.048,
    );
    const mesh = new THREE.Mesh(sGeo, chamMat);
    mesh.userData = { chamber: ch, idx: ci };
    cg.add(mesh);
    chamberMeshes.push(mesh);

    if (!ch.dark) {
      cg.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(ch.r * 0.32, 8, 8),
          new THREE.MeshBasicMaterial({
            color: col,
            transparent: true,
            opacity: ch.top ? 0.2 : 0.07,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        ),
      );
    }
    cg.position.set(0, ch.y, 0);
    group.add(cg);

    ch.branches.forEach((br, bi) => {
      const ang = br.ang;
      const origin = new THREE.Vector3(
        Math.cos(ang) * ch.r * 0.75,
        ch.y + (bi - ch.branches.length / 2) * 0.06,
        Math.sin(ang) * ch.r * 0.75,
      );
      const dir = new THREE.Vector3(
        Math.cos(ang),
        0.04 + bi * 0.015,
        Math.sin(ang),
      ).normalize();
      group.add(
        buildBranch(origin, dir, br.len, col, uTime, 0, ci * 17.3 + bi * 5.7),
      );
    });
  });

  return { group, meshes: chamberMeshes };
}
