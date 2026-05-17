/**
 * app/play/agent-town/agent-town/types.ts — Types + tunables for
 * the agent-town simulation.
 *
 * Extracted from agent-town-client.tsx per ARCHITECTURE.md Rule 1.
 */

import type { CastMemberId } from "lib/cast";

export const TILE = 32;
export const COLS = 24;
export const ROWS = 16;
export const W = TILE * COLS;
export const H = TILE * ROWS;
export const PAD = 4;
export const FRAME_MS = 1000 / 24;

export type Shape =
  | "circle"
  | "diamond"
  | "star"
  | "cross"
  | "triangle"
  | "hex"
  | "square";

export type Status = "idle" | "working" | "thinking" | "speaking";

export type Room = {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  fill: string;
};

export type Townie = {
  id: CastMemberId;
  name: string;
  role: string;
  colour: string;
  glow: string;
  shape: Shape;
  status: Status;
  task: string;
  mood: string;
  home: { x: number; y: number; w: number; h: number };
};

export type Sim = {
  id: CastMemberId;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  wanderTimer: number;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
};

export type LogLine = { ts: string; text: string };
