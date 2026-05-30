/**
 * lib/studio/print-export/index.ts — High-resolution reframe →
 * print-grade raster export.
 *
 * Composition:
 *   ./types.ts      PaperSize, PrintPpi, PrintFormat, PrintOrientation,
 *                   PrintSpec, PrintExportOpts, CoverageReport
 *   ./coverage.ts   paperSizeInches, targetPixelDimensions,
 *                   sourceCoverageFraction, recommendUpscaleFactor,
 *                   coverageReport (pure pixel math, no WebGL)
 *   ./surface.ts    OffscreenCanvas / HTMLCanvas compositing target,
 *                   PNG encode (TIFF gated until `tiff` npm lands)
 *   ./textures.ts   equirect image + video frame texture loaders
 *   ./camera.ts     aimCamera, horizontalToVerticalFovDeg,
 *                   yieldToBrowser
 *
 * # The tile problem
 *
 * ~40 % of consumer GPUs cap the WebGL drawing-buffer at 4096×4096
 * (GL_MAX_VIEWPORT_DIMS / GL_MAX_RENDERBUFFER_SIZE). A2 @ 300 PPI
 * exceeds that. We work around it with `Camera.setViewOffset()` —
 * the scene is sliced into N tiles that, glued together, are the
 * same image as one impossible mega-render. We pick 2048 (safe on
 * every GPU we've seen) when the target is over 4096 px on either
 * edge.
 *
 * # Posture
 *
 * Foundation. v0 runs on the main thread but uses OffscreenCanvas
 * as the compositing target when available, so the OffscreenCanvas
 * + Web-Worker path can land later without a caller change.
 */

import * as THREE from "three";

import { aimCamera, horizontalToVerticalFovDeg, yieldToBrowser } from "./camera";
import { targetPixelDimensions } from "./coverage";
import {
  SAFE_TILE_PX,
  SINGLE_PASS_LIMIT_PX,
  makeSurface,
  surfaceToBlob,
} from "./surface";
import { loadEquirectTexture, loadVideoFrameTexture } from "./textures";
import type { PrintExportOpts } from "./types";

export {
  paperSizeInches,
  targetPixelDimensions,
  sourceCoverageFraction,
  recommendUpscaleFactor,
  coverageReport,
} from "./coverage";

export type {
  CoverageReport,
  PaperSize,
  PrintExportOpts,
  PrintFormat,
  PrintOrientation,
  PrintPpi,
  PrintSpec,
} from "./types";

/**
 * Render the active keyframe at the spec'd print resolution and
 * return a PNG (or TIFF, once wired) Blob.
 */
export async function renderForPrint(opts: PrintExportOpts): Promise<Blob> {
  const { source, keyframe, spec, onProgress, signal } = opts;

  if (source.kind !== "equirect-image" && source.kind !== "equirect-video") {
    throw new Error(
      `print-export: source kind '${source.kind}' isn't supported. Stitch / convert to equirect first.`,
    );
  }

  const target = targetPixelDimensions(
    spec.paperSize,
    spec.ppi,
    spec.orientation,
  );

  const useTiles = Math.max(target.w, target.h) > SINGLE_PASS_LIMIT_PX;
  const tileMaxW = useTiles ? SAFE_TILE_PX : target.w;
  const tileMaxH = useTiles ? SAFE_TILE_PX : target.h;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
    alpha: false,
  });
  renderer.setPixelRatio(1);
  renderer.setSize(tileMaxW, tileMaxH, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const texture =
    source.kind === "equirect-image"
      ? await loadEquirectTexture(source.objectUrl)
      : await loadVideoFrameTexture(source.objectUrl);

  const scene = new THREE.Scene();
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(500, 64, 32),
    new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
      toneMapped: false,
    }),
  );
  sphere.scale.set(-1, 1, 1);
  scene.add(sphere);

  const aspect = target.w / target.h;
  const vFov = horizontalToVerticalFovDeg(keyframe.fov, aspect);
  const camera = new THREE.PerspectiveCamera(vFov, aspect, 0.1, 1000);
  camera.position.set(0, 0, 0.0001);
  aimCamera(camera, keyframe);

  const surface = makeSurface(target.w, target.h);

  const cols = Math.ceil(target.w / tileMaxW);
  const rows = Math.ceil(target.h / tileMaxH);
  const totalTiles = cols * rows;
  let done = 0;

  try {
    for (let ty = 0; ty < rows; ty++) {
      for (let tx = 0; tx < cols; tx++) {
        if (signal?.aborted) {
          throw new DOMException("aborted", "AbortError");
        }
        const offsetX = tx * tileMaxW;
        const offsetY = ty * tileMaxH;
        const tileW = Math.min(tileMaxW, target.w - offsetX);
        const tileH = Math.min(tileMaxH, target.h - offsetY);

        if (useTiles) {
          // setViewOffset slices the projection matrix so this render
          // covers exactly the tileW × tileH window of the full target.
          camera.setViewOffset(
            target.w,
            target.h,
            offsetX,
            offsetY,
            tileW,
            tileH,
          );
        } else {
          camera.clearViewOffset();
        }
        renderer.setSize(tileW, tileH, false);
        renderer.render(scene, camera);

        // Paint this tile onto the compositing surface. Three's
        // domElement already flips Y to match CSS, so a direct
        // drawImage works.
        surface.ctx.drawImage(
          renderer.domElement,
          0,
          0,
          tileW,
          tileH,
          offsetX,
          offsetY,
          tileW,
          tileH,
        );

        done += 1;
        onProgress?.(done / totalTiles);

        // Yield between tiles so React can repaint and the operator's
        // progress bar moves.
        await yieldToBrowser();
      }
    }

    return await surfaceToBlob(surface, spec.format);
  } finally {
    // Drop GPU resources.
    sphere.geometry.dispose();
    if (Array.isArray(sphere.material)) {
      for (const m of sphere.material) m.dispose();
    } else {
      sphere.material.dispose();
    }
    texture.dispose();
    renderer.dispose();
  }
}
