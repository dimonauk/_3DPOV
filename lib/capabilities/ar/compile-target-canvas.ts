/**
 * lib/capabilities/ar/compile-target-canvas.ts — sharp-backed
 * FakeCanvas + SharpImage for mind-ar's tracking-feature extractor.
 *
 * Split from compile-target.server.ts. The whole point of this file
 * is to provide the minimal "canvas" surface mind-ar walks during
 * pyramid-level downscaling — drawImage + getImageData — without
 * pulling the broken native `canvas` package. See parent file's
 * header for the full context.
 */

import "server-only";

import sharp from "sharp";

import type {
  CompileArTargetError,
} from "./compile-target";

export function asCompileError(
  code: CompileArTargetError["code"],
  message: string,
): Error {
  const detail: CompileArTargetError = { code, message };
  return Object.assign(new Error(message), detail);
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

export type RgbaImage = { rgba: Uint8ClampedArray; width: number; height: number };

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

export class FakeCanvas {
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

export class SharpImage {
  public rgba: Uint8ClampedArray;
  public width: number;
  public height: number;

  constructor(rgba: Uint8ClampedArray, width: number, height: number) {
    this.rgba = rgba;
    this.width = width;
    this.height = height;
  }
}

export async function decodeWithSharp(bytes: Uint8Array): Promise<SharpImage> {
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

export async function fetchImageBytes(
  url: string,
): Promise<{ bytes: Uint8Array; mimeType: string }> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch (err) {
    throw asCompileError(
      "image-fetch-failed",
      `network error fetching ${url}: ${(err as Error).message}`,
    );
  }
  if (!res.ok) {
    throw asCompileError(
      "image-fetch-failed",
      `${res.status} ${res.statusText} fetching ${url}`,
    );
  }
  const buf = await res.arrayBuffer();
  const mimeType = res.headers.get("content-type") ?? "image/png";
  return { bytes: new Uint8Array(buf), mimeType };
}
