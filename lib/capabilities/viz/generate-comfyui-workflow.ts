/**
 * lib/capabilities/viz/generate-comfyui-workflow.ts — workflow JSON
 * loading + prompt/seed/param munging for the ComfyUI server-side
 * capability.
 *
 * Split out of generate-comfyui.server.ts so the server router can
 * stay focused on transport. Server-only import so this stays out of
 * any client bundle.
 */

import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type {
  ComfyUIGenerateError,
  ComfyUIGenerateInput,
  ComfyUIWorkflow,
} from "./generate-comfyui";

function asError(code: ComfyUIGenerateError["code"], message: string): Error {
  const detail: ComfyUIGenerateError = { code, message };
  return Object.assign(new Error(message), detail);
}

export type WorkflowNode = {
  class_type: string;
  inputs: Record<string, unknown>;
  _meta?: { title?: string };
};

export type WorkflowGraph = Record<string, WorkflowNode>;

export async function loadWorkflow(name: ComfyUIWorkflow): Promise<WorkflowGraph> {
  // Resolve relative to project cwd. Next.js runs the server from the
  // repo root, so `etc/comfyui-workflows/` is reachable directly.
  const path = join(process.cwd(), "etc", "comfyui-workflows", `${name}.json`);
  let raw: string;
  try {
    raw = await readFile(path, "utf-8");
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err
        ? (err as { code: string }).code
        : "unknown";
    if (code === "ENOENT") {
      throw asError(
        "workflow-unknown",
        `workflow JSON not found at ${path} — export the workflow from the Hangar's ComfyUI session (Save (API Format)) and commit it under etc/comfyui-workflows/`,
      );
    }
    throw asError(
      "workflow-unknown",
      `failed to read workflow JSON at ${path}: ${(err as Error).message}`,
    );
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      throw new Error("workflow JSON is not an object");
    }
    return parsed as WorkflowGraph;
  } catch (err) {
    throw asError(
      "workflow-unknown",
      `failed to parse workflow JSON at ${path}: ${(err as Error).message}`,
    );
  }
}

function isNegativeNode(node: WorkflowNode): boolean {
  const title = node._meta?.title ?? "";
  return /negative/i.test(title);
}

function findPositivePromptNode(graph: WorkflowGraph): string | null {
  // The convention is "Positive" / "CLIP Text Encode (Prompt)" / similar.
  // Pick the first CLIPTextEncode whose title isn't "Negative".
  for (const [id, node] of Object.entries(graph)) {
    if (node.class_type !== "CLIPTextEncode") continue;
    if (isNegativeNode(node)) continue;
    return id;
  }
  return null;
}

function findNegativePromptNode(graph: WorkflowGraph): string | null {
  for (const [id, node] of Object.entries(graph)) {
    if (node.class_type !== "CLIPTextEncode") continue;
    if (isNegativeNode(node)) return id;
  }
  return null;
}

export function applyOverrides(
  graph: WorkflowGraph,
  input: ComfyUIGenerateInput,
): { seed: number } {
  // 1. Prompt — first non-negative CLIPTextEncode.
  const positiveId = findPositivePromptNode(graph);
  if (positiveId === null) {
    throw asError(
      "workflow-unknown",
      `workflow ${input.workflow} has no CLIPTextEncode node to receive the prompt`,
    );
  }
  const positiveNode = graph[positiveId];
  if (positiveNode) positiveNode.inputs["text"] = input.prompt;

  // 2. Negative prompt — only if caller supplied one and the workflow
  //    actually has a Negative node. Otherwise leave the baked default.
  if (input.negativePrompt !== undefined) {
    const negativeId = findNegativePromptNode(graph);
    if (negativeId !== null) {
      const negativeNode = graph[negativeId];
      if (negativeNode) negativeNode.inputs["text"] = input.negativePrompt;
    }
  }

  // 3. Seed — apply to every KSampler-family node so dual-sampler
  //    workflows (rare but real) stay reproducible. Random if omitted.
  const seed =
    input.seed !== undefined
      ? input.seed
      : // ComfyUI seeds are uint64; JS safe-int cap is fine in practice.
        Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  for (const node of Object.values(graph)) {
    if (node.class_type.startsWith("KSampler")) {
      node.inputs["seed"] = seed;
    }
  }

  // 4. Free-form param overrides keyed by node id. The caller passes a
  //    shape like `{ "10": { steps: 30 } }` to deep-merge node 10's
  //    inputs. Unknown node ids are silently ignored (the bench may
  //    have moved them around between workflow exports).
  if (input.params) {
    for (const [nodeId, override] of Object.entries(input.params)) {
      const node = graph[nodeId];
      if (!node || typeof override !== "object" || override === null) continue;
      node.inputs = { ...node.inputs, ...(override as Record<string, unknown>) };
    }
  }

  return { seed };
}
