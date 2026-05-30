/**
 * lib/splatter/types.ts — shared types between the desktop sidecar and
 * the website. Kept hand-rolled (rather than generated from Pydantic) so
 * the website can run with the bench unreachable.
 */

export type Severity = "info" | "warn" | "fail";

export interface ScoutIssue {
  severity: Severity;
  where: string;
  what: string;
  action: string;
}

export interface ScoutPipeline {
  source_kind: "fisheye-pair" | "equirect-video" | "equirect-image-set";
  camera: string;
  frame_fps: number;
  masks: string[];
  sfm: "colmap" | "glomap" | "mast3r";
  trainer: "brush" | "postshot" | "nerfstudio" | "opensplat";
  strategy: "auto" | "fisheye-pair" | "equirect" | "cubemap";
  depth_prior: boolean;
  expected_runtime_seconds: number;
}

export interface ScoutReport {
  summary: string;
  issues: ScoutIssue[];
  recommended_pipeline: ScoutPipeline | null;
}

export interface PreflightScorecard {
  verdict: "go" | "warn" | "stop";
  n_images: number;
  blur_p10: number;
  blur_share_soft: number;
  exposure_sigma: number;
  duplicate_share: number;
  notes: string[];
  bad_frames: string[];
  score: number;
}

export interface GlobeCell {
  theta: number;
  phi: number;
  weight: number;
}

export interface CoverageMap {
  n_cameras: number;
  centroid: [number, number, number];
  by_view_direction: GlobeCell[];
  by_position: GlobeCell[];
  gaps: GlobeCell[];
}

export type ArTarget = "usdz" | "gltf" | "mindar" | "webxr" | "lookingglass";

export interface BenchInfo {
  reachable: boolean;
  base_url: string | null;
  version: string | null;
}
