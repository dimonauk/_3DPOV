/**
 * lib/studio/print-export.ts — high-resolution reframe → print-grade
 * raster export for the Holoflow Studio.
 *
 * # Role
 *
 * Pure (non-React) renderer that produces an A4 / A3 / A2 image at
 * 150–300 PPI from the studio's equirect source + the active Keyframe.
 *
 * # Why a separate module
 *
 * The viewport <Canvas> in EquirectViewer is bounded by the operator's
 * window — usually ~1600 px on the long edge. Print quality on
 * Dimona's Canon imagePROGRAF PRO-1100 needs 4961×7016 (A2 @ 300 PPI).
 * We render to an offscreen WebGL context instead of resizing the live
 * viewport, so the editor stays interactive while the print render
 * grinds, and so we can blow past the visible-canvas size.
 *
 * # The tile problem
 *
 * ~40 % of consumer GPUs cap the WebGL drawing-buffer at 4096×4096
 * (GL_MAX_VIEWPORT_DIMS / GL_MAX_RENDERBUFFER_SIZE). A2 @ 300 PPI
 * exceeds that. We work around it with `Camera.setViewOffset()` — it
 * lets the same scene be sliced into N tiles that, glued together,
 * are the same image as one impossible mega-render. We pick 2048
 * (safe on every GPU we've seen) when the target is over 4096 px on
 * either edge.
 *
 * # The source-coverage problem
 *
 * Reframing an 8K equirect at FOV 75° pulls roughly 1600 px of source
 * pixels into the output. If the print target is 4961 px wide, the
 * upscale ratio is ~3×, which is past the point where "render bigger"
 * helps — beyond that you're inventing detail. The `sourceCoverage*`
 * helpers below quantify this so the UI can route the operator to
 * Topaz Photo AI before they print a mush.
 *
 * # Posture
 *
 * Foundation. v0 emits PNG only — TIFF needs the `tiff` npm package
 * which is intentionally not added yet (see the format guard). v0
 * runs on the main thread; the OffscreenCanvas + Web-Worker path is
 * detected and noted so it can land later without a caller change.
 */

import * as THREE from "three";

import type { Keyframe, SourceAsset } from "lib/studio/types";

// ───────────────────────────────────────────────────────────────────────
// Spec types
// ───────────────────────────────────────────────────────────────────────

export type PaperSize = "A4" | "A3" | "A2";
export type PrintPpi = 150 | 200 | 220 | 300;
export type PrintFormat = "png" | "tiff";
export type PrintOrientation = "landscape" | "portrait";

export type PrintSpec = {
  paperSize: PaperSize;
  ppi: PrintPpi;
  format: PrintFormat;
  orientation: PrintOrientation;
};

export type PrintExportOpts = {
  /** The source asset. Must be an equirect image or video (others throw). */
  source: SourceAsset;
  /** Active keyframe — yaw / pitch / fov drive the reframe. */
  keyframe: Keyframe;
  /** Paper size, PPI, format, orientation. */
  spec: PrintSpec;
  /** Optional progress callback — fires once per tile completed. 0–1. */
  onProgress?: (ratio: number) => void;
  /** Optional abort signal for cancellation between tiles. */
  signal?: AbortSignal;
};

export type CoverageReport = {
  /**
   * Effective source-pixel width contributing to the rendered crop.
   * Derived from the equirect width and the active horizontal FOV.
   */
  effectiveSourcePx: number;
  /**
   * coverage = effectiveSourcePx / targetWidth. 1.0 means the print
   * has exactly as many pixels of real detail as the print needs.
   * Anything <1.0 means the renderer will be interpolating.
   */
  coverage: number;
  /**
   * Suggested external upscale factor to bring coverage to 1.0.
   * Caller pipes this into the Topaz Photo AI handoff copy.
   */
  upscaleFactor: number;
  /** True when the renderer will be inventing detail. */
  needsUpscale: boolean;
};

// ───────────────────────────────────────────────────────────────────────
// Pure helpers — exported so the panel can show "4961 × 7016" + warnings
// without spinning up a WebGL context.
// ───────────────────────────────────────────────────────────────────────

const PAPER_SIZES_INCHES: Record<PaperSize, { w: number; h: number }> = {
  // ISO 216 — short × long inches.
  A4: { w: 8.27, h: 11.69 },
  A3: { w: 11.69, h: 16.54 },
  A2: { w: 16.54, h: 23.39 },
};

