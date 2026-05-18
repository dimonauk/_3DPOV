/**
 * lib/capabilities/viz/generate-comfyui-http.ts — ComfyUI HTTP
 * protocol + output discovery + download. Split from the server
 * router so the transport surface is testable in isolation.
 */

import "server-only";

import type {
  ComfyUIGenerateError,
  ComfyUIOutputKind,
} from "./generate-comfyui";
import type { WorkflowGraph } from "./generate-comfyui-workflow";

function asError(code: ComfyUIGenerateError["code"], message: string): Error {
  const detail: ComfyUIGenerateError = { code, message };
  return Object.assign(new Error(message), detail);
}

const POLL_INTERVAL_MS = 2_000;

export function authHeaders(token: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function submitPrompt(
  serviceUrl: string,
  graph: WorkflowGraph,
  clientId: string,
  token: string,
): Promise<{ promptId: string }> {
  const res = await fetch(`${serviceUrl}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
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

export type HistoryOutputImage = {
  filename: string;
  subfolder: string;
  type: string;
};

export type HistoryNodeOutputs = {
  images?: HistoryOutputImage[];
  gifs?: HistoryOutputImage[];
  videos?: HistoryOutputImage[];
  mesh?: HistoryOutputImage[];
  meshes?: HistoryOutputImage[];
  [key: string]: HistoryOutputImage[] | undefined;
};

export type HistoryEntry = {
  prompt?: unknown;
  outputs?: Record<string, HistoryNodeOutputs>;
  status?: {
    status_str?: string;
    completed?: boolean;
    messages?: unknown[];
  };
};

export async function pollUntilOutput(
  serviceUrl: string,
  promptId: string,
  timeoutMs: number,
  token: string,
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
      headers: authHeaders(token),
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

export function findOutputFile(
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

export async function downloadView(
  serviceUrl: string,
  ref: HistoryOutputImage,
  token: string,
): Promise<Uint8Array> {
  const qs = new URLSearchParams({
    filename: ref.filename,
    subfolder: ref.subfolder ?? "",
    type: ref.type ?? "output",
  }).toString();
  const res = await fetch(`${serviceUrl}/view?${qs}`, {
    headers: authHeaders(token),
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

import type { MediaKind } from "../media/library-types";

export function mediaKindFor(outputKind: ComfyUIOutputKind): MediaKind {
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

export function mimeTypeFor(
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
