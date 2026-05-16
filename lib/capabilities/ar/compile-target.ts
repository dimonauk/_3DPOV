/**
 * lib/capabilities/ar/compile-target.ts — Capability `ar.compile-target`:
 * compile a reference image into a mind-ar `.mind` binary target file.
 *
 * One-line role: image URL → `.mind` blob registered in the media library.
 * The runtime side (`components/ar/MindARScene.tsx`) consumes those
 * `.mind` files at scan-time; this capability is how new ones get made.
 *
 * Full purpose in compile-target.PURPOSE.md.
 *
 * # Why this exists
 *
 * Every HoloWalk plaque, every printed AR card, every per-sculpture
 * scan-target needs its own `.mind` file — a feature-point bundle
 * extracted from the reference image at compile time. The mind-ar CLI
 * (`OfflineCompiler`) does the extraction but hard-imports the
 * native-bindings `canvas` package, which has no working prebuild on
 * Node 25 / Windows. The server impl side-steps that with a module
 * resolution shim onto `@napi-rs/canvas` (or, if the shim doesn't take
 * across the ESM border, falls forward to a clearly-thrown stub — see
 * `compile-target.server.ts`).
 *
 * # Quality presets
 *
 * mind-ar's tracker quality scales with the number of feature scales
 * extracted at compile time. `"draft"` gives a fast preview (good for
 * iterating on a card design); `"high"` gives the best tracking but
 * takes a few seconds per image. The default `"normal"` matches mind-ar's
 * out-of-the-box behaviour.
 *
 * # Posture
 *
 * Foundation phase: this file defines the type surface. The server impl
 * in `compile-target.server.ts` attempts the real compile via the
 * Module-resolution shim; if mind-ar's ESM imports defeat the shim
 * (likely on Node 25 ESM), it throws `compile-failed` with a clear
 * pointer to the proven `scripts/ar-compile-mind.mjs` fall-forward.
 */

export type CompileArTargetQuality = "draft" | "normal" | "high";

export type CompileArTargetInput = {
  /** Public URL of the reference image (PNG / JPEG). The compiler
   *  fetches it server-side, so the URL must be reachable from the
   *  Node process — Vercel Blob, public/static, or a tailnet host. */
  imageUrl: string;
  /** Human-readable name for the target ("Trafalgar Wing plaque").
   *  Used as the `.mind` filename root when present. */
  label?: string;
  /** Number of feature scales to extract. Defaults to `"normal"`. */
  quality?: CompileArTargetQuality;
  /** Optional caller-supplied id; defaults to the media library's uuid. */
  recordId?: string;
};

export type CompileArTargetResult = {
  /** Stable id — `recordId` if the caller supplied one, else the media uuid. */
  id: string;
  /** Human-readable label that travelled with the input. */
  label?: string;
  /** Public URL of the compiled `.mind` file (Vercel Blob). */
  mindFileUrl: string;
  /** Echo of the input reference image URL — kept for cross-reference. */
  sourceImageUrl: string;
  /** Number of feature points / keyframes extracted; useful as a
   *  tracking-quality proxy. May be 0 when the compiler doesn't report. */
  featureCount: number;
  /** Wall-clock seconds the compile pass took. */
  durationSeconds: number;
  /** ISO-8601 timestamp of when the `.mind` was written. */
  generatedAt: string;
};

export type CompileArTargetError = {
  code:
    | "image-fetch-failed"
    | "image-invalid"
    | "compile-failed"
    | "blob-write-failed";
  message: string;
};

/**
 * Public capability. Foundation-phase stub: the server router throws
 * unless `compile-target.server.ts` is imported and called directly.
 * Browser callers should not invoke this — the OfflineCompiler is a
 * Node-only path. The site-level seam is a Server Action or API route
 * that delegates to `compileArTargetServer`.
 */
export async function compileArTarget(
  _input: CompileArTargetInput,
): Promise<CompileArTargetResult> {
  const detail: CompileArTargetError = {
    code: "compile-failed",
    message:
      "ar.compile-target: invoke compileArTargetServer from a server-only context — the browser stub is metadata only",
  };
  throw Object.assign(new Error(detail.message), detail);
}
