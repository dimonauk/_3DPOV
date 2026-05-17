/**
 * app/atelier/inverse-kata/inverse-kata/canvas-draw.ts — Pure
 * Canvas 2D helpers: rounded polyline + endpoint dot.
 *
 * Extracted from inverse-kata-client.tsx per ARCHITECTURE.md Rule 1.
 */

import type { Vec2 } from "lib/capabilities/inverse-kata/match";

export function drawPolyline(
  ctx: CanvasRenderingContext2D,
  points: Vec2[],
  colour: string,
  width: number,
) {
  if (points.length === 0) return;
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  const first = points[0]!;
  ctx.moveTo(first[0], first[1]);
  for (let i = 1; i < points.length; i++) {
    const p = points[i]!;
    ctx.lineTo(p[0], p[1]);
  }
  ctx.stroke();
}

export function drawDot(
  ctx: CanvasRenderingContext2D,
  point: Vec2,
  colour: string,
) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(point[0], point[1], 4, 0, Math.PI * 2);
  ctx.fill();
}
