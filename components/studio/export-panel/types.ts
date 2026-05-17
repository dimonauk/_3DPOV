/**
 * components/studio/export-panel/types.ts — Job-payload + UI state
 * types for the studio export panel.
 *
 * Extracted from ExportPanel.tsx per ARCHITECTURE.md Rule 1. We
 * don't import these from the Python splat360 service (different
 * process); pinning the shapes here forces a TypeScript change
 * whenever the backend evolves.
 */

export type SplatCamera =
  | "avata360"
  | "osmo360"
  | "insta360-x"
  | "theta"
  | "gopro-max"
  | "generic";

export type SubmitEquirectVideoSource = {
  kind: "equirect-video";
  url: string;
  frame_fps: number;
  camera: SplatCamera;
};

export type SubmitEquirectImageSetSource = {
  kind: "equirect-image-set";
  urls: string[];
  camera: SplatCamera;
};

export type SubmitSource =
  | SubmitEquirectVideoSource
  | SubmitEquirectImageSetSource;

export type SubmitVariant = {
  sfm: "colmap" | "glomap" | "opensfm" | "hloc" | "alicevision";
  trainer: "nerfstudio" | "brush" | "gaussian-splatting" | "postshot";
  strategy: "auto" | "fisheye-pair" | "equirect" | "cubemap";
};

export type SubmitJob = {
  source: SubmitSource;
  variants: SubmitVariant[];
};

export type JobEvent = {
  at: number;
  phase: string | null;
  message: string;
};

export type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "streaming"; jobId: string; events: JobEvent[] }
  | { status: "done"; jobId: string; events: JobEvent[]; finalPhase: string }
  | { status: "error"; message: string };

export type PrintRenderState =
  | { status: "idle" }
  | { status: "rendering"; ratio: number }
  | { status: "done"; method: "file" | "topaz"; message: string }
  | { status: "error"; message: string };

export type RadioOption<T extends string | number> = {
  value: T;
  label: string;
  disabled?: boolean;
};
