/**
 * lib/algorithms/lsystem-tube.ts — Lindenmayer-grammar 3D tube tree.
 *
 * Ported in the spirit of D:\The_Hangar\Dolly_OS\src\systems\jewel-array\
 * geometry\algorithms\algo_08_LSystemTube.ts. The worker path and the
 * three-preset rule table are dropped; we keep a single
 * Honda-style grammar (`F → F[+F][-F][/F][\F]F`) and interpret the
 * string with a 3D turtle that yaws, pitches, and rolls — the key
 * distinction from `lsystem.ts`, which is a 2D space-colonisation
 * graph with no grammar at all.
 *
 * Visually: a branching coral / sapling read fully in 3D, tubular
 * segments with sphere buds at every branch tip.
 */

import * as THREE from "three";
import {
  type CommonParams,
  type GeneratedMesh,
  attrsOf,
  mergeAll,
  normalise,
  seededRng,
} from "./_base";

export type LSystemTubeParams = CommonParams;

export function defaultParams(): LSystemTubeParams {
  return { seed: 808, complexity: 0.5, scale: 1.0, density: 0.5 };
}

/** Honda-style 3D branching axiom + a single rewrite rule. */
const AXIOM = "F";
const RULE = "F[+F][-F][/F][\\F]F";

function rewrite(iters: number): string {
  let s = AXIOM;
  for (let i = 0; i < iters; i++) {
    let next = "";
    for (const ch of s) next += ch === "F" ? RULE : ch;
    s = next;
  }
  return s;
}

type TurtleState = {
  pos: THREE.Vector3;
  dir: THREE.Vector3;
  up: THREE.Vector3;
  r: number;
  depth: number;
};

/** Rodrigues-style rotation of `v` around `axis` by `angle` radians. */
function rotate(v: THREE.Vector3, axis: THREE.Vector3, angle: number): void {
  v.applyAxisAngle(axis, angle);
}

export function generateGeometry(p: LSystemTubeParams): THREE.BufferGeometry {
  const rng = seededRng(p.seed);
  const iters = 3 + Math.floor(p.complexity * 2);
  const baseAngle = (22 + rng() * 12) * (Math.PI / 180);
  const segLen = 0.11 * p.scale;
  const stemR = 0.028 * p.scale * (0.4 + (p.density ?? 0.5) * 0.9);
  const shrink = 0.7;

  const str = rewrite(iters);

  const geos: THREE.BufferGeometry[] = [];
  const stack: TurtleState[] = [];
  let state: TurtleState = {
    pos: new THREE.Vector3(0, -p.scale * 0.4, 0),
    dir: new THREE.Vector3(0, 1, 0),
    up: new THREE.Vector3(0, 0, 1),
    r: stemR,
    depth: 0,
  };

  // 2000 chars is enough for ~5 iters of the rule above without
  // exhausting the budget; later chars are truncated.
  const limit = Math.min(str.length, 3000);

  for (let i = 0; i < limit; i++) {
    const ch = str[i];
    if (ch === "F") {
      const len = segLen * Math.pow(shrink, state.depth);
      const next = state.pos.clone().addScaledVector(state.dir, len);
      const curve = new THREE.LineCurve3(state.pos, next);
      geos.push(
        new THREE.TubeGeometry(curve, 1, Math.max(state.r, 0.006 * p.scale), 5, false),
      );
      state.pos = next;
    } else if (ch === "+") {
      // Yaw around the up axis.
      rotate(state.dir, state.up, baseAngle + (rng() - 0.5) * 0.08);
    } else if (ch === "-") {
      rotate(state.dir, state.up, -baseAngle + (rng() - 0.5) * 0.08);
    } else if (ch === "/") {
      // Pitch around the local right vector.
      const right = state.dir.clone().cross(state.up).normalize();
      rotate(state.dir, right, baseAngle + (rng() - 0.5) * 0.08);
      rotate(state.up, right, baseAngle);
    } else if (ch === "\\") {
      const right = state.dir.clone().cross(state.up).normalize();
      rotate(state.dir, right, -baseAngle);
      rotate(state.up, right, -baseAngle);
    } else if (ch === "[") {
      stack.push({
        pos: state.pos.clone(),
        dir: state.dir.clone(),
        up: state.up.clone(),
        r: state.r,
        depth: state.depth,
      });
      state.r *= shrink;
      state.depth += 1;
    } else if (ch === "]") {
      // Bud sphere at the branch tip before popping.
      const bud = new THREE.SphereGeometry(state.r * 1.6, 5, 4);
      bud.translate(state.pos.x, state.pos.y, state.pos.z);
      geos.push(bud);
      const popped = stack.pop();
      if (popped) state = popped;
    }
  }

  return normalise(mergeAll(geos), p.scale);
}

export function generate(p: LSystemTubeParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
