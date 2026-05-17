/**
 * app/play/agent-town/agent-town/canvas-draw.ts — Pure Canvas 2D
 * drawing helpers: townie shapes (with halo), floor wash with
 * scanlines, room rectangles + labels, faint background grid.
 *
 * Extracted from agent-town-client.tsx per ARCHITECTURE.md Rule 1.
 */

import { ROOMS } from "./roster";
import { H, TILE, W, type Shape } from "./types";

export function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  colour: string,
  glow: string,
) {
  ctx.save();
  // halo
  ctx.fillStyle = glow;
  ctx.globalAlpha = 0.12;
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // body
  ctx.fillStyle = colour;
  ctx.strokeStyle = glow;
  ctx.lineWidth = 1.4;

  switch (shape) {
    case "circle":
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    case "diamond":
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(7, 0);
      ctx.lineTo(0, 7);
      ctx.lineTo(-7, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case "star": {
      const n = 5;
      const outer = 7;
      const inner = 3.2;
      ctx.beginPath();
      for (let i = 0; i < n * 2; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = (Math.PI / n) * i - Math.PI / 2;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "triangle":
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(6, 5);
      ctx.lineTo(-6, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case "cross":
      ctx.fillRect(-2, -7, 4, 14);
      ctx.fillRect(-7, -2, 14, 4);
      break;
    case "hex": {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = ((Math.PI * 2) / 6) * i - Math.PI / 2;
        const x = Math.cos(a) * 7;
        const y = Math.sin(a) * 7;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "square":
    default:
      ctx.fillRect(-5, -6, 10, 12);
      ctx.strokeRect(-5, -6, 10, 12);
      break;
  }
  ctx.restore();
}

export function drawFloor(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, W, H);
  // scanlines for the synthwave clinical look
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  for (let y = 0; y < H; y += 4) {
    ctx.fillRect(0, y, W, 1);
  }
}

export function drawRooms(ctx: CanvasRenderingContext2D) {
  ctx.font = "9px ui-monospace, Menlo, monospace";
  for (const room of ROOMS) {
    const rx = room.x * TILE;
    const ry = room.y * TILE;
    const rw = room.w * TILE;
    const rh = room.h * TILE;
    ctx.fillStyle = room.fill;
    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeStyle = "rgba(0, 243, 255, 0.28)";
    ctx.lineWidth = 1;
    ctx.strokeRect(rx + 0.5, ry + 0.5, rw - 1, rh - 1);
    ctx.fillStyle = "rgba(0, 243, 255, 0.35)";
    ctx.fillText(room.label, rx + 6, ry + 12);
  }
}

export function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = "rgba(0, 243, 255, 0.05)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= W; x += TILE) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, H);
  }
  for (let y = 0; y <= H; y += TILE) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(W, y + 0.5);
  }
  ctx.stroke();
}
