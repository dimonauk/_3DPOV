/**
 * lib/capabilities/viz/generate-comfyui.server.ts — Server-side wiring for
 * the `viz.generate-comfyui` capability.
 *
 * One-line role: implements `comfyUIGenerateServer` by loading a workflow
 * JSON from `etc/comfyui-workflows/`, merging the caller's prompt / seed /
 * params into its mutable nodes, submitting to the Hangar's ComfyUI bench,
 * polling `/history` until the output node fires, downloading the bytes
 * via `/view`, and persisting through the media library.
 *
 * # The bridge
 * ComfyUI runs at `D:/The_Hangar/engines/comfyui/` on port 8188. Set
 * `COMFYUI_SERVICE_URL` to the tailnet hostname when reaching the bench
 * from Vercel (Tailscale Funnel + `COMFYUI_AUTH_TOKEN` bearer per
 * [[holoflow-bench-bridge]]); default `http://localhost:8188` works when
 * the dev server runs on the bench itself.
 *
 * # Workflow JSON munging
 * ComfyUI workflows are flat JSON objects keyed by node id. Each node has
 * `class_type` + `inputs` + `_meta`. We mutate:
 *   - the first `CLIPTextEncode` whose `_meta.title` isn't "Negative" —
 *     its `inputs.text` becomes the caller's prompt
 *   - the `CLIPTextEncode` whose `_meta.title` includes "Negative" — its
 *     `inputs.text` becomes the negative prompt (if provided)
 *   - any `KSampler*` node — its `inputs.seed` becomes the caller's seed
 *   - any node id passed via `params` — those inputs are deep-merged
 *
 * # Output discovery
 * We walk the history `outputs` map looking for a node whose `class_type`
 * matches the expected output for the workflow's `ComfyUIOutputKind`:
 *   - `image` / `equirect-image` → `SaveImage` (PNG, via `outputs.images[0]`)
 *   - `video`                    → `SaveAnimatedWEBP` or `VHS_VideoCombine`
 *   - `mesh-glb`                 → `SaveGLB` or `Hy3DExportMesh`
 */

import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

import { mediaUpload } from "../media/library";
import type { MediaKind, MediaSubject } from "../media/library-types";

import {
  WORKFLOW_OUTPUT,
  type ComfyUIGenerateError,
  type ComfyUIGenerateInput,
  type ComfyUIGenerateResult,
  type ComfyUIOutputKind,
  type ComfyUIWorkflow,
} from "./generate-comfyui";

const DEFAULT_SERVICE_URL =
  process.env["COMFYUI_SERVICE_URL"] ?? "http://localhost:8188";

/**
 * Shared bearer token. Empty disables auth — only safe on the bench
 * itself with no Funnel exposing the service. In production, the
 * Vercel env must set this to match the bench's token.
 */
const SERVICE_AUTH_TOKEN = process.env["COMFYUI_AUTH_TOKEN"] ?? "";

function authHeaders(): Record<string, string> {
  return SERVICE_AUTH_TOKEN
    ? { Authorization: `Bearer ${SERVICE_AUTH_TOKEN}` }
    : {};
}

const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_IMAGE_MS = 5 * 60 * 1_000; // 5 min for stills
const POLL_TIMEOUT_LONG_MS = 30 * 60 * 1_000; // 30 min for video + 3D

function asError(code: ComfyUIGenerateError["code"], message: string): Error {
  const detail: ComfyUIGenerateError = { code, message };
  return Object.assign(new Error(message), detail);
}

// ---------------------------------------------------------------------------
// Workflow JSON loading + munging
// ---------------------------------------------------------------------------

type WorkflowNode = {
  class_type: string;
  inputs: Record<string, unknown>;
  _meta?: { title?: string };
};

type WorkflowGraph = Record<string, WorkflowNode>;

