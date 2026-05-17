/**
 * app/atelier/comfy-layered/comfy-layered/types.ts — Types mirroring
 * the ComfyUI bench contract.
 *
 * Extracted from comfy-layered-client.tsx per ARCHITECTURE.md
 * Rule 1. No React, no DOM — pure shapes shared between the
 * client, the API helper, and the param-control sub-components.
 */

export type LayerParameter = {
  id: string;
  name: string;
  type: "text" | "number" | "select" | "slider" | "toggle";
  defaultValue: string | number | boolean;
  realtime: boolean;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
};

export type ChainConfig = {
  id: string;
  name: string;
  description: string;
  category: string;
  layers: string[];
  enabled: boolean;
};

export type Preset = {
  id: string;
  name: string;
  description: string;
  category: string;
  parameters: Record<string, string | number | boolean>;
};

export type WorkflowKind =
  | "text-to-image"
  | "layered"
  | "progressive"
  | "style-transfer";

export type JobStatus = {
  jobId: string;
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  progress: number;
  currentStep: string;
  totalSteps: number;
  previewImage?: string;
  imageUrl?: string;
  error?: string;
};

export type RunState =
  | { kind: "idle" }
  | { kind: "running"; jobId: string }
  | { kind: "done"; imageUrl: string }
  | { kind: "error"; message: string };
