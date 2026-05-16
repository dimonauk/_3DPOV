/**
 * lib/capabilities/ar/compile-target.server.ts — Server-side wiring for
 * `ar.compile-target`.
 *
 * One-line role: fetch a reference image, compile it via mind-ar's
 * tracking-feature extraction (using a sharp-backed FakeCanvas so we
 * never touch the broken native `canvas` package), upload the resulting
 * `.mind` buffer via the media library, return a typed record.
 *
 * # Why this implementation
 *
 * mind-ar's `OfflineCompiler` imports `canvas` by name. The native
 * `canvas` package is unbuildable on Node 25 + Windows (verified
 * 2026-05-16, prebuilds 404; even the v3 prebuild ships missing five
 * DLLs — see [[holoflow-canvas-server]]). A `Module._resolveFilename`
 * shim that rewrites `canvas → @napi-rs/canvas` only catches CJS
 * imports; mind-ar is ESM, so the shim is a no-op.
 *
 * The fix is to skip `OfflineCompiler` and call mind-ar's lower-level
 * modules directly (`CompilerBase` + `buildTrackingImageList` +
 * `extractTrackingFeatures`). None of those imports `canvas`. We supply
 * our own minimal "canvas" via a `FakeCanvas` class that returns sharp-
 * decoded raw RGBA bytes from `getImageData`. This is the exact pattern
 * `scripts/ar-compile-mind.mjs` proved out in production — promoted from
 * a CLI fall-forward into the in-process capability.
 *
 * # The flow
 *
 *   1. `fetch(imageUrl)` → Uint8Array bytes.
 *   2. `sharp(bytes).ensureAlpha().raw()` → raw RGBA + width/height.
 *   3. Wrap as `SharpImage` + `FakeCanvas`; hand to `SharpOfflineCompiler`.
 *   4. `compiler.compileImageTargets([image], progress)` runs tracking
 *      feature extraction; ~1–3s per A4-size image on a desktop CPU.
 *   5. `compiler.exportData()` → the `.mind` ArrayBuffer.
 *   6. `mediaUpload({ kind: "other", subject: "deploy", … })` persists
 *      to Vercel Blob + Firestore.
 *   7. Return the typed `CompileArTargetResult`.
 *
 * # Single artifact
 *
 * We only produce the `.mind` file — no thumbnail PNG. The source image
 * already exists at `imageUrl`; viewers that want a thumbnail render
 * from that, not a duplicate.
 */

import "server-only";

import sharp from "sharp";

import { createLogger } from "lib/log";

import { mediaUpload } from "../media/library";

import type {
  CompileArTargetError,
  CompileArTargetInput,
  CompileArTargetResult,
} from "./compile-target";

const log = createLogger("capability:ar.compile-target");

function asError(
  code: CompileArTargetError["code"],
  message: string,
): Error {
  const detail: CompileArTargetError = { code, message };
  return Object.assign(new Error(message), detail);
}

async function fetchImageBytes(
  url: string,
): Promise<{ bytes: Uint8Array; mimeType: string }> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch (err) {
    throw asError(
      "image-fetch-failed",
      `network error fetching ${url}: ${(err as Error).message}`,
    );
  }
  if (!res.ok) {
    throw asError(
      "image-fetch-failed",
      `${res.status} ${res.statusText} fetching ${url}`,
    );
  }
  const buf = await res.arrayBuffer();
  const mimeType = res.headers.get("content-type") ?? "image/png";
  return { bytes: new Uint8Array(buf), mimeType };
}

function sanitiseFilenameRoot(label: string | undefined, id: string): string {
  if (!label) return id;
  return label.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || id;
}

// ---------- sharp-backed FakeCanvas (mind-ar's minimal surface) ----------

/**
 * mind-ar's `extractTrackingFeatures` walks pyramid levels by calling
 * `canvas.getContext('2d').drawImage(srcImage, …)` then
 * `getImageData(0, 0, w, h)` on the destination canvas. It only reads
 * `data[i*4 + 0..2]` for RGB; alpha is ignored. So our FakeCanvas just
 * has to remember the last drawn image and return its raw RGBA buffer.
 *
 * `drawImage` accepts the optional resize args `(img, x, y, w, h)`.
 * When called with a destination size that differs from the source, the
 * real Canvas would resample; mind-ar uses this for pyramid downscaling.
 * We resample via sharp on the fly.
 */

