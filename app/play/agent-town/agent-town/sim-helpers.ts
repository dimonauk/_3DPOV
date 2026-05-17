/**
 * app/play/agent-town/agent-town/sim-helpers.ts — Pure helpers for
 * the simulation: HH:MM:SS timestamp, home-rectangle → wander bounds,
 * random-in-range.
 *
 * Extracted from agent-town-client.tsx per ARCHITECTURE.md Rule 1.
 */

import { PAD, TILE } from "./types";
import type { Townie } from "./types";

export function timestamp(): string {
  return new Date().toLocaleTimeString("en-GB", { hour12: false });
}

export function boundsForHome(home: Townie["home"]) {
  const minX = (home.x + 1) * TILE + PAD;
  const maxX = (home.x + home.w - 1) * TILE - PAD;
  const minY = (home.y + 1) * TILE + PAD;
  const maxY = (home.y + home.h - 1) * TILE - PAD;
  return {
    minX: Math.min(minX, maxX),
    maxX: Math.max(minX, maxX),
    minY: Math.min(minY, maxY),
    maxY: Math.max(minY, maxY),
  };
}

export function randomIn(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
