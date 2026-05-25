/**
 * lib/studio/print-export/camera.ts — Camera math + browser yield.
 *
 *   aimCamera: yaw/pitch → lookAt direction
 *   horizontalToVerticalFovDeg: studio stores horizontal FOV;
 *     three.PerspectiveCamera takes vertical
 *   yieldToBrowser: between-tile breather so React can repaint
 */

import * as THREE from "three";

import type { Keyframe } from "lib/studio/types";

export function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    type IdleCb = (cb: () => void) => void;
    const w = window as unknown as { requestIdleCallback?: IdleCb };
    if (typeof w.requestIdleCallback === "function") {
      w.requestIdleCallback(() => resolve());
    } else {
      window.setTimeout(resolve, 0);
    }
  });
}

export function aimCamera(
  camera: THREE.PerspectiveCamera,
  keyframe: Keyframe,
): void {
  const yawR = THREE.MathUtils.degToRad(keyframe.yaw);
  const pitchR = THREE.MathUtils.degToRad(keyframe.pitch);
  const dir = new THREE.Vector3(
    Math.cos(pitchR) * Math.sin(yawR),
    Math.sin(pitchR),
    -Math.cos(pitchR) * Math.cos(yawR),
  );
  camera.lookAt(dir);
}

/**
 * Three.js's PerspectiveCamera.fov is the *vertical* FOV. The studio
 * stores horizontal FOV (matches operator intuition). Convert before
 * we install it on the camera.
 */
export function horizontalToVerticalFovDeg(
  hFovDeg: number,
  aspectWOverH: number,
): number {
  const hFovR = THREE.MathUtils.degToRad(hFovDeg);
  const vFovR = 2 * Math.atan(Math.tan(hFovR / 2) / aspectWOverH);
  return THREE.MathUtils.radToDeg(vFovR);
}
