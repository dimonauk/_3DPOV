/**
 * app/atelier/poi-sculptor/anchor-player.ts
 *
 * Drives the trail group's centre along a Catmull-Rom spline so the
 * sculpture moves through space while the local poi spin continues.
 *
 * Loaded dynamically — imports `three` at module top level.
 */

import * as THREE from "three/webgpu";

import type { AnchorPath } from "lib/poi-sculptor/anchor-paths";
import { ANCHOR_PATHS } from "lib/poi-sculptor/anchor-paths";

export class AnchorPlayer {
  private curve: THREE.CatmullRomCurve3 | null = null;
  private t = 0;
  private currentPath = "static";
  speed = 0.18;

  constructor(initialPathId = "static") {
    this.setPath(initialPathId);
  }

  setPath(id: string): void {
    const def: AnchorPath =
      ANCHOR_PATHS.find((p) => p.id === id) ?? ANCHOR_PATHS[0]!;
    if (def.pts.length < 2) {
      this.curve = null;
    } else {
      this.curve = new THREE.CatmullRomCurve3(
        def.pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
        true,
      );
    }
    this.t = 0;
    this.currentPath = id;
  }

  update(dt: number): void {
    if (!this.curve) return;
    const len = this.curve.getLength();
    if (len < 0.001) return;
    this.t = (this.t + (this.speed * dt) / len) % 1;
  }

  getAnchor(target = new THREE.Vector3()): THREE.Vector3 {
    if (!this.curve) return target.set(0, 0, 0);
    return this.curve.getPointAt(this.t, target);
  }

  getCurrentPathId(): string {
    return this.currentPath;
  }
}
