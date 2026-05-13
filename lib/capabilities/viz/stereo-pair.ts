/**
 * lib/capabilities/viz/stereo-pair.ts — Capability `viz.stereo-pair`:
 * depth-warped left/right eye image synthesis.
 *
 * One-line role: given a source image and its per-pixel depth map, produce a parallax-shifted stereo pair the viewer can fuse into 3D.
 * Full purpose in stereo-pair.PURPOSE.md.
 *
 * Pure math; no async; no DOM beyond ImageData. The second leg of the
 * "tap any photo to see it in 3D" wedge — `viz.depth-estimation`
 * provides the depth, this capability turns it into renderable views.
 */

export type StereoOptions = {
  /** Interpupillary distance baseline in scene units. Default 0.064 (real IPD). */
  baselineMeters?: number;
  /** Multiplier for how much the depth map pushes pixels apart. Default 1.0. */
  depthScale?: number;
  /** Pixels to inpaint at occlusion edges via simple horizontal hole-fill. Default 4. */
  inpaintRadius?: number;
};

export type StereoPair = {
  left: ImageData;
  right: ImageData;
  width: number;
  height: number;
  /** Average parallax in pixels — diagnostic for tuning. */
  averageParallaxPx: number;
};

const DEFAULT_BASELINE_METERS = 0.064;
const DEFAULT_DEPTH_SCALE = 1.0;
const DEFAULT_INPAINT_RADIUS = 4;
/** Depth value (0..1) that maps to zero parallax — pixels at this depth sit on the screen plane. */
const FOCAL_PLANE = 0.5;

/** Sample the depth map at (sx, sy) where coords may sit in a smaller buffer than the source image. */
function sampleDepth(
  depthMap: Float32Array,
  depthWidth: number,
  depthHeight: number,
  x: number,
  y: number,
  srcWidth: number,
  srcHeight: number,
): number {
  if (depthWidth === srcWidth && depthHeight === srcHeight) {
    const v = depthMap[y * depthWidth + x];
    return v ?? FOCAL_PLANE;
  }
  // Nearest-neighbour resample. Cheap; the warp is the expensive bit.
  const dx = Math.min(
    depthWidth - 1,
    Math.max(0, Math.floor((x * depthWidth) / srcWidth)),
  );
  const dy = Math.min(
    depthHeight - 1,
    Math.max(0, Math.floor((y * depthHeight) / srcHeight)),
  );
  const v = depthMap[dy * depthWidth + dx];
  return v ?? FOCAL_PLANE;
}

/** Write one RGBA sample from source into destination at column `col`. */
function writePixel(
  src: Uint8ClampedArray,
  dst: Uint8ClampedArray,
  mask: Uint8Array,
  srcIdx: number,
  dstIdx: number,
  maskIdx: number,
): void {
  dst[dstIdx] = src[srcIdx] ?? 0;
  dst[dstIdx + 1] = src[srcIdx + 1] ?? 0;
  dst[dstIdx + 2] = src[srcIdx + 2] ?? 0;
  dst[dstIdx + 3] = src[srcIdx + 3] ?? 255;
  mask[maskIdx] = 1;
}

/**
 * Fill horizontal gaps in a warped image. For each unmasked pixel, scan
 * left and right up to `radius` pixels for the nearest filled neighbour
 * and average them. Cheap occlusion repair; good enough for the stereo
 * fusion to land.
 */
function inpaintHoles(
  data: Uint8ClampedArray,
  mask: Uint8Array,
  width: number,
  height: number,
  radius: number,
): void {
  if (radius <= 0) return;
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      if (mask[row + x] === 1) continue;
      let leftIdx = -1;
      for (let k = 1; k <= radius && x - k >= 0; k++) {
        if (mask[row + (x - k)] === 1) {
          leftIdx = (row + (x - k)) * 4;
          break;
        }
      }
      let rightIdx = -1;
      for (let k = 1; k <= radius && x + k < width; k++) {
        if (mask[row + (x + k)] === 1) {
          rightIdx = (row + (x + k)) * 4;
          break;
        }
      }
      const dstIdx = (row + x) * 4;
      if (leftIdx >= 0 && rightIdx >= 0) {
        data[dstIdx] = (((data[leftIdx] ?? 0) + (data[rightIdx] ?? 0)) >> 1) as number;
        data[dstIdx + 1] = (((data[leftIdx + 1] ?? 0) + (data[rightIdx + 1] ?? 0)) >> 1) as number;
        data[dstIdx + 2] = (((data[leftIdx + 2] ?? 0) + (data[rightIdx + 2] ?? 0)) >> 1) as number;
        data[dstIdx + 3] = 255;
      } else if (leftIdx >= 0) {
        data[dstIdx] = data[leftIdx] ?? 0;
        data[dstIdx + 1] = data[leftIdx + 1] ?? 0;
        data[dstIdx + 2] = data[leftIdx + 2] ?? 0;
        data[dstIdx + 3] = 255;
      } else if (rightIdx >= 0) {
        data[dstIdx] = data[rightIdx] ?? 0;
        data[dstIdx + 1] = data[rightIdx + 1] ?? 0;
        data[dstIdx + 2] = data[rightIdx + 2] ?? 0;
        data[dstIdx + 3] = 255;
      }
    }
  }
}

