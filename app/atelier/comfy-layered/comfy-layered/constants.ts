/**
 * app/atelier/comfy-layered/comfy-layered/constants.ts — Workflow
 * kinds + model + resolution dropdown options + label prettifiers.
 *
 * Extracted from comfy-layered-client.tsx per ARCHITECTURE.md Rule 1.
 * Pure data.
 */

import type { WorkflowKind } from "./types";

export const WORKFLOW_KINDS: WorkflowKind[] = [
  "text-to-image",
  "layered",
  "progressive",
  "style-transfer",
];

export const MODEL_OPTIONS = [
  { value: "flux-dev", label: "Flux Dev" },
  { value: "flux-schnell", label: "Flux Schnell" },
  { value: "sd-xl", label: "Stable Diffusion XL" },
  { value: "sd-1.5", label: "Stable Diffusion 1.5" },
];

export const RES_OPTIONS = [512, 768, 1024, 1280];

export function prettyWorkflow(k: WorkflowKind): string {
  return k.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export function prettyLayerName(id: string): string {
  const known: Record<string, string> = {
    "basic-concepts": "Basic concepts",
    relationships: "Relationships",
    "rendering-strategy": "Rendering strategy",
    optimization: "Optimisation",
  };
  return known[id] ?? id;
}
