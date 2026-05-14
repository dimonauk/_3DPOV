/**
 * app/spatial/spatial-demo-pipeline.ts — Per-image pipeline for the 2D→3D demo.
 *
 * Pure functions: decode the dropped file, run depth, generate a stereo pair,
 * paint the depth map and convert ImageData → HTMLCanvasElement for display.
 * The React surface owns lifecycle (phase state, error handling).
 */

import {
  estimateDepth,
  type DepthSupport,
} from "lib/capabilities/viz/depth-estimation";
import { generateStereoPairFromElement } from "lib/capabilities/viz/stereo-pair";

export type { DepthSupport };

export type Result = {
  imageBitmap: ImageBitmap;
  depthCanvas: HTMLCanvasElement;
  leftCanvas: HTMLCanvasElement;
  rightCanvas: HTMLCanvasElement;
  parallaxPx: number;
  inferenceMs: number;
};

export function paintDepth(
  depth: Float32Array,
  w: number,
  h: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const img = ctx.createImageData(w, h);
  for (let i = 0; i < depth.length; i++) {
    const v = depth[i] ?? 0;
    const r = Math.round(20 + v * 235);
    const g = Math.round(10 + v * 90);
    const b = Math.round(40 + v * 195);
    img.data[i * 4] = r;
    img.data[i * 4 + 1] = g;
    img.data[i * 4 + 2] = b;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

export function imageDataToCanvas(data: ImageData): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = data.width;
  canvas.height = data.height;
  canvas.getContext("2d")?.putImageData(data, 0, 0);
  return canvas;
}

/** Phase-callback signature lets the caller advance UI between stages. */
export type StageReporter = (
  stage: "loading-image" | "running-depth" | "running-stereo",
) => void;

export async function runDepthPipeline(
  file: File,
  onStage: StageReporter,
): Promise<Result> {
  onStage("loading-image");
  const bitmap = await createImageBitmap(file);
  onStage("running-depth");
  const depth = await estimateDepth(bitmap);
  onStage("running-stereo");
  const pair = generateStereoPairFromElement(
    bitmap,
    depth.depthMap,
    depth.width,
    depth.height,
  );
  return {
    imageBitmap: bitmap,
    depthCanvas: paintDepth(depth.depthMap, depth.width, depth.height),
    leftCanvas: imageDataToCanvas(pair.left),
    rightCanvas: imageDataToCanvas(pair.right),
    parallaxPx: pair.averageParallaxPx,
    inferenceMs: depth.inferenceMs,
  };
}
