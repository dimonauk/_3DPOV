/**
 * lib/capabilities/ar/compile-target.server.ts — Server-side wiring for
 * `ar.compile-target`.
 *
 * One-line role: fetch a reference image, compile it via mind-ar's
 * tracking-feature extraction (using a sharp-backed FakeCanvas so we
 * never touch the broken native `canvas` package), upload the resulting
 * `.mind` buffer via the media library, return a typed record.
 *
 * # Why this implementation
 *
 * mind-ar's `OfflineCompiler` imports `canvas` by name. The native
 * `canvas` package is unbuildable on Node 25 + Windows (verified
 * 2026-05-16, prebuilds 404; even the v3 prebuild ships missing five
 * DLLs — see [[holoflow-canvas-server]]). A `Module._resolveFilename`
 * shim that rewrites `canvas → @napi-rs/canvas` only catches CJS
 * imports; mind-ar is ESM, so the shim is a no-op.
 *
 * The fix is to skip `OfflineCompiler` and call mind-ar's lower-level
 * modules directly (`CompilerBase` + `buildTrackingImageList` +
 * `extractTrackingFeatures`). None of those imports `canvas`. We supply
 * our own minimal "canvas" via a `FakeCanvas` class that returns sharp-
 * decoded raw RGBA bytes from `getImageData`. This is the exact pattern
 * `scripts/ar-compile-mind.mjs` proved out in production — promoted from
 * a CLI fall-forward into the in-process capability.
 *
 * # The flow
 *
 *   1. `fetch(imageUrl)` → Uint8Array bytes.
 *   2. `sharp(bytes).ensureAlpha().raw()` → raw RGBA + width/height.
 *   3. Wrap as `SharpImage` + `FakeCanvas`; hand to `SharpOfflineCompiler`.
 *   4. `compiler.compileImageTargets([image], progress)` runs tracking
 *      feature extraction; ~1–3s per A4-size image on a desktop CPU.
 *   5. `compiler.exportData()` → the `.mind` ArrayBuffer.
 *   6. `mediaUpload({ kind: "other", subject: "deploy", … })` persists
 *      to Vercel Blob + Firestore.
 *   7. Return the typed `CompileArTargetResult`.
 *
 * # Single artifact
 *
 * We only produce the `.mind` file — no thumbnail PNG. The source image
 * already exists at `imageUrl`; viewers that want a thumbnail render
 * from that, not a duplicate.
 *
 * # Modular layout
 *
 *   - `compile-target-canvas.ts`     — sharp decoder + FakeCanvas
 *   - `compile-target-mindar.ts`     — mind-ar dynamic-import compiler subclass
 *   - `compile-target-subprocess.ts` — opt-in `scripts/...` fallback
 *   - this file                      — the public router
 */

import "server-only";

import { createLogger } from "lib/log";

import { mediaUpload } from "../media/library";

import type {
  CompileArTargetInput,
  CompileArTargetResult,
} from "./compile-target";
import {
  asCompileError,
  decodeWithSharp,
  fetchImageBytes,
  type SharpImage,
} from "./compile-target-canvas";
import { buildSharpOfflineCompiler } from "./compile-target-mindar";
import { trySubprocessCompile } from "./compile-target-subprocess";

const log = createLogger("capability:ar.compile-target");

function sanitiseFilenameRoot(label: string | undefined, id: string): string {
  if (!label) return id;
  return label.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || id;
}

// ---------- Public server entrypoint ----------

/**
 * Server-side compile. Caller must pass `uploadedBy` (the operator's
 * Firebase uid) — matches the media library's auth posture.
 *
 * Throws a typed `CompileArTargetError`-shaped Error on every failure
 * path: `image-fetch-failed`, `image-invalid`, `compile-failed`,
 * `blob-write-failed`.
 */
export async function compileArTargetServer(
  input: CompileArTargetInput,
  ctx: { uploadedBy: string },
): Promise<CompileArTargetResult> {
  const started = Date.now();

  log.info("compile start", {
    imageUrl: input.imageUrl,
    label: input.label,
    recordId: input.recordId,
  });

  const source = await fetchImageBytes(input.imageUrl);

  let image: SharpImage;
  try {
    image = await decodeWithSharp(source.bytes);
  } catch (err) {
    throw asCompileError(
      "image-invalid",
      `sharp decode failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  log.debug("image decoded", { width: image.width, height: image.height });

  let mindBuffer: Uint8Array;
  try {
    const compiler = await buildSharpOfflineCompiler();
    await compiler.compileImageTargets([image], () => {
      /* progress callback — silent for v0; future: stream via SSE */
    });
    const raw = compiler.exportData();
    mindBuffer = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
  } catch (err) {
    const inProcessMsg = err instanceof Error ? err.message : String(err);
    log.error("in-process compile failed", {
      imageUrl: input.imageUrl,
      err: inProcessMsg,
      willTrySubprocess: process.env.AR_COMPILE_FALLBACK_ENABLED === "1",
    });

    // Opt-in subprocess fallback. Identical compile logic in a fresh
    // node process — defends against TF.js / mind-ar / sharp module-state
    // corruption inside the long-lived server. Returns null if the
    // fallback is disabled or also fails; in that case we surface the
    // original in-process error to the caller.
    const fallback = await trySubprocessCompile(source.bytes);
    if (fallback) {
      mindBuffer = fallback;
    } else {
      throw asCompileError(
        "compile-failed",
        `mind-ar compile failed: ${inProcessMsg}`,
      );
    }
  }

  const id = input.recordId ?? crypto.randomUUID();
  const filenameRoot = sanitiseFilenameRoot(input.label, id);
  let media;
  try {
    media = await mediaUpload({
      file: mindBuffer,
      filename: `${filenameRoot}.mind`,
      mimeType: "application/octet-stream",
      kind: "other",
      subject: "deploy",
      uploadedBy: ctx.uploadedBy,
      ...(input.label !== undefined && { title: input.label }),
      tags: ["ar-target", "mind-ar"],
    });
  } catch (err) {
    log.error("media upload failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    throw asCompileError(
      "blob-write-failed",
      `media library upload failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const durationSeconds = (Date.now() - started) / 1000;

  log.info("compile done", {
    id: input.recordId ?? media.id,
    mindFileUrl: media.url,
    bytes: mindBuffer.byteLength,
    durationSeconds,
  });

  return {
    id: input.recordId ?? media.id,
    ...(input.label !== undefined && { label: input.label }),
    mindFileUrl: media.url,
    sourceImageUrl: input.imageUrl,
    featureCount: 0, // CompilerBase doesn't surface the count; v1 may parse exportData
    durationSeconds,
    generatedAt: media.uploadedAt,
  };
}
