/**
 * lib/capabilities/viz/scout/types.ts — Scout report shape.
 *
 * A "scout" assesses how suitable a source file is for Gaussian-splat /
 * photogrammetry reconstruction before the user commits to a full run.
 * Produced either by the desktop bench sidecar (full, OpenCV-driven) or by
 * the in-process metadata heuristic (scout-web).
 */

export type ScoutSeverity = "info" | "warn" | "error";

export interface ScoutIssue {
  /** How much this should worry the user. */
  severity: ScoutSeverity;
  /** Where the issue lives (e.g. "file", "resolution", "duration"). */
  where: string;
  /** What the problem is, in plain language. */
  what: string;
  /** Concrete, actionable next step. */
  action: string;
}

export type ScoutVerdict = "good" | "usable" | "poor" | "unsuitable" | "unknown";

export interface ScoutReport {
  /** One-paragraph human summary. */
  summary: string;
  /** Findings, most severe first. */
  issues: ScoutIssue[];
  /** Overall verdict for quick UI badges. */
  verdict: ScoutVerdict;
  /** 0–100 suitability score. */
  score: number;
  /** Detected media kind. */
  kind: "video" | "image" | "unknown";
  /** Echo of the source identifier the scout examined. */
  source: string;
  /** Which engine produced this report. */
  via: "bench" | "metadata";
}
