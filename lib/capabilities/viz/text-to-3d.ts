/**
 * lib/capabilities/viz/text-to-3d.ts — Capability `viz.text-to-3d`:
 * a text prompt (and optional reference image) becomes a 3D printable mesh.
 *
 * One-line role: focused TRELLIS seam. One provider, one input shape,
 * one output. The `/atelier/trellis` chamber drives this capability
 * end-to-end.
 *
 * Full purpose in `text-to-3d.PURPOSE.md`.
 *
 * # Sibling to image-to-3d
 *
 * `viz.image-to-3d` is the TripoSR seam — single image → GLB, ~30s.
 * `viz.text-to-3d` is the TRELLIS seam — prompt (+ optional image)
 * → GLB, a couple of minutes. Both end at the same place: a GLB on
 * the media library. Commerce surfaces can quote a print from either
 * record; they read the kind, not the provider.
 *
 * # Bench contract
 *
 * Sync POST. TRELLIS runs a couple of minutes on a 3090 (multi-step
 * sparse-structure + slat sampler + mesh extract + GLB postprocessing),
 * comfortably inside Vercel's 300s function budget.
 *
 *     POST {TRELLIS_SERVICE_URL}/trellis/generate
 *       Authorization: Bearer <TRELLIS_AUTH_TOKEN>?
 *       body: JSON {
 *         prompt:   string,
 *         imageUrl: string | null,
 *         seed:     number | null,
 *       }
 *     returns: model/gltf-binary bytes
 *
 * Implementation lives at `text-to-3d.server.ts`. The bench wrap
 * lives at `D:/The_Hangar/engines/splat360/src/splat360/api/trellis.py`.
 */

export type TextTo3DProvider = "trellis";

/**
 * Container format of the returned mesh. GLB only for now — TRELLIS's
 * `postprocessing_utils.to_glb` is the only export path wired up.
 */
export type TextTo3DFormat = "glb";

export type TextTo3DInput = {
  /** The text prompt that drives generation. Required even when an
   *  image is supplied — TRELLIS's image-to-3D pipeline uses the
   *  prompt as a label / tag for the run. */
  prompt: string;
  /** Optional reference image URL. When set, the bench dispatches to
   *  TrellisImageTo3DPipeline (microsoft/TRELLIS-image-large) instead
   *  of the text-only pipeline. */
  imageUrl?: string | null;
  /** Optional RNG seed for reproducibility. Default 1 (matches the
   *  upstream example_text.py). */
  seed?: number | null;
  /** Caller-supplied id; defaults to the media id minted at upload. */
  recordId?: string;
};

export type TextTo3DResult = {
  id: string;
  provider: TextTo3DProvider;
  format: TextTo3DFormat;
  /** Public URL of the generated GLB on the studio's media library. */
  glbUrl: string;
  /** Bytes of the GLB on disk. */
  glbBytes: number;
  /** ISO-8601 timestamp of when generation completed. */
  generatedAt: string;
  /** Wall-clock seconds the bench round-trip took. */
  durationSeconds: number;
  /** Provider-specific diagnostic blob (model version, seed echo,
   *  warnings). Opaque to consumers. */
  meta: Record<string, unknown>;
};

export type TextTo3DError = {
  code:
    | "provider-unavailable"
    | "source-invalid"
    | "generation-failed"
    | "auth-required";
  message: string;
};

/**
 * Public capability — client-side stub. The actual work runs server-
 * side in `text-to-3d.server.ts`; call that from a route handler.
 * Callers that reach this from the browser get a clear redirect.
 */
export async function textTo3D(
  _input: TextTo3DInput,
): Promise<TextTo3DResult> {
  const detail: TextTo3DError = {
    code: "provider-unavailable",
    message:
      "viz.text-to-3d: client-side stub. Call `textTo3DServer` from a route handler (or POST to /api/viz/text-to-3d) — that path hits the bench-side TRELLIS wrapper.",
  };
  throw Object.assign(new Error(detail.message), detail);
}