async function loadWorkflow(name: ComfyUIWorkflow): Promise<WorkflowGraph> {
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

function applyOverrides(
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

// ---------------------------------------------------------------------------
// ComfyUI HTTP protocol
// ---------------------------------------------------------------------------

async function submitPrompt(
  serviceUrl: string,
  graph: WorkflowGraph,
  clientId: string,
): Promise<{ promptId: string }> {
  const res = await fetch(`${serviceUrl}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ prompt: graph, client_id: clientId }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw asError(
      "queue-rejected",
      `ComfyUI /prompt rejected submission: ${res.status} ${res.statusText} ${detail}`,
    );
  }
  const body = (await res.json()) as { prompt_id?: string };
  if (!body.prompt_id) {
    throw asError("queue-rejected", "ComfyUI /prompt returned no prompt_id");
  }
  return { promptId: body.prompt_id };
}

type HistoryOutputImage = {
  filename: string;
  subfolder: string;
  type: string;
};

type HistoryNodeOutputs = {
  images?: HistoryOutputImage[];
  gifs?: HistoryOutputImage[];
  videos?: HistoryOutputImage[];
  mesh?: HistoryOutputImage[];
  meshes?: HistoryOutputImage[];
  [key: string]: HistoryOutputImage[] | undefined;
};

type HistoryEntry = {
  prompt?: unknown;
  outputs?: Record<string, HistoryNodeOutputs>;
  status?: {
    status_str?: string;
    completed?: boolean;
    messages?: unknown[];
  };
};

async function pollUntilOutput(
  serviceUrl: string,
  promptId: string,
  timeoutMs: number,
): Promise<HistoryEntry> {
  const started = Date.now();
  while (true) {
    if (Date.now() - started > timeoutMs) {
      throw asError(
        "execution-failed",
        `ComfyUI prompt ${promptId} timed out after ${timeoutMs / 1000}s`,
      );
    }
    const res = await fetch(`${serviceUrl}/history/${promptId}`, {
      headers: authHeaders(),
    });
    if (!res.ok) {
      throw asError(
        "service-unavailable",
        `history poll failed: ${res.status} ${res.statusText}`,
      );
    }
    const body = (await res.json()) as Record<string, HistoryEntry>;
    const entry = body[promptId];
    if (entry?.status?.status_str === "error") {
      throw asError(
        "execution-failed",
        `ComfyUI prompt ${promptId} failed during execution`,
      );
    }
    if (entry?.outputs && Object.keys(entry.outputs).length > 0) {
      return entry;
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

// ---------------------------------------------------------------------------
// Output discovery + download
// ---------------------------------------------------------------------------

/**
 * Per-output-kind: which `class_type` strings are produced by which
 * output-saver node, and which key on `outputs[nodeId]` carries the
 * file refs.
 */
const OUTPUT_SAVERS: Readonly<
  Record<ComfyUIOutputKind, ReadonlyArray<{ classType: string; key: string }>>
> = {
  image: [
    { classType: "SaveImage", key: "images" },
    { classType: "PreviewImage", key: "images" },
  ],
  "equirect-image": [
    { classType: "SaveImage", key: "images" },
    { classType: "PreviewImage", key: "images" },
  ],
  video: [
    { classType: "VHS_VideoCombine", key: "gifs" },
    { classType: "VHS_VideoCombine", key: "videos" },
    { classType: "SaveAnimatedWEBP", key: "images" },
    { classType: "SaveAnimatedWEBP", key: "gifs" },
  ],
  "mesh-glb": [
    { classType: "SaveGLB", key: "mesh" },
    { classType: "SaveGLB", key: "meshes" },
    { classType: "Hy3DExportMesh", key: "mesh" },
    { classType: "Hy3DExportMesh", key: "meshes" },
  ],
};

function findOutputFile(
  graph: WorkflowGraph,
  history: HistoryEntry,
  outputKind: ComfyUIOutputKind,
): { ref: HistoryOutputImage; nodeId: string; classType: string } {
  const outputs = history.outputs ?? {};
  const savers = OUTPUT_SAVERS[outputKind];

  for (const [nodeId, nodeOutputs] of Object.entries(outputs)) {
    const node = graph[nodeId];
    if (!node) continue;
    for (const { classType, key } of savers) {
      if (node.class_type !== classType) continue;
      const files = nodeOutputs[key];
      const first = files?.[0];
      if (first) {
        return { ref: first, nodeId, classType };
      }
    }
  }

  // Last-ditch: walk every output bucket and return the first file we
  // can find. Useful when the bench has a custom saver we don't enumerate.
  for (const [nodeId, nodeOutputs] of Object.entries(outputs)) {
    const node = graph[nodeId];
    for (const [, files] of Object.entries(nodeOutputs)) {
      const first = files?.[0];
      if (first) {
        return {
          ref: first,
          nodeId,
          classType: node?.class_type ?? "unknown",
        };
      }
    }
  }

  throw asError(
    "output-missing",
    `no output file found for ${outputKind} in ComfyUI history`,
  );
}

async function downloadView(
  serviceUrl: string,
  ref: HistoryOutputImage,
): Promise<Uint8Array> {
  const qs = new URLSearchParams({
    filename: ref.filename,
    subfolder: ref.subfolder ?? "",
    type: ref.type ?? "output",
  }).toString();
  const res = await fetch(`${serviceUrl}/view?${qs}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw asError(
      "output-missing",
      `failed to fetch output ${ref.filename}: ${res.status} ${res.statusText}`,
    );
  }
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

// ---------------------------------------------------------------------------
// Output-kind → media-library kind / mime / extension mapping
// ---------------------------------------------------------------------------

function mediaKindFor(outputKind: ComfyUIOutputKind): MediaKind {
  switch (outputKind) {
    case "image":
      return "photo";
    case "video":
      return "video";
    case "mesh-glb":
      return "glb";
    case "equirect-image":
      return "360-photo";
  }
}

function mimeTypeFor(
  outputKind: ComfyUIOutputKind,
  filename: string,
): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  switch (outputKind) {
    case "image":
    case "equirect-image":
      if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
      if (ext === "webp") return "image/webp";
      return "image/png";
    case "video":
      if (ext === "webp") return "image/webp"; // SaveAnimatedWEBP
      if (ext === "webm") return "video/webm";
      if (ext === "gif") return "image/gif";
      return "video/mp4";
    case "mesh-glb":
      return "model/gltf-binary";
  }
}

// ---------------------------------------------------------------------------
// Public router
// ---------------------------------------------------------------------------

/**
 * Server-side router for `viz.generate-comfyui`. Caller must pass
 * `uploadedBy` (the operator's Firebase uid) — matches the media
 * library's auth posture.
 */
export async function comfyUIGenerateServer(
  input: ComfyUIGenerateInput,
  ctx: { uploadedBy: string },
): Promise<ComfyUIGenerateResult> {
  const outputKind = WORKFLOW_OUTPUT[input.workflow];
  if (!outputKind) {
    throw asError(
      "workflow-unknown",
      `unknown workflow: ${input.workflow as string}`,
    );
  }
  const serviceUrl = DEFAULT_SERVICE_URL;
  const clientId = randomUUID();
  const startedAt = Date.now();

  // 1. Load + mutate workflow JSON.
  const graph = await loadWorkflow(input.workflow);
  const { seed } = applyOverrides(graph, input);

  // 2. Submit to ComfyUI.
  const { promptId } = await submitPrompt(serviceUrl, graph, clientId);

  // 3. Poll history. Image gets a 5-minute budget; video + 3D get 30.
  const timeoutMs =
    outputKind === "image" || outputKind === "equirect-image"
      ? POLL_TIMEOUT_IMAGE_MS
      : POLL_TIMEOUT_LONG_MS;
  const history = await pollUntilOutput(serviceUrl, promptId, timeoutMs);

  // 4. Find + fetch the output file.
  const { ref, nodeId, classType } = findOutputFile(graph, history, outputKind);
  const bytes = await downloadView(serviceUrl, ref);
  if (bytes.byteLength === 0) {
    throw asError(
      "output-missing",
      `ComfyUI returned an empty output file (${ref.filename})`,
    );
  }

  // 5. Persist to Vercel Blob + Firestore media record.
  const mimeType = mimeTypeFor(outputKind, ref.filename);
  const mediaKind = mediaKindFor(outputKind);
  // The site has no `"generation"` subject; the closest fit is
  // `"research"`, which mirrors how splat-generate parks provider
  // outputs. UI surfaces filter by `sourceRef.comfyui` to find these.
  const subject: MediaSubject = "research";
  const durationSeconds = (Date.now() - startedAt) / 1_000;

  let media;
  try {
    media = await mediaUpload({
      file: bytes,
      filename: ref.filename,
      mimeType,
      kind: mediaKind,
      subject,
      uploadedBy: ctx.uploadedBy,
      source: "vercel-blob",
      sourceRef: {
        comfyui: {
          workflow: input.workflow,
          promptId,
          prompt: input.prompt,
          ...(input.negativePrompt !== undefined && {
            negativePrompt: input.negativePrompt,
          }),
          seed,
          durationSeconds,
        },
      },
    });
  } catch (err) {
    throw asError(
      "blob-write-failed",
      `failed to persist ComfyUI output to media library: ${(err as Error).message}`,
    );
  }

  return {
    id: input.recordId ?? media.id,
    workflow: input.workflow,
    outputKind,
    url: media.url,
    bytes: media.sizeBytes ?? bytes.byteLength,
    generatedAt: media.uploadedAt,
    meta: {
      mediaId: media.id,
      promptId,
      clientId,
      seed,
      nodeId,
      saverClassType: classType,
      filename: ref.filename,
      subfolder: ref.subfolder,
      type: ref.type,
      durationSeconds,
    },
  };
}
