/**
 * app/atelier/shape-of-it/scene-labyrinth.ts
 *
 * Builds the knowledge and life rings (two concentric Russian-doll
 * labyrinths), the edges between their nodes, the synthesis arcs that
 * cross from knowledge to life through the mound core, and the joint
 * sparks that mark each arc's midpoint.
 *
 * Loaded dynamically by scene.ts.
 */

import * as THREE from "three/webgpu";
import {
  float,
  mx_fractal_noise_float,
  mx_noise_float,
  positionWorld,
  vec3,
} from "three/tsl";

import { Y_BOTTOM, Y_RANGE } from "lib/shape-of-it/chambers";
import {
  KNOW_EDGES,
  KNOW_NODES,
  LIFE_EDGES,
  LIFE_NODES,
  R_KNOW_INNER,
  R_KNOW_OUTER,
  R_LIFE_INNER,
  R_LIFE_OUTER,
  SYNTH_ARCS,
  type LabEdge,
  type LabNode,
} from "lib/shape-of-it/labyrinth";

import type { TimeUniform } from "./scene-mat";

const Y_HALF = Y_RANGE * 0.28;

export type NodeRef = {
  mesh: THREE.Mesh;
  node: LabNode;
  basePos: THREE.Vector3;
};

export type LabyrinthBuildResult = {
  group: THREE.Group;
  labNodeMeshes: THREE.Mesh[];
  synthMeshes: THREE.Mesh[];
  knowGroup: THREE.Group;
  lifeGroup: THREE.Group;
  knowNodeRefs: NodeRef[];
  lifeNodeRefs: NodeRef[];
};

function nodeWorldPos(
  node: LabNode,
  rOuter: number,
  rInner: number,
): THREE.Vector3 {
  const r = node.tier === 0 ? rOuter : rInner;
  const yNorm = node.id / (node.tier === 0 ? 6 : 3);
  const y = Y_BOTTOM + Y_RANGE * 0.08 + yNorm * Y_HALF * 1.4;
  return new THREE.Vector3(
    Math.cos(node.ang) * r,
    y,
    Math.sin(node.ang) * r,
  );
}