type RgbaImage = { rgba: Uint8ClampedArray; width: number; height: number };

class FakeContext {
  private current: RgbaImage | null = null;

  drawImage(
    img: RgbaImage,
    _x: number,
    _y: number,
    targetW?: number,
    targetH?: number,
  ): void {
    if (
      targetW === undefined ||
      targetH === undefined ||
      (targetW === img.width && targetH === img.height)
    ) {
      this.current = img;
      return;
    }
    // Resample. mind-ar only ever requests integer-multiple downscales
    // for its pyramid; a quick nearest/box resample matches what the
    // upstream script does via sharp.
    this.current = nearestResample(img, targetW, targetH);
  }

  getImageData(
    _x: number,
    _y: number,
    w: number,
    h: number,
  ): { data: Uint8ClampedArray; width: number; height: number } {
    const c = this.current;
    if (!c) {
      // mind-ar never asks for getImageData before drawImage — but if it
      // ever did, return zeros rather than crashing.
      return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
    }
    return { data: c.rgba, width: c.width, height: c.height };
  }
}

class FakeCanvas {
  public width: number;
  public height: number;
  private ctx = new FakeContext();

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  getContext(): FakeContext {
    return this.ctx;
  }
}

function nearestResample(
  src: RgbaImage,
  dstW: number,
  dstH: number,
): RgbaImage {
  const dst = new Uint8ClampedArray(dstW * dstH * 4);
  const xRatio = src.width / dstW;
  const yRatio = src.height / dstH;
  for (let y = 0; y < dstH; y++) {
    const sy = Math.min(src.height - 1, Math.floor(y * yRatio));
    for (let x = 0; x < dstW; x++) {
      const sx = Math.min(src.width - 1, Math.floor(x * xRatio));
      const srcIdx = (sy * src.width + sx) * 4;
      const dstIdx = (y * dstW + x) * 4;
      dst[dstIdx] = src.rgba[srcIdx]!;
      dst[dstIdx + 1] = src.rgba[srcIdx + 1]!;
      dst[dstIdx + 2] = src.rgba[srcIdx + 2]!;
      dst[dstIdx + 3] = src.rgba[srcIdx + 3]!;
    }
  }
  return { rgba: dst, width: dstW, height: dstH };
}

// ---------- sharp decode → SharpImage ----------

class SharpImage {
  public rgba: Uint8ClampedArray;
  public width: number;
  public height: number;

  constructor(rgba: Uint8ClampedArray, width: number, height: number) {
    this.rgba = rgba;
    this.width = width;
    this.height = height;
  }
}

async function decodeWithSharp(bytes: Uint8Array): Promise<SharpImage> {
  const result = await sharp(Buffer.from(bytes))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data, info } = result;
  const rgba = new Uint8ClampedArray(
    data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
  );
  return new SharpImage(rgba, info.width, info.height);
}

// ---------- mind-ar lower-level compiler subclass ----------

type ProgressCb = (pct: number) => void;

type CompilerBaseInstance = {
  compileImageTargets: (
    images: readonly RgbaImage[],
    progress: ProgressCb,
  ) => Promise<void>;
  exportData: () => ArrayBuffer | Uint8Array;
};

type CompilerBaseModule = {
  CompilerBase: new () => CompilerBaseInstance;
};

type ImageListModule = {
  buildTrackingImageList: (targetImage: unknown) => unknown[];
};

type ExtractUtilsModule = {
  extractTrackingFeatures: (
    imageList: unknown[],
    progress: () => void,
  ) => unknown;
};