function warp(
  source: ImageData,
  depthMap: Float32Array,
  depthWidth: number,
  depthHeight: number,
  parallaxFactor: number,
  inpaintRadius: number,
): { image: ImageData; totalParallax: number; samples: number } {
  const { width, height, data: src } = source;
  const dst = new Uint8ClampedArray(width * height * 4);
  const mask = new Uint8Array(width * height);
  let totalParallax = 0;
  let samples = 0;
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      const d = sampleDepth(
        depthMap,
        depthWidth,
        depthHeight,
        x,
        y,
        width,
        height,
      );
      const p = (d - FOCAL_PLANE) * parallaxFactor;
      const targetX = Math.round(x + p);
      if (targetX < 0 || targetX >= width) continue;
      const srcIdx = (row + x) * 4;
      const dstIdx = (row + targetX) * 4;
      writePixel(src, dst, mask, srcIdx, dstIdx, row + targetX);
      totalParallax += Math.abs(p);
      samples++;
    }
  }
  inpaintHoles(dst, mask, width, height, inpaintRadius);
  return {
    image: new ImageData(dst, width, height),
    totalParallax,
    samples,
  };
}

function runStereoPair(
  source: ImageData,
  depthMap: Float32Array,
  depthWidth: number,
  depthHeight: number,
  options: StereoOptions,
): StereoPair {
  const baseline = options.baselineMeters ?? DEFAULT_BASELINE_METERS;
  const depthScale = options.depthScale ?? DEFAULT_DEPTH_SCALE;
  const inpaintRadius = options.inpaintRadius ?? DEFAULT_INPAINT_RADIUS;
  const { width, height } = source;
  // Parallax in pixels per unit-depth-offset. Baseline is in scene
  // units (metres); we treat the image width as the screen plane so
  // the baseline directly scales to a fraction of the frame.
  const parallaxFactor = baseline * depthScale * width;
  // Each eye gets half the parallax — right shifts +p/2, left shifts
  // -p/2 (negate the factor).
  const right = warp(source, depthMap, depthWidth, depthHeight, parallaxFactor / 2, inpaintRadius);
  const left = warp(source, depthMap, depthWidth, depthHeight, -parallaxFactor / 2, inpaintRadius);
  const totalSamples = right.samples + left.samples;
  const averageParallaxPx =
    totalSamples > 0
      ? (right.totalParallax + left.totalParallax) / totalSamples
      : 0;
  return { left: left.image, right: right.image, width, height, averageParallaxPx };
}

/**
 * Pure function. Generates left + right eye images from a source image
 * and its depth map. Uses depth-weighted horizontal warp with simple
 * occlusion hole-filling. Output: 2D canvas-ready ImageData.
 */
export function generateStereoPair(
  source: ImageData,
  depthMap: Float32Array,
  options: StereoOptions = {},
): StereoPair {
  return runStereoPair(source, depthMap, source.width, source.height, options);
}

function elementToImageData(
  source: HTMLCanvasElement | HTMLImageElement | ImageBitmap,
): ImageData {
  if (typeof HTMLCanvasElement !== "undefined" && source instanceof HTMLCanvasElement) {
    const ctx = source.getContext("2d");
    if (!ctx) throw new Error("viz.stereo-pair: 2D context unavailable");
    return ctx.getImageData(0, 0, source.width, source.height);
  }
  const w =
    "naturalWidth" in source && source.naturalWidth > 0
      ? source.naturalWidth
      : source.width;
  const h =
    "naturalHeight" in source && source.naturalHeight > 0
      ? source.naturalHeight
      : source.height;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("viz.stereo-pair: 2D context unavailable");
  ctx.drawImage(source as CanvasImageSource, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

/** Convenience: source from a Canvas or Image element. */
export function generateStereoPairFromElement(
  source: HTMLCanvasElement | HTMLImageElement | ImageBitmap,
  depthMap: Float32Array,
  depthWidth: number,
  depthHeight: number,
  options: StereoOptions = {},
): StereoPair {
  const imageData = elementToImageData(source);
  return runStereoPair(imageData, depthMap, depthWidth, depthHeight, options);
}
