/**
 * lib/capabilities/viz/image-to-mesh.server.ts — Server-side router for
 * the viz.image-to-mesh capability.
 *
 * One-line role: dispatches `imageToMeshServer(input, ctx)` to the
 * right provider stub. All four providers are GPU-bound and require
 * a bench-side HTTP wrapper that doesn't exist yet; this file
 * documents the bench contract per-provider in the throw messages.
 *
 * # Wake-up checklist (per provider)
 *
 * To wire a provider end-to-end:
 *
 * 1. Bring up the bench HTTP wrapper at `IMAGE_TO_MESH_SERVICE_URL`
 *    that satisfies the contract documented above each `throw`.
 * 2. Set `IMAGE_TO_MESH_SERVICE_URL` + `IMAGE_TO_MESH_AUTH_TOKEN` on
 *    Vercel + locally (.env.local). Tailscale Funnel hostname.
 * 3. Replace the `throw asError(...)` with the multipart-POST + poll +
 *    download + media-upload pipeline (mirror `splat-generate.server.ts`'s
 *    `generateViaSharpOnnxFromBytes`).
 * 4. `imageToMesh*` returns an ImageToMeshRecord with provider/licence
 *    flowing through to `sourceRef.imageToMesh.*` on the Media record.
 */

import "server-only";

import {
  PROVIDER_LICENCE_IMAGE_TO_MESH,
  type ImageToMeshError,
  type ImageToMeshInput,
  type ImageToMeshProvider,
  type ImageToMeshRecord,
} from "./image-to-mesh";

void PROVIDER_LICENCE_IMAGE_TO_MESH; // Re-exported via image-to-mesh.ts; keep typed import.

function asError(
  code: ImageToMeshError["code"],
  message: string,
): Error {
  const detail: ImageToMeshError = { code, message };
  return Object.assign(new Error(message), detail);
}

const BENCH_CONTRACT_HEAD = `Bench-side wrapper contract (uniform across all four image-to-mesh providers):

POST  {IMAGE_TO_MESH_SERVICE_URL}/<provider>/jobs
  multipart: { image | images[]: <bytes>, params: JSON }
Returns: { jobId, etaSeconds }

GET   {IMAGE_TO_MESH_SERVICE_URL}/<provider>/jobs/{jobId}
  -> { state, vertexCount?, triangleCount?, durationSeconds? }

GET   {IMAGE_TO_MESH_SERVICE_URL}/<provider>/jobs/{jobId}/result.glb
  -> GLB bytes

Bearer-token auth (env IMAGE_TO_MESH_AUTH_TOKEN). Set
IMAGE_TO_MESH_SERVICE_URL to the Tailscale Funnel hostname.`;

const PROVIDER_NOTES: Record<ImageToMeshProvider, string> = {
  triposr:
    "Source at services/triposr/. Single-image LRM (~1.4 GB checkpoint). MIT.",
  "hy-wu":
    "Source at services/hy-wu/. Hunyuan3D + Wu wrapper. Licence-sensitive — check the bound Hunyuan3D version's terms before flipping to commerce-ok.",
  unique3d:
    "Source at services/unique3d/. Multi-view diffusion + normal estimation + reconstruction. ~30s per image. MIT.",
  instantmesh:
    "Source at services/instantmesh/. Multi-view input (image-set), zero123plus + LRM. Apache-2.0.",
};

/**
 * Server-side router. Picks the right provider and runs it. Caller
 * must pass `uploadedBy` (the operator's Firebase uid).
 *
 * Currently throws `provider-unavailable` for every provider with the
 * exact bench contract documented in the throw message. When the
 * bench wrapper lands, replace the throw with the real call.
 */
export async function imageToMeshServer(
  input: ImageToMeshInput,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ctx: { uploadedBy: string },
): Promise<ImageToMeshRecord> {
  // Input-shape sanity check — providers split on single-vs-multi.
  if (input.provider === "instantmesh" && input.source.kind !== "image-set") {
    throw asError(
      "source-invalid",
      "instantmesh requires source.kind=\"image-set\" — provide two or more views.",
    );
  }
  if (
    input.provider !== "instantmesh" &&
    input.source.kind !== "image-single"
  ) {
    throw asError(
      "source-invalid",
      `${input.provider} expects source.kind="image-single" — provide a single image URL.`,
    );
  }

  throw asError(
    "provider-unavailable",
    `${input.provider}: bench-side image-to-mesh wrapper not yet wired. ` +
      `${PROVIDER_NOTES[input.provider]}\n\n` +
      BENCH_CONTRACT_HEAD,
  );
}