async function buildSharpOfflineCompiler(): Promise<CompilerBaseInstance> {
  // Dynamic imports — keeps mind-ar out of the Next.js client bundle and
  // matches the script's import pattern exactly. Specifier kept as a
  // dynamic string so TypeScript doesn't try to type-resolve mind-ar's
  // internal modules (no published @types/mind-ar).
  const compilerBaseSpec = "mind-ar/src/image-target/compiler-base.js";
  const imageListSpec = "mind-ar/src/image-target/image-list.js";
  const extractUtilsSpec = "mind-ar/src/image-target/tracker/extract-utils.js";
  const cpuKernelsSpec = "mind-ar/src/image-target/detector/kernels/cpu/index.js";

  const [
    { CompilerBase },
    { buildTrackingImageList },
    { extractTrackingFeatures },
  ] = await Promise.all([
    import(compilerBaseSpec) as Promise<CompilerBaseModule>,
    import(imageListSpec) as Promise<ImageListModule>,
    import(extractUtilsSpec) as Promise<ExtractUtilsModule>,
  ]);
  // Side-effect import: registers TF.js CPU kernels.
  await import(cpuKernelsSpec);

  class SharpOfflineCompiler extends CompilerBase {
    createProcessCanvas(img: RgbaImage): FakeCanvas {
      return new FakeCanvas(img.width, img.height);
    }

    compileTrack({
      progressCallback,
      targetImages,
      basePercent,
    }: {
      progressCallback: (pct: number) => void;
      targetImages: unknown[];
      basePercent: number;
    }): Promise<unknown[]> {
      return new Promise((resolve) => {
        const percentPerImage = (100 - basePercent) / targetImages.length;
        let percent = 0;
        const list: unknown[] = [];
        for (let i = 0; i < targetImages.length; i++) {
          const targetImage = targetImages[i];
          const imageList = buildTrackingImageList(targetImage);
          const percentPerAction = percentPerImage / imageList.length;
          const trackingData = extractTrackingFeatures(imageList, () => {
            percent += percentPerAction;
            progressCallback(basePercent + percent);
          });
          list.push(trackingData);
        }
        resolve(list);
      });
    }
  }

  return new SharpOfflineCompiler() as unknown as CompilerBaseInstance;
}

// ---------- Public server entrypoint ----------

/**
 * Server-side compile. Caller must pass `uploadedBy` (the operator's
 * Firebase uid) — matches the media library's auth posture.
 *
 * Throws a typed `CompileArTargetError`-shaped Error on every failure
 * path: `image-fetch-failed`, `image-invalid`, `compile-failed`,
 * `blob-write-failed`.
 */
export async function compileArTargetServer(
  input: CompileArTargetInput,
  ctx: { uploadedBy: string },
): Promise<CompileArTargetResult> {
  const started = Date.now();

  log.info("compile start", {
    imageUrl: input.imageUrl,
    label: input.label,
    recordId: input.recordId,
  });

  const source = await fetchImageBytes(input.imageUrl);

  let image: SharpImage;
  try {
    image = await decodeWithSharp(source.bytes);
  } catch (err) {
    throw asError(
      "image-invalid",
      `sharp decode failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  log.debug("image decoded", { width: image.width, height: image.height });

  let mindBuffer: Uint8Array;
  try {
    const compiler = await buildSharpOfflineCompiler();
    await compiler.compileImageTargets([image], () => {
      /* progress callback — silent for v0; future: stream via SSE */
    });
    const raw = compiler.exportData();
    mindBuffer = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
  } catch (err) {
    log.error("compile failed", {
      imageUrl: input.imageUrl,
      err: err instanceof Error ? err.message : String(err),
    });
    throw asError(
      "compile-failed",
      `mind-ar compile failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const id = input.recordId ?? crypto.randomUUID();
  const filenameRoot = sanitiseFilenameRoot(input.label, id);
  let media;
  try {
    media = await mediaUpload({
      file: mindBuffer,
      filename: `${filenameRoot}.mind`,
      mimeType: "application/octet-stream",
      kind: "other",
      subject: "deploy",
      uploadedBy: ctx.uploadedBy,
      ...(input.label !== undefined && { title: input.label }),
      tags: ["ar-target", "mind-ar"],
    });
  } catch (err) {
    log.error("media upload failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    throw asError(
      "blob-write-failed",
      `media library upload failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const durationSeconds = (Date.now() - started) / 1000;

  log.info("compile done", {
    id: input.recordId ?? media.id,
    mindFileUrl: media.url,
    bytes: mindBuffer.byteLength,
    durationSeconds,
  });

  return {
    id: input.recordId ?? media.id,
    ...(input.label !== undefined && { label: input.label }),
    mindFileUrl: media.url,
    sourceImageUrl: input.imageUrl,
    featureCount: 0, // CompilerBase doesn't surface the count; v1 may parse exportData
    durationSeconds,
    generatedAt: media.uploadedAt,
  };
}
