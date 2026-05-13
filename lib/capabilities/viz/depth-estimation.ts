/**
 * lib/capabilities/viz/depth-estimation.ts — Capability `viz.depth-estimation`:
 * single-image monocular depth via Depth Anything V2.
 *
 * One-line role: take any 2D image, return a normalised per-pixel depth map (0..1, 1 = nearest) using a Hugging Face Transformers.js pipeline.
 * Full purpose in depth-estimation.PURPOSE.md.
 *
 * Powers the studio's "tap any photo to see it in 3D" wedge. The first
 * call downloads ~50MB of ONNX model weights; subsequent calls reuse the
 * cached pipeline instance at module scope.
 *
 * Box 3 lift: model is `onnx-community/depth-anything-v2-small`
 * (Apache-2.0), inferred via `@huggingface/transformers` v4. We own no
 * weights and no inference code — only the routing + normalisation.
 */

import { pipeline } from "@huggingface/transformers";

export type DepthBackend = "webgpu" | "webgl" | "wasm";

export type DepthEstimationOptions = {
  /** Force a specific backend. Default: best available (webgpu > webgl > wasm). */
  backend?: DepthBackend;
  /** Hugging Face model id. Default: "onnx-community/depth-anything-v2-small". */
  modelId?: string;
};

export type DepthSupport = {
  webgpu: boolean;
  webgl: boolean;
  recommendedBackend: DepthBackend;
  /** Whether the studio recommends running depth estimation on this device.
   *  False on iOS Safari ≤25 (WebGPU absent + WASM is too slow). */
  recommended: boolean;
  /** Human-readable reason when recommended is false. */
  reason?: string;
};

export type DepthEstimationResult = {
  /** Per-pixel depth, normalised 0..1 (1 = nearest). Row-major. */
  depthMap: Float32Array;
  width: number;
  height: number;
  inferenceMs: number;
  backend: DepthBackend;
};

const DEFAULT_MODEL_ID = "onnx-community/depth-anything-v2-small";

/** Cache one pipeline instance per (modelId, backend) so subsequent calls reuse it. */
type LoadedPipeline = { call: (input: unknown) => Promise<unknown> };
const PIPELINE_CACHE = new Map<string, Promise<LoadedPipeline>>();

function detectWebGPU(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

function detectWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const ctx =
      canvas.getContext("webgl2") ?? canvas.getContext("webgl") ?? null;
    return ctx !== null;
  } catch {
    return false;
  }
}

function detectIOSSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
  return isIOS && isSafari;
}

/** Probe device support. Pure / cheap; safe to call on page load. */
export function probeDepthSupport(): DepthSupport {
  const webgpu = detectWebGPU();
  const webgl = detectWebGL();
  const recommendedBackend: DepthBackend = webgpu
    ? "webgpu"
    : webgl
      ? "webgl"
      : "wasm";
  if (!webgpu && detectIOSSafari()) {
    return {
      webgpu,
      webgl,
      recommendedBackend,
      recommended: false,
      reason:
        "WebGPU required; WASM fallback is too slow for production use",
    };
  }
  return { webgpu, webgl, recommendedBackend, recommended: true };
}

/** Resolve the requested backend, falling back if unsupported. */
function resolveBackend(requested?: DepthBackend): DepthBackend {
  if (requested === "webgpu" && detectWebGPU()) return "webgpu";
  if (requested === "webgl" && detectWebGL()) return "webgl";
  if (requested === "wasm") return "wasm";
  if (!requested) return probeDepthSupport().recommendedBackend;
  // Requested an unsupported backend — fall through to best available.
  return probeDepthSupport().recommendedBackend;
}

/** Map our public backend to a Transformers.js device string. */
function deviceFor(backend: DepthBackend): "webgpu" | "wasm" {
  // Transformers.js v4 has no "webgl" execution provider — webgl
  // selection is honoured for device-tier signalling, but inference
  // routes through WASM (which can use SIMD + threads on most devices).
  return backend === "webgpu" ? "webgpu" : "wasm";
}

async function loadPipeline(
  modelId: string,
  backend: DepthBackend,
): Promise<LoadedPipeline> {
  const key = `${modelId}::${backend}`;
  const cached = PIPELINE_CACHE.get(key);
  if (cached) return cached;
  const promise = (async () => {
    const pipe = (await pipeline("depth-estimation", modelId, {
      device: deviceFor(backend),
    })) as unknown as (input: unknown) => Promise<unknown>;
    return { call: pipe };
  })();
  PIPELINE_CACHE.set(key, promise);
  try {
    return await promise;
  } catch (err) {
    PIPELINE_CACHE.delete(key);
    throw err;
  }
}

/** Convert ImageBitmap / HTMLImageElement to an HTMLCanvasElement. */
function toCanvas(
  image: ImageBitmap | HTMLImageElement | HTMLCanvasElement,
): HTMLCanvasElement {
  if (typeof HTMLCanvasElement !== "undefined" && image instanceof HTMLCanvasElement) {
    return image;
  }
  const width =
    "naturalWidth" in image && image.naturalWidth > 0
      ? image.naturalWidth
      : image.width;
  const height =
    "naturalHeight" in image && image.naturalHeight > 0
      ? image.naturalHeight
      : image.height;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("viz.depth-estimation: 2D context unavailable");
  ctx.drawImage(image as CanvasImageSource, 0, 0, width, height);
  return canvas;
}

type RawDepthOutput = {
  predicted_depth: { data: Float32Array; dims: number[] };
};

/** Normalise depth tensor to 0..1 with 1 = nearest (invert min/max). */
function normaliseDepth(raw: Float32Array): Float32Array {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < raw.length; i++) {
    const v = raw[i];
    if (v === undefined) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min;
  const out = new Float32Array(raw.length);
  if (range <= 0) return out;
  // Depth Anything outputs larger = closer. Normalise then keep
  // orientation (1 = nearest).
  for (let i = 0; i < raw.length; i++) {
    const v = raw[i];
    out[i] = v === undefined ? 0 : (v - min) / range;
  }
  return out;
}

/**
 * Run Depth Anything V2 on the image. First call downloads ~50MB model;
 * cached via IndexedDB / service worker for subsequent calls. Returns
 * normalised depth (0..1, 1 = closest to camera).
 */
export async function estimateDepth(
  image: ImageBitmap | HTMLImageElement | HTMLCanvasElement,
  options: DepthEstimationOptions = {},
): Promise<DepthEstimationResult> {
  const modelId = options.modelId ?? DEFAULT_MODEL_ID;
  const backend = resolveBackend(options.backend);
  const pipe = await loadPipeline(modelId, backend);
  const canvas = toCanvas(image);
  const started =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  const result = (await pipe.call(canvas)) as RawDepthOutput;
  const ended =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  const dims = result.predicted_depth.dims;
  // dims may be [h, w] or [1, h, w] depending on the model variant.
  const height = dims.length === 2 ? (dims[0] ?? 0) : (dims[1] ?? 0);
  const width = dims.length === 2 ? (dims[1] ?? 0) : (dims[2] ?? 0);
  const depthMap = normaliseDepth(result.predicted_depth.data);
  return {
    depthMap,
    width,
    height,
    inferenceMs: ended - started,
    backend,
  };
}

/** Preload the model so the first user-facing inference is fast. Optional. */
export async function warmupDepthModel(
  options: Pick<DepthEstimationOptions, "modelId" | "backend"> = {},
): Promise<void> {
  const modelId = options.modelId ?? DEFAULT_MODEL_ID;
  const backend = resolveBackend(options.backend);
  await loadPipeline(modelId, backend);
}
