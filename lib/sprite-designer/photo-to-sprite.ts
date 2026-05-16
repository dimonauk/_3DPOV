/**
 * lib/sprite-designer/photo-to-sprite.ts — Photo → sprite pipeline.
 *
 * Loads an image, downsamples with K-Centroid (smarter than nearest-neighbour
 * for AI-generated pixel art), then maps each pixel to the nearest palette
 * colour. In-process; no extra dependency.
 */

import { kCentroid } from "./kcentroid";

export async function photoToSprite(
  file: File,
  dstW: number,
  dstH: number,
  paletteHex: string[],
): Promise<ImageData> {
  const img = await loadImage(file);
  const fit = fitInside(img.width, img.height, dstW * 16, dstH * 16);
  const c = document.createElement("canvas");
  c.width = fit.w;
  c.height = fit.h;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, fit.w, fit.h);
  const src = ctx.getImageData(0, 0, fit.w, fit.h);
  const { centroid } = kCentroid(src, dstW, dstH, 4, 4);
  return snapToPalette(centroid, paletteHex);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function fitInside(w: number, h: number, maxW: number, maxH: number) {
  const scale = Math.min(maxW / w, maxH / h, 1);
  return { w: Math.round(w * scale), h: Math.round(h * scale) };
}

function snapToPalette(img: ImageData, paletteHex: string[]): ImageData {
  const pal = paletteHex.map(hexToRgb);
  const out = new Uint8ClampedArray(img.data.length);
  for (let i = 0; i < img.data.length; i += 4) {
    const r = img.data[i];
    const g = img.data[i + 1];
    const b = img.data[i + 2];
    let best = 0;
    let bestD = Infinity;
    for (let p = 0; p < pal.length; p++) {
      const dr = r - pal[p][0];
      const dg = g - pal[p][1];
      const db = b - pal[p][2];
      const d = dr * dr + dg * dg + db * db;
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    out[i] = pal[best][0];
    out[i + 1] = pal[best][1];
    out[i + 2] = pal[best][2];
    out[i + 3] = 255;
  }
  return new ImageData(out, img.width, img.height);
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}
