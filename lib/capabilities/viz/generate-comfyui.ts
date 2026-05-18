/**
 * lib/capabilities/viz/generate-comfyui.ts — Capability `viz.generate-comfyui`:
 * submit a workflow to the Hangar's ComfyUI bench and return the generated
 * asset (image / video / 3D / 360-panorama).
 *
 * One-line role: the site's seam onto the working ComfyUI workflows
 * already battle-tested in the Hangar — Flux1-dev FP8 image generation
 * (best lighting / physics), Wan T2V-1.3B video, Hunyuan3D-2mv-turbo
 * image→GLB, SDXL 360° panorama, Flux + Equirectangular LoRA v3.
 *
 * Full purpose in generate-comfyui.PURPOSE.md.
 *
 * # The ported workflows
 *
 * | Workflow | Output | Hangar artefact | Use on the site |
 * |---|---|---|---|
 * | `flux1-dev-fp8`        | image (PNG)         | best lighting / physics | hero stills, sculpture concept |
 * | `wan-t2v-1_3b`         | video (MP4)         | kijai wrapper           | atelier explainers, social cuts |
 * | `hunyuan3d-2mv-turbo`  | 3D mesh (GLB, ~15MB)| 53s per generation      | stage furniture, props |
 * | `sdxl-360-panorama`    | equirect image      | seamless panorama       | HoloWalk backdrop, AR cards |
 * | `flux-equirect-lora-v3`| equirect image      | best 360 quality        | hero 360 backdrops |
 *
 * # The bridge
 *
 * ComfyUI runs at `D:/The_Hangar/engines/comfyui/`, port 8188. From the
 * Vercel-deployed site, we reach it via the studio's Tailscale Funnel
 * (set `COMFYUI_SERVICE_URL` to the tailnet hostname). From the bench,
 * direct localhost.
 *
 * # Posture
 *
 * Foundation phase: type surface + stub router. Server impl in
 * `generate-comfyui.server.ts` POSTs a workflow JSON to the ComfyUI
 * `/prompt` endpoint, polls `/history`, downloads the output to Vercel
 * Blob, writes a Media record, returns the resulting record.
 */

export type ComfyUIWorkflow =
  | "flux1-dev-fp8"
  | "wan-t2v-1_3b"
  | "hunyuan3d-2mv-turbo"
  | "sdxl-360-panorama"
  | "flux-equirect-lora-v3";

export type ComfyUIOutputKind = "image" | "video" | "mesh-glb" | "equirect-image";

export const WORKFLOW_OUTPUT: Readonly<Record<ComfyUIWorkflow, ComfyUIOutputKind>> = {
  "flux1-dev-fp8": "image",
  "wan-t2v-1_3b": "video",
  "hunyuan3d-2mv-turbo": "mesh-glb",
  "sdxl-360-panorama": "equirect-image",
  "flux-equirect-lora-v3": "equirect-image",
};

export type ComfyUIGenerateInput = {
  workflow: ComfyUIWorkflow;
  /** The text prompt that feeds the workflow's primary text input.
   *  Workflow JSON inputs other than the prompt come from defaults
   *  baked into the workflow JSON on the bench; advanced overrides are
   *  passed via `params`. */
  prompt: string;
  /** Optional negative prompt for workflows that accept one. */
  negativePrompt?: string;
  /** Optional input image URL for img2img / image-to-3D workflows. */
  imageUrl?: string;
  /** Optional seed for deterministic generation. Random if omitted. */
  seed?: number;
  /** Free-form param overrides keyed by ComfyUI node id. The server
   *  merges these on top of the workflow's baked defaults. */
  params?: Record<string, unknown>;
  /** Caller-supplied id; defaults to a sha256 of the input. */
  recordId?: string;
};

export type ComfyUIGenerateResult = {
  id: string;
  workflow: ComfyUIWorkflow;
  outputKind: ComfyUIOutputKind;
  /** Public URL of the generated asset (Vercel Blob). */
  url: string;
  /** Bytes-on-disk for the asset. */
  bytes: number;
  /** Per-workflow diagnostic blob (seed, sampler, steps, time, etc.).
   *  Opaque to consumers — for the bench's own debugging only. */
  meta: Record<string, unknown>;
  /** ISO-8601 timestamp the generation completed. */
  generatedAt: string;
};

export type ComfyUIGenerateError = {
  code:
    | "service-unavailable"
    | "workflow-unknown"
    | "queue-rejected"
    | "execution-failed"
    | "output-missing"
    | "blob-write-failed";
  message: string;
};

/**
 * Public capability. Foundation-phase stub.
 *
 * Server implementation (`generate-comfyui.server.ts`) will:
 *   1. Load the workflow JSON from `etc/comfyui-workflows/<workflow>.json`.
 *   2. Merge `prompt`, `negativePrompt`, `seed`, `params` into the workflow.
 *   3. POST to `${COMFYUI_SERVICE_URL}/prompt`.
 *   4. Poll `/history/<promptId>` until the output node fires.
 *   5. Fetch the output via `/view?filename=...`.
 *   6. Upload to Vercel Blob via the media library.
 *   7. Return the assembled `ComfyUIGenerateResult`.
 */
export async function comfyUIGenerate(
  _input: ComfyUIGenerateInput,
): Promise<ComfyUIGenerateResult> {
  const detail: ComfyUIGenerateError = {
    code: "service-unavailable",
    message:
      "viz.generate-comfyui: server router not wired yet — call comfyUIGenerateServer from a server context",
  };
  throw Object.assign(new Error(detail.message), detail);
}
