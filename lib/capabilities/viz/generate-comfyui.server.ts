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
 * See `generate-comfyui-workflow.ts` for the load + override pipeline.
 *
 * # Output discovery
 * See `generate-comfyui-http.ts` for the HTTP protocol + output-saver
 * mapping. `findOutputFile` walks the history `outputs` map looking
 * for a node whose `class_type` matches the expected output for the
 * workflow's `ComfyUIOutputKind`.
 */

import "server-only";

import { randomUUID } from "node:crypto";

import { mediaUpload } from "../media/library";
import type { MediaSubject } from "../media/library-types";

import {
  WORKFLOW_OUTPUT,
  type ComfyUIGenerateError,
  type ComfyUIGenerateInput,
  type ComfyUIGenerateResult,
} from "./generate-comfyui";
import {
  downloadView,
  findOutputFile,
  mediaKindFor,
  mimeTypeFor,
  pollUntilOutput,
  submitPrompt,
} from "./generate-comfyui-http";
import {
  applyOverrides,
  loadWorkflow,
} from "./generate-comfyui-workflow";

const DEFAULT_SERVICE_URL =
  process.env["COMFYUI_SERVICE_URL"] ?? "http://localhost:8188";

/**
 * Shared bearer token. Empty disables auth — only safe on the bench
 * itself with no Funnel exposing the service. In production, the
 * Vercel env must set this to match the bench's token.
 */
const SERVICE_AUTH_TOKEN = process.env["COMFYUI_AUTH_TOKEN"] ?? "";

const POLL_TIMEOUT_IMAGE_MS = 5 * 60 * 1_000; // 5 min for stills
const POLL_TIMEOUT_LONG_MS = 30 * 60 * 1_000; // 30 min for video + 3D

function asError(code: ComfyUIGenerateError["code"], message: string): Error {
  const detail: ComfyUIGenerateError = { code, message };
  return Object.assign(new Error(message), detail);
}

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
  const { promptId } = await submitPrompt(
    serviceUrl,
    graph,
    clientId,
    SERVICE_AUTH_TOKEN,
  );

  // 3. Poll history. Image gets a 5-minute budget; video + 3D get 30.
  const timeoutMs =
    outputKind === "image" || outputKind === "equirect-image"
      ? POLL_TIMEOUT_IMAGE_MS
      : POLL_TIMEOUT_LONG_MS;
  const history = await pollUntilOutput(
    serviceUrl,
    promptId,
    timeoutMs,
    SERVICE_AUTH_TOKEN,
  );

  // 4. Find + fetch the output file.
  const { ref, nodeId, classType } = findOutputFile(graph, history, outputKind);
  const bytes = await downloadView(serviceUrl, ref, SERVICE_AUTH_TOKEN);
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