function buildRing(
  nodes: LabNode[],
  edges: LabEdge[],
  rOuter: number,
  rInner: number,
  uTime: TimeUniform,
): { labGroup: THREE.Group; nodeMeshes: NodeRef[] } {
  const labGroup = new THREE.Group();
  const nodeMeshes: NodeRef[] = [];

  nodes.forEach((node, ni) => {
    const pos = nodeWorldPos(node, rOuter, rInner);
    const col = new THREE.Color(node.col[0], node.col[1], node.col[2]);
    const r = node.tier === 0 ? 0.065 : 0.048;
    const geo = new THREE.SphereGeometry(r, 10, 10);
    const mat = new THREE.MeshStandardNodeMaterial({
      color: col,
      roughness: 0.05,
      metalness: 0.5,
    });
    const np = positionWorld
      .mul(5.5)
      .add(vec3(float(ni * 1.1), uTime.mul(0.28 + ni * 0.04), float(node.ang)));
    const nn = mx_noise_float(np).mul(0.5).add(0.5);
    mat.emissiveNode = vec3(
      float(col.r).mul(nn.mul(1.2)),
      float(col.g).mul(nn.mul(1.2)),
      float(col.b).mul(nn.mul(1.2)),
    );
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.userData = { labNode: node };
    labGroup.add(mesh);
    nodeMeshes.push({ mesh, node, basePos: pos.clone() });

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(r * 3.5, 8, 8),
      new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0.04,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    halo.position.copy(pos);
    labGroup.add(halo);
  });

  edges.forEach(([a, b]) => {
    if (a >= nodes.length || b >= nodes.length) return;
    const na = nodes[a]!;
    const nb = nodes[b]!;
    const pA = nodeWorldPos(na, rOuter, rInner);
    const pB = nodeWorldPos(nb, rOuter, rInner);
    const mid = pA.clone().add(pB).multiplyScalar(0.5).multiplyScalar(0.88);
    const ca = new THREE.Color(na.col[0], na.col[1], na.col[2]);
    const cb = new THREE.Color(nb.col[0], nb.col[1], nb.col[2]);
    const ec = ca.clone().lerp(cb, 0.5);
    const edgePath = new THREE.QuadraticBezierCurve3(pA, mid, pB);
    const eGeo = new THREE.TubeGeometry(edgePath, 18, 0.006, 4, false);
    labGroup.add(
      new THREE.Mesh(
        eGeo,
        new THREE.MeshBasicMaterial({
          color: ec,
          transparent: true,
          opacity: 0.3,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      ),
    );
    labGroup.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(edgePath, 12, 0.018, 4, false),
        new THREE.MeshBasicMaterial({
          color: ec,
          transparent: true,
          opacity: 0.042,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      ),
    );
  });

  return { labGroup, nodeMeshes };
}

export function buildLabyrinthSystem(
  uTime: TimeUniform,
): LabyrinthBuildResult {
  const group = new THREE.Group();
  const knowResult = buildRing(
    KNOW_NODES,
    KNOW_EDGES,
    R_KNOW_OUTER,
    R_KNOW_INNER,
    uTime,
  );
  const lifeResult = buildRing(
    LIFE_NODES,
    LIFE_EDGES,
    R_LIFE_OUTER,
    R_LIFE_INNER,
    uTime,
  );
  group.add(knowResult.labGroup);
  group.add(lifeResult.labGroup);

  const synthGroup = new THREE.Group();
  group.add(synthGroup);
  const synthMeshes: THREE.Mesh[] = [];

  SYNTH_ARCS.forEach(([ki, li, label], si) => {
    if (ki >= KNOW_NODES.length || li >= LIFE_NODES.length) return;
    const kn = KNOW_NODES[ki]!;
    const ln = LIFE_NODES[li]!;
    const pK = nodeWorldPos(kn, R_KNOW_OUTER, R_KNOW_INNER);
    const pL = nodeWorldPos(ln, R_LIFE_OUTER, R_LIFE_INNER);
    const ctrl = new THREE.Vector3(
      (pK.x + pL.x) * 0.05,
      (pK.y + pL.y) * 0.5 + (si - 5) * 0.15,
      (pK.z + pL.z) * 0.05,
    );
    const ck = new THREE.Color(kn.col[0], kn.col[1], kn.col[2]);
    const cl = new THREE.Color(ln.col[0], ln.col[1], ln.col[2]);
    const sc = ck.clone().lerp(cl, 0.5);
    const sPath = new THREE.QuadraticBezierCurve3(pK, ctrl, pL);
    const sGeo = new THREE.TubeGeometry(sPath, 28, 0.007, 4, false);

    const sMat = new THREE.MeshStandardNodeMaterial({
      color: sc,
      roughness: 0.1,
      metalness: 0.4,
      transparent: true,
      opacity: 0.65,
    });
    const sp = positionWorld
      .mul(3.5)
      .add(vec3(float(si * 0.7), uTime.mul(0.55 + si * 0.08), float(si * 0.4)));
    const sn = mx_fractal_noise_float(sp, 2, 2.0, 0.5, 1.0).mul(0.5).add(0.5);
    sMat.emissiveNode = vec3(
      float(sc.r).mul(sn.mul(1.6)),
      float(sc.g).mul(sn.mul(1.6)),
      float(sc.b).mul(sn.mul(1.6)),
    );
    const sMesh = new THREE.Mesh(sGeo, sMat);
    sMesh.userData = { synthLabel: label, si };
    synthGroup.add(sMesh);
    synthMeshes.push(sMesh);

    const jMat = new THREE.MeshStandardNodeMaterial({
      color: new THREE.Color(0.9, 0.9, 1.0),
      roughness: 0.0,
      metalness: 0.6,
    });
    const jp = positionWorld
      .mul(4.0)
      .add(vec3(float(si * 1.5), uTime.mul(1.1), float(si * 0.7)));
    const jn = mx_noise_float(jp).mul(0.5).add(0.5);
    jMat.emissiveNode = vec3(jn.mul(3.0), jn.mul(3.0), jn.mul(3.5));
    const jMesh = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), jMat);
    jMesh.position.copy(sPath.getPoint(0.5));
    synthGroup.add(jMesh);
  });

  return {
    group,
    labNodeMeshes: [
      ...knowResult.nodeMeshes.map((r) => r.mesh),
      ...lifeResult.nodeMeshes.map((r) => r.mesh),
    ],
    synthMeshes,
    knowGroup: knowResult.labGroup,
    lifeGroup: lifeResult.labGroup,
    knowNodeRefs: knowResult.nodeMeshes,
    lifeNodeRefs: lifeResult.nodeMeshes,
  };
}
