/**
 * components/type3d/mesh-scene/render-frame.ts
 *
 * One-frame render pass: camera follows the viewer pose (lerped),
 * each registered glyph group is re-parked to its anchor element's
 * current rect, then the renderer flushes scene + camera.
 *
 * Pure: takes refs in, mutates Three.js objects, no React. The
 * provider calls this from inside its rAF loop.
 */

import { rectToSceneCoords } from "lib/type3d/sdf-text";

import {
  CAMERA_BASE_Z,
  CAMERA_LERP,
  FOV_DEG,
  type GlyphRegistration,
  type RendererInstance,
  type ViewerPose,
} from "./types";

export type RenderFrameInputs = {
  renderer: RendererInstance;
  scene: import("three").Scene;
  camera: import("three").PerspectiveCamera;
  registrations: ReadonlySet<GlyphRegistration>;
  viewerPose: ViewerPose | null;
  startTime: number;
};

export function renderFrame(inputs: RenderFrameInputs): void {
  const { renderer, scene, camera, registrations, viewerPose, startTime } =
    inputs;
  const elapsed = (performance.now() - startTime) / 1000;

  // Camera follows the viewer pose when one is available; otherwise
  // it stays nailed to the base position. Lerp keeps the motion
  // soft so a jittery tracking source doesn't shake the text.
  if (viewerPose) {
    const targetX = viewerPose.x * 0.4;
    const targetY = viewerPose.y * 0.25;
    const targetZ = CAMERA_BASE_Z - viewerPose.z * 0.6;
    camera.position.x += (targetX - camera.position.x) * CAMERA_LERP;
    camera.position.y += (targetY - camera.position.y) * CAMERA_LERP;
    camera.position.z += (targetZ - camera.position.z) * CAMERA_LERP;
    camera.lookAt(0, 0, 0);
  } else {
    camera.position.x += (0 - camera.position.x) * CAMERA_LERP;
    camera.position.y += (0 - camera.position.y) * CAMERA_LERP;
    camera.position.z += (CAMERA_BASE_Z - camera.position.z) * CAMERA_LERP;
  }

  // Re-park each registered glyph group. Cheap — the rect read is a
  // layout-warm GBR call and the position write is one vector mutation.
  for (const reg of registrations) {
    const rect = reg.getRect();
    if (!rect) continue;
    const coords = rectToSceneCoords({
      rect,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      cameraZ: CAMERA_BASE_Z,
      fovDeg: FOV_DEG,
    });
    const group = reg.group as {
      position: { set: (x: number, y: number, z: number) => void };
      scale: { setScalar: (s: number) => void };
    };
    group.position.set(coords.x, coords.y, 0);
    group.scale.setScalar(1);
    reg.tick?.(elapsed);
  }

  const result = renderer.render(scene, camera);
  if (result && typeof (result as Promise<void>).then === "function") {
    (result as Promise<void>).catch(() => {
      /* let the next frame retry */
    });
  }
}
