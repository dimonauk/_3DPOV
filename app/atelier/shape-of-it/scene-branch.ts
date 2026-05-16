/**
 * app/atelier/shape-of-it/scene-branch.ts
 *
 * Recursive colony-branch builder used by every chamber. Each branch is
 * a wobbly Catmull-Rom tube with a transmissive cast material and a
 * small emissive node at its tip; depth-2 sub-branches fan off the
 * upper half.
 *
 * Pulled out of scene-spine.ts to keep both files under the 300-line cap.
 * Loaded dynamically by scene.ts.
 */

import * as THREE from "three/webgpu";
import { float, mx_noise_float, positionWorld, vec3 } from "three/tsl";

import { makeCastMat, type TimeUniform } from "./scene-mat";

export function buildBranch(
  origin: THREE.Vector3,
  dir: THREE.Vector3,
  len: number,
  col: THREE.Color,
  uTime: TimeUniform,
  depth = 0,
  seed = 0,
): THREE.Group {
  const grp = new THREE.Group();
  const N = 20;
  const pts: THREE.Vector3[] = [];
  const up = new THREE.Vector3(0, 0.12 * (1 - depth * 0.03), 0);
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const wob = 0.018 * (1 - t) * (1 - depth * 0.3);
    pts.push(
      origin
        .clone()
        .add(dir.clone().multiplyScalar(t * len))
        .add(up.clone().multiplyScalar(t * (1 - t) * 2.4))
        .add(
          new THREE.Vector3(
            wob * Math.sin(t * Math.PI * 3.4 + seed * 2.2),
            0,
            wob * Math.cos(t * Math.PI * 2.8 + seed * 1.6),
          ),
        ),
    );
  }
  const path = new THREE.CatmullRomCurve3(pts);
  const r = Math.max(0.007, 0.03 - depth * 0.007);
  const geo = new THREE.TubeGeometry(path, 16, r, 6, false);
  const mat = makeCastMat(
    col,
    uTime,
    0.44 - depth * 0.08,
    0.8 - depth * 0.06,
    0.032 - depth * 0.005,
  );
  grp.add(new THREE.Mesh(geo, mat));

  const endPt = path.getPoint(1.0);
  const nodeR = Math.max(0.01, 0.036 - depth * 0.007);
  const nMat = new THREE.MeshStandardNodeMaterial({
    color: col,
    roughness: 0.05,
    metalness: 0.4,
  });
  const nn = mx_noise_float(
    positionWorld
      .mul(5.5)
      .add(vec3(float(seed % 3.14), uTime.mul(0.25), float(depth + 0.5))),
  )
    .mul(0.5)
    .add(0.5);
  nMat.emissiveNode = vec3(
    float(col.r).mul(nn),
    float(col.g).mul(nn),
    float(col.b).mul(nn),
  );
  const nodeMesh = new THREE.Mesh(new THREE.SphereGeometry(nodeR, 8, 8), nMat);
  nodeMesh.position.copy(endPt);
  grp.add(nodeMesh);

  if (depth < 2) {
    const subCount = depth === 0 ? 3 : 2;
    for (let s = 0; s < subCount; s++) {
      const bt = 0.35 + s * (0.25 / (subCount - 0.5));
      const bPt = path.getPoint(Math.min(bt, 0.9));
      const bTan = path.getTangent(Math.min(bt, 0.9));
      const right = new THREE.Vector3(
        -bTan.z,
        0.05 + s * 0.04,
        bTan.x,
      ).normalize();
      const subAng = (s / subCount) * Math.PI * 1.6 + seed * 0.7 + depth * 1.2;
      const subDir = new THREE.Vector3(
        Math.cos(subAng) * right.x - Math.sin(subAng) * bTan.z,
        right.y,
        Math.cos(subAng) * right.z + Math.sin(subAng) * bTan.x,
      ).normalize();
      const subLen = len * (0.38 - depth * 0.06);
      grp.add(
        buildBranch(
          bPt,
          subDir,
          subLen,
          col.clone().multiplyScalar(0.88 + depth * 0.04),
          uTime,
          depth + 1,
          seed * 2.3 + s * 6.1 + depth * 11.4,
        ),
      );
    }
  }
  return grp;
}
