/**
 * lib/capabilities/viz/image-to-mesh.ts — Capability `viz.image-to-mesh`:
 * turn one or more images of a subject into a 3D mesh (GLB).
 *
 * One-line role: source-agnostic image → mesh, with four sibling
 * providers under one contract.
 *
 * Full purpose in image-to-mesh.PURPOSE.md.
 *
 * # Providers
 *
 * - "triposr" — Tripo + Stability AI. Single image. Feed-forward LRM;
 *   ~0.5s on RTX 4090, ~1.4 GB checkpoint. Rough-draft quality. MIT.
 * - "hy-wu" — Hunyuan3D + Wu wrapper. Single image. Mid-speed,
 *   mid-quality. Licence varies — Tencent's Hunyuan3D model carries
 *   its own terms; the wrapper code is small.
 * - "unique3d" — Tsinghua + Stability AI. Single image. Multi-view
 *   diffusion + normal estimation + reconstruction. ~30s, high
 *   quality. MIT.
 * - "instantmesh" — Tencent. Multi-view image set. zero123plus view
 *   synthesis + LRM transformer. Best when the operator has multiple
 *   photos of the subject. Apache-2.0.
 *
 * # Posture
 *
 * Foundation phase: type surface + provider router. All four providers
 * are GPU-bound and require a bench-side HTTP wrapper that doesn't
 * exist yet. The server router throws `provider-unavailable` with the
 * exact bench contract documented in each throw message.
 */

export type ImageToMeshProvider =
  | "triposr"
  | "hy-wu"
  | "unique3d"
  | "instantmesh";

/**
 * Licence that travels with every generated mesh record. Mirrors the
 * splat-record licence-gating pattern at
 * `lib/capabilities/viz/splat-generate.ts`. Commerce surfaces filter
 * on this.
 */
export type ImageToMeshLicence =
  | "research-only" // Provider-restricted, can't enter commerce surfaces.
  | "commercial-ok"; // Permissive licence (MIT / Apache-2.0).

/** Tencent's Hunyuan3D model carries non-commercial terms in some
 *  versions; review per-deploy. The wrapper marks itself research-only
 *  defensively until the operator confirms the bound version. */
export const PROVIDER_LICENCE_IMAGE_TO_MESH: Readonly<
  Record<ImageToMeshProvider, ImageToMeshLicence>
> = {
  triposr: "commercial-ok",
  "hy-wu": "research-only",
  unique3d: "commercial-ok",
  instantmesh: "commercial-ok",
};

/** Container format of the returned mesh. GLB is the studio default;
 *  STL / OBJ / PLY can be added when a chamber needs them. */
export type ImageToMeshFormat = "glb";

export type ImageToMeshSource =
  | { kind: "image-single"; url: string }
  | { kind: "image-set"; urls: readonly string[] };

export type ImageToMeshInput = {
  provider: ImageToMeshProvider;
  source: ImageToMeshSource;
  /** Caller-supplied id; defaults to a sha256 of the source payload at
   *  the call site. */
  recordId?: string;
};

export type ImageToMeshRecord = {
  id: string;
  provider: ImageToMeshProvider;
  licence: ImageToMeshLicence;
  format: ImageToMeshFormat;
  /** Public URL of the generated GLB. */
  meshUrl: string;
  /** Bytes of the GLB on disk. */
  meshBytes: number;
  /** Vertex count when the provider returns it; else undefined. */
  vertexCount?: number;
  /** Triangle count when the provider returns it; else undefined. */
  triangleCount?: number;
  /** ISO-8601 timestamp of when generation completed. */
  generatedAt: string;
  /** Provider-specific diagnostic blob (inference time, model
   *  version, intermediate-view count, etc.). Opaque to consumers. */
  meta: Record<string, unknown>;
};

export type ImageToMeshError = {
  code:
    | "provider-unavailable"
    | "source-invalid"
    | "licence-conflict"
    | "generation-failed";
  message: string;
};

/**
 * Public capability — foundation-phase stub. Same router pattern as
 * `splatGenerate`. The server-side implementation in `.server.ts`
 * does the actual dispatch to the bench.
 */
export async function imageToMesh(
  _input: ImageToMeshInput,
): Promise<ImageToMeshRecord> {
  const detail: ImageToMeshError = {
    code: "provider-unavailable",
    message:
      "viz.image-to-mesh: client-side stub. Call `imageToMeshServer` from a route handler instead — that hits the bench-side wrapper.",
  };
  throw Object.assign(new Error(detail.message), detail);
}

/** Convenience predicate: does this record's licence allow it on
 *  commerce surfaces? */
export function isMeshCommerceEligible(record: ImageToMeshRecord): boolean {
  return record.licence !== "research-only";
}
