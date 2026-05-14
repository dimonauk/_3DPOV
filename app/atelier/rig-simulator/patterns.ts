/**
 * Source-pattern generators for the POV rig simulator.
 *
 * One-line role: produce procedural RGB images the simulator decomposes
 * into vertical slices and feeds to the LED array as it spins.
 *
 * Each function returns a Uint8ClampedArray of length width × height × 3.
 */

import type { Pattern } from "./hardware";

/** Generate a procedural test pattern as a 2D RGB image. */
export function makePattern(
  kind: Pattern,
  width: number,
  height: number,
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      const u = x / (width - 1);
      const v = y / (height - 1);
      const [r, g, b] = renderPixel(kind, u, v);
      data[idx] = Math.round(r * 255);
      data[idx + 1] = Math.round(g * 255);
      data[idx + 2] = Math.round(b * 255);
    }
  }
  return data;
}

function renderPixel(
  kind: Pattern,
  u: number,
  v: number,
): readonly [number, number, number] {
  if (kind === "spectrum") return renderSpectrum(u, v);
  if (kind === "wedges") return renderWedges(u, v);
  if (kind === "studio-logo") return renderStudioBars(u, v);
  return renderChecker(u, v);
}

function renderSpectrum(u: number, v: number): readonly [number, number, number] {
  // Full-saturation hue ramp across X, brightness ramp across Y.
  const h = u * 360;
  const c = 1 - Math.abs(v - 0.5) * 1.6;
  const cl = Math.max(0, c);
  const [rr, gg, bb] = hsl(h, 1, 0.5);
  return [rr * cl, gg * cl, bb * cl];
}

function renderWedges(u: number, v: number): readonly [number, number, number] {
  // Eight angular wedges with bright pink edges — a kata-shape pattern.
  const seg = Math.floor(u * 8) % 8;
  const intensity = Math.sin(v * Math.PI);
  const palette: ReadonlyArray<readonly [number, number, number]> = [
    [1, 0.4, 0.9],
    [0.2, 0.2, 0.2],
    [1, 0.8, 0.2],
    [0.2, 0.2, 0.2],
    [0.4, 0.9, 1],
    [0.2, 0.2, 0.2],
    [1, 0.4, 0.4],
    [0.2, 0.2, 0.2],
  ];
  const entry = palette[seg] ?? palette[0]!;
  return [entry[0] * intensity, entry[1] * intensity, entry[2] * intensity];
}

function renderStudioBars(u: number, v: number): readonly [number, number, number] {
  // A studio-pink-and-mint vertical bar pattern that hits at multiple heights.
  void u;
  const bar = (v > 0.1 && v < 0.4) || (v > 0.6 && v < 0.9) ? 1 : 0;
  const hue = v < 0.5 ? 320 : 170;
  const [rr, gg, bb] = hsl(hue, 1, 0.5);
  return [rr * bar, gg * bar, bb * bar];
}

function renderChecker(u: number, v: number): readonly [number, number, number] {
  const cell = (Math.floor(u * 16) + Math.floor(v * 16)) % 2;
  return [cell, cell, cell];
}

function hsl(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [r + m, g + m, b + m];
}
