/**
 * app/atelier/inverse-kata/inverse-kata/types.ts — Canvas + result
 * state types for the inverse-kata chamber.
 *
 * Extracted from inverse-kata-client.tsx per ARCHITECTURE.md Rule 1.
 */

import type {
  InverseKataResult,
  Vec2,
} from "lib/capabilities/inverse-kata/match";

export type OrchestratedSegment = {
  kataSlug: string;
  labanEffort: string;
  durationMs: number;
  confidence: number;
  rationale: string;
};

export type OrchestratorResult = {
  sequence: OrchestratedSegment[];
  agreementWithPhaseA: "confirms" | "refines" | "disagrees";
  overallReasoning: string;
  uncertainSegments: number[];
};

export type OrchestratorState =
  | { kind: "idle" }
  | { kind: "thinking" }
  | { kind: "ready"; result: OrchestratorResult }
  | { kind: "error"; message: string };

export type State =
  | { kind: "idle" }
  | { kind: "drawing"; points: Vec2[]; timing: number[]; startMs: number }
  | { kind: "matching"; points: Vec2[]; timing: number[] }
  | {
      kind: "ready";
      points: Vec2[];
      timing: number[];
      result: InverseKataResult;
    }
  | { kind: "error"; message: string };

export const CANVAS_WIDTH = 720;
export const CANVAS_HEIGHT = 480;
export const POINT_SAMPLE_PIXEL_THRESHOLD = 4;