export function paperSizeInches(paper: PaperSize): { w: number; h: number } {
  return PAPER_SIZES_INCHES[paper];
}

/**
 * Convert paper + PPI + orientation to target pixel dimensions.
 *
 *   targetPixelDimensions("A2", 300, "landscape") → { w: 7016, h: 4961 }
 *   targetPixelDimensions("A2", 300, "portrait")  → { w: 4961, h: 7016 }
 */
export function targetPixelDimensions(
  paper: PaperSize,
  ppi: PrintPpi,
  orientation: PrintOrientation,
): { w: number; h: number } {
  const { w: shortIn, h: longIn } = paperSizeInches(paper);
  const shortPx = Math.round(shortIn * ppi);
  const longPx = Math.round(longIn * ppi);
  if (orientation === "landscape") return { w: longPx, h: shortPx };
  return { w: shortPx, h: longPx };
}

/**
 * Fraction of the print's pixel budget that's backed by real source
 * detail. 1.0 = perfect; <1.0 = the renderer must interpolate.
 *
 * The math: a full equirect is 360° wide. If the source is 8192 px
 * wide and the operator is reframing at 75° horizontally, the crop
 * carries 8192 * (75 / 360) ≈ 1707 source pixels of real detail. If
 * the print target is 4961 px wide, coverage = 1707 / 4961 ≈ 0.34.
 */
export function sourceCoverageFraction(
  sourceWidthPx: number,
  fovDeg: number,
): number {
  if (sourceWidthPx <= 0 || fovDeg <= 0) return 0;
  return (sourceWidthPx * fovDeg) / 360;
}

/**
 * Given a source-width × FOV pull and a target print width, return the
 * upscale factor needed to bring coverage to 1.0. Useful for the Topaz
 * Photo AI prompt: "set Photo AI to upscale 3.1×".
 */
export function recommendUpscaleFactor(
  sourceCoverage: number,
  targetWidth: number,
): number {
  if (sourceCoverage <= 0 || targetWidth <= 0) return 1;
  return Math.max(1, targetWidth / sourceCoverage);
}

/**
 * One-shot coverage report — what the panel uses to decide whether to
 * show the "upscale needed" banner.
 */
export function coverageReport(
  sourceWidthPx: number,
  fovDeg: number,
  targetWidth: number,
): CoverageReport {
  const effectiveSourcePx = sourceCoverageFraction(sourceWidthPx, fovDeg);
  const coverage = targetWidth > 0 ? effectiveSourcePx / targetWidth : 0;
  const upscaleFactor = recommendUpscaleFactor(effectiveSourcePx, targetWidth);
  return {
    effectiveSourcePx: Math.round(effectiveSourcePx),
    coverage,
    upscaleFactor,
    needsUpscale: coverage < 0.95,
  };
}

// ───────────────────────────────────────────────────────────────────────
// Renderer
// ───────────────────────────────────────────────────────────────────────

const SAFE_TILE_PX = 2048;
const SINGLE_PASS_LIMIT_PX = 4096;

type CanvasSurface =
  | { kind: "offscreen"; canvas: OffscreenCanvas; ctx: OffscreenCanvasRenderingContext2D }
  | { kind: "html"; canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D };

/**
 * Detect whether we can route the heavy work to an OffscreenCanvas. We
 * still need the rest of the worker plumbing before this returns true
 * outside the main thread — v0 keeps everything on the main thread but
 * uses OffscreenCanvas as the compositing target when available because
 * `convertToBlob` is the cleanest PNG-encode path we have.
 */
function detectOffscreen(): boolean {
  if (typeof OffscreenCanvas === "undefined") return false;
  try {
    const probe = new OffscreenCanvas(2, 2);
    // Some older browsers ship the class but not the `convertToBlob` method.
    // Cast through unknown — Next 15's bundled lib.dom doesn't list it on
    // every target.
    const c = probe as unknown as {
      convertToBlob?: (init?: { type?: string }) => Promise<Blob>;
    };
    return typeof c.convertToBlob === "function";
  } catch {
    return false;
  }
}

function makeSurface(width: number, height: number): CanvasSurface {
  if (detectOffscreen()) {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      return { kind: "offscreen", canvas, ctx };
    }
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("print-export: failed to create 2D compositing context");
  }
  return { kind: "html", canvas, ctx };
}

