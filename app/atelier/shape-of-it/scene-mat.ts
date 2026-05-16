/**
 * app/atelier/shape-of-it/scene-mat.ts
 *
 * TSL material helpers shared by every geometry system in the scene.
 * Two factories:
 *   - makeCastMat: a thick transmissive physical material with a
 *     noise-modulated emissive tint, used for chambers and chamber
 *     passages.
 *   - makeRootsAlong: stitches a small fan of root tubes onto the base
 *     of a Catmull-Rom path. The same helper covers both the spine
 *     root-splay and each thread's foot.
 *
 * Loaded dynamically by scene.ts; safe to top-level import three/webgpu.
 */

import * as THREE from "three/webgpu";
import {
  float,
  mx_noise_float,
  positionWorld,
  uniform,
  vec3,
} from "three/tsl";

export type TimeUniform = ReturnType<typeof uniform>;

export function makeCastMat(
  col: THREE.Color,
  uTime: TimeUniform,
  trans = 0.52,
  opa = 0.88,
  emAmt = 0.038,
): THREE.MeshPhysicalNodeMaterial {
  const mat = new THREE.MeshPhysicalNodeMaterial({
    color: col.clone().multiplyScalar(0.48),
    roughness: 0.16,
    metalness: 0.06,
    transmission: trans,
    thickness: 0.32,
    ior: 1.46,
    transparent: true,
    side: THREE.DoubleSide,
    opacity: opa,
  });
  const np = positionWorld
    .mul(3.8)
    .add(vec3(float(col.r * 7), uTime.mul(0.07), float(col.b * 5)));
  const n = mx_noise_float(np).mul(0.5).add(0.5);
  mat.emissiveNode = vec3(
    float(col.r * emAmt).mul(n),
    float(col.g * emAmt).mul(n),
    float(col.b * emAmt).mul(n),
  );
  return mat;
}

export function makeRootsAlong(
  group: THREE.Group,
  path: THREE.CatmullRomCurve3,
  radius: number,
  material: THREE.Material,
  count: number,
  depth: number,
  spread: number,
  glowMat: THREE.Material | null = null,
  color: THREE.Color | null = null,
): void {
  const basePt = path.getPoint(0);
  const baseTan = path.getTangent(0);
  for (let ri = 0; ri < count; ri++) {
    const wireOut = baseTan.clone().negate().normalize();
    const angle = (ri / count) * Math.PI * 2 + Math.random() * 0.5;
    const radialOut = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const down = new THREE.Vector3(0, -1, 0);

    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const t2 = t * t;
      const push = t * (1 - t) * spread * 2.5;
      const drop = t2 * depth;
      const p = basePt
        .clone()
        .add(wireOut.clone().multiplyScalar(t * depth * 0.2))
        .add(radialOut.clone().multiplyScalar(push))
        .add(down.clone().multiplyScalar(drop));
      p.x += Math.sin(t * 12 + angle) * 0.05 * t;
      p.z += Math.cos(t * 13 - angle) * 0.05 * t;
      pts.push(p);
    }
    const rootPath = new THREE.CatmullRomCurve3(pts);
    const rootGeo = new THREE.TubeGeometry(
      rootPath,
      16,
      radius * (0.3 + Math.random() * 0.4),
      5,
      false,
    );

    if (color) {
      const vertC: number[] = [];
      const posCount = rootGeo.attributes.position?.count ?? 0;
      for (let i = 0; i < posCount; i++) {
        vertC.push(color.r, color.g, color.b);
      }
      rootGeo.setAttribute("color", new THREE.Float32BufferAttribute(vertC, 3));
    }

    group.add(new THREE.Mesh(rootGeo, material));
    if (glowMat) {
      group.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(rootPath, 16, radius * 1.5, 4, false),
          glowMat,
        ),
      );
    }
  }
}
