/**
 * app/spatial/spatial-demo-actions.ts — Export/commission actions for the
 * 2D→3D demo. Pure functions that take a `Result` and side-effect on the
 * DOM (download anchor, AR Quick Look launch) or hit the SHARP service.
 */

import {
  exportStereoToUsdz,
  openInARQuickLook,
} from "lib/capabilities/viz/usdz-export";
import { exportSpatialPhoto } from "lib/capabilities/viz/spatial-export";
import { submitSharpJob } from "lib/capabilities/commerce/sharp-job";

import type { Result } from "./spatial-demo-pipeline";

function readPair(result: Result) {
  return {
    left: result.leftCanvas
      .getContext("2d")!
      .getImageData(0, 0, result.leftCanvas.width, result.leftCanvas.height),
    right: result.rightCanvas
      .getContext("2d")!
      .getImageData(0, 0, result.rightCanvas.width, result.rightCanvas.height),
    width: result.leftCanvas.width,
    height: result.leftCanvas.height,
    averageParallaxPx: result.parallaxPx,
  };
}

export async function openInAR(result: Result): Promise<void> {
  const blob = await exportStereoToUsdz(readPair(result));
  openInARQuickLook(blob, "spatial");
}

export async function downloadSBS(result: Result): Promise<void> {
  const blob = await exportSpatialPhoto(readPair(result), { format: "sbs-mp4" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `spatial-sbs-${Date.now()}.mp4`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export async function commissionSharp(result: Result): Promise<string> {
  const blob = await new Promise<Blob>((resolve) => {
    const c = document.createElement("canvas");
    c.width = result.imageBitmap.width;
    c.height = result.imageBitmap.height;
    c.getContext("2d")?.drawImage(result.imageBitmap, 0, 0);
    c.toBlob((b) => resolve(b!), "image/jpeg", 0.95);
  });
  const handle = await submitSharpJob({ imageBlob: blob });
  return handle.jobId;
}
