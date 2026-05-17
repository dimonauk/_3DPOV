/**
 * app/atelier/light-weaver/light-weaver/types.ts — Shader/tip keys
 * + the head-driver handle the scene mutates each frame.
 *
 * Extracted from light-weaver-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import * as THREE from "three";

export type ShaderKey =
  | "flame"
  | "plasma"
  | "aurora"
  | "mycelium"
  | "ink"
  | "neon";

export type TipKey = "sphere" | "crystal" | "torus" | "icosahedron";

export const TIP_LABELS: Record<TipKey, string> = {
  sphere: "Sphere",
  crystal: "Crystal",
  torus: "Torus",
  icosahedron: "Icosahedron",
};

export interface HeadDriverHandle {
  position: THREE.Vector3;
  speed: number;
}