async function surfaceToBlob(
  surface: CanvasSurface,
  format: PrintFormat,
): Promise<Blob> {
  if (format === "tiff") {
    // v0: TIFF is gated until the `tiff` npm package is added. The
    // panel disables this branch, but guard here too so a caller
    // passing it programmatically gets a clear error.
    throw new Error(
      "print-export: TIFF output not yet wired (needs the `tiff` npm package).",
    );
  }
  if (surface.kind === "offscreen") {
    const c = surface.canvas as unknown as {
      convertToBlob: (init?: { type?: string }) => Promise<Blob>;
    };
    return c.convertToBlob({ type: "image/png" });
  }
  return new Promise<Blob>((resolve, reject) => {
    surface.canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("print-export: canvas.toBlob returned null"));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}

/**
 * Load an equirect image source into a THREE.Texture suitable for the
 * inside-of-sphere material. Mirrors EquirectViewer's loader settings.
 */
function loadEquirectTexture(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.minFilter = THREE.LinearFilter;
        t.magFilter = THREE.LinearFilter;
        resolve(t);
      },
      undefined,
      (err) => reject(err instanceof Error ? err : new Error(String(err))),
    );
  });
}

/**
 * For an equirect video, grab the current frame as an in-memory canvas
 * texture. (We don't hold the video element open — the print export is
 * a one-shot operation.)
 */
function loadVideoFrameTexture(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = url;
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.addEventListener("loadeddata", () => {
      const off = document.createElement("canvas");
      off.width = video.videoWidth;
      off.height = video.videoHeight;
      const ctx = off.getContext("2d");
      if (!ctx) {
        reject(new Error("print-export: 2D context unavailable for video frame"));
        return;
      }
      ctx.drawImage(video, 0, 0);
      const t = new THREE.CanvasTexture(off);
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter = THREE.LinearFilter;
      t.magFilter = THREE.LinearFilter;
      video.pause();
      video.src = "";
      resolve(t);
    });
    video.addEventListener("error", () => {
      reject(new Error("print-export: video frame load failed"));
    });
  });
}

function yieldToBrowser(): Promise<void> {
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

function aimCamera(
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
 * Three.js's `PerspectiveCamera.fov` is the *vertical* FOV. The studio
 * stores horizontal FOV (matches operator intuition). Convert before
 * we install it on the camera.
 */
function horizontalToVerticalFovDeg(
  hFovDeg: number,
  aspectWOverH: number,
): number {
  const hFovR = THREE.MathUtils.degToRad(hFovDeg);
  const vFovR = 2 * Math.atan(Math.tan(hFovR / 2) / aspectWOverH);
  return THREE.MathUtils.radToDeg(vFovR);
}

/**
 * Main entry point — render the active keyframe at the spec'd print
 * resolution and return a PNG (or TIFF, once wired) Blob.
 */
export async function renderForPrint(opts: PrintExportOpts): Promise<Blob> {
  const { source, keyframe, spec, onProgress, signal } = opts;

  if (source.kind !== "equirect-image" && source.kind !== "equirect-video") {
    throw new Error(
      `print-export: source kind '${source.kind}' isn't supported. Stitch / convert to equirect first.`,
    );
  }

  const target = targetPixelDimensions(spec.paperSize, spec.ppi, spec.orientation);

  // ── 1. WebGL renderer at tile size ────────────────────────────────────
  const useTiles =
    Math.max(target.w, target.h) > SINGLE_PASS_LIMIT_PX;
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

  // ── 2. Scene + texture ────────────────────────────────────────────────
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

  // ── 3. Camera ──────────────────────────────────────────────────────────
  const aspect = target.w / target.h;
  const vFov = horizontalToVerticalFovDeg(keyframe.fov, aspect);
  const camera = new THREE.PerspectiveCamera(vFov, aspect, 0.1, 1000);
  camera.position.set(0, 0, 0.0001);
  aimCamera(camera, keyframe);

  // ── 4. Compositing surface ────────────────────────────────────────────
  const surface = makeSurface(target.w, target.h);

  // ── 5. Tile loop ──────────────────────────────────────────────────────
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

        // Paint this tile onto the compositing surface at (offsetX, offsetY).
        // Note the Y flip: WebGL has origin bottom-left; canvas top-left.
        // Three's domElement reports its content already flipped to match
        // CSS, so a direct drawImage works.
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

        // Yield between tiles so the React tree can update — without this
        // the print render blocks the event loop for seconds at a stretch.
        await yieldToBrowser();
      }
    }

    return await surfaceToBlob(surface, spec.format);
  } finally {
    // Drop the GPU resources the moment we're done.
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
