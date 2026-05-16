/**
 * lib/capabilities/viz/image-to-3d.ts — Capability `viz.image-to-3d`:
 * a single photograph becomes a 3D printable mesh.
 *
 * One-line role: focused TripoSR seam. One provider, one input, one
 * output. The broader `viz.image-to-mesh` capability is the four-
 * provider router; this capability is the TripoSR-only fast path that
 * the `/atelier/triposr` chamber drives.
 *
 * Full purpose in image-to-3d.PURPOSE.md.
 *
 * # Why a separate capability from image-to-mesh
 *
 * `image-to-mesh` is the long-term unified surface — pick from four
 * providers, each with their own quality / speed / single-vs-multi
 * curve. Wiring all four end-to-end takes four bench wrappers and
 * four sets of provider semantics. `image-to-3d` is the wedge: the
 * single TripoSR provider, end-to-end, today, so the chamber + the
 * bench round-trip can prove itself before the broader router lights
 * up.
 *
 * The two coexist. When the unified router is fully wired,
 * `image-to-3d` becomes a thin alias that delegates to
 * `imageToMesh({ provider: "triposr", ... })`.
 *
 * # Bench contract
 *
 * Sync POST. TripoSR runs in ~30s on a 3090, well inside Vercel's
 * 300s function budget.
 *
 *     POST {TRIPOSR_SERVICE_URL}/triposr/generate
 *       Authorization: Bearer <TRIPOSR_AUTH_TOKEN>?
 *       multipart: image=<bytes>, params=<JSON>?
 *     returns: model/gltf-binary bytes
 *
 * Implementation lives at `image-to-3d.server.ts`. The bench wrap
 * lives at `D:/The_Hangar/engines/splat360/src/splat360/api/triposr.py`.
 */

export type ImageTo3DProvider = "triposr";

/**
 * Container format of the returned mesh. GLB only for now; OBJ / PLY
 * can be added when a chamber needs them (TripoSR's `run.py` already
 * supports `obj`).
 */
export type ImageTo3DFormat = "glb";

export type ImageTo3DInput = {
  /** Where the source image lives. Either a public HTTPS URL the bench
   *  can fetch, or `null` when the caller streams the bytes directly
   *  via the route handler (the common path from the chamber). */
  imageUrl: string | null;
  /** Per-run knobs. All optional — sensible defaults match TripoSR's. */
  params?: {
    /** Auto-cut out the background via rembg. Default true. Set false
     *  if the image already has a grey background + properly-sized
     *  foreground. */
    removeBackground?: boolean;
    /** Fraction of the frame the foreground should occupy after
     *  resize. Default 0.85. Only used when removeBackground is true. */
    foregroundRatio?: number;
    /** Marching-cubes grid resolution. Higher = denser mesh + more VRAM
     *  + longer extract. Default 256. */
    mcResolution?: number;
    /** Renderer eval chunk size — smaller reduces VRAM, increases
     *  compute. Default 8192; 0 disables chunking. */
    chunkSize?: number;
  };
  /** Caller-supplied id; defaults to the media id minted at upload. */
  recordId?: string;
};

export type ImageTo3DResult = {
  id: string;
  provider: ImageTo3DProvider;
  format: ImageTo3DFormat;
  /** Public URL of the generated GLB on the studio's media library. */
  glbUrl: string;
  /** Bytes of the GLB on disk. */
  glbBytes: number;
  /** Vertex count when the provider reports it; else undefined. */
  vertexCount?: number;
  /** ISO-8601 timestamp of when generation completed. */
  generatedAt: string;
  /** Wall-clock seconds the bench round-trip took. */
  durationSeconds: number;
  /** Provider-specific diagnostic blob (model version, parameter echo,
   *  warnings). Opaque to consumers. */
  meta: Record<string, unknown>;
};

export type ImageTo3DError = {
  code:
    | "provider-unavailable"
    | "source-invalid"
    | "generation-failed"
    | "auth-required";
  message: string;
};

/**
 * Public capability — client-side stub. The actual work runs server-
 * side in `image-to-3d.server.ts`; call that from a route handler.
 * Callers that reach this from the browser get a clear redirect.
 */
export async function imageTo3D(
  _input: ImageTo3DInput,
): Promise<ImageTo3DResult> {
  const detail: ImageTo3DError = {
    code: "provider-unavailable",
    message:
      "viz.image-to-3d: client-side stub. Call `imageTo3DServer` from a route handler (or POST to /api/viz/image-to-3d) — that path hits the bench-side TripoSR wrapper.",
  };
  throw Object.assign(new Error(detail.message), detail);
}
