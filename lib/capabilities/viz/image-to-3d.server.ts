/**
 * lib/capabilities/viz/image-to-3d.server.ts — Server-side TripoSR seam.
 *
 * One-line role: take a single image (as bytes or URL), POST it to the
 * bench's TripoSR FastAPI route, upload the returned GLB via the media
 * library, return the durable handle.
 *
 * # Posture
 *
 * Sync. TripoSR runs ~30s on a 3090; well inside Vercel's 300s budget.
 * No polling, no job table. The bench wrap is at
 * `D:/The_Hangar/engines/splat360/src/splat360/api/triposr.py` and
 * follows the same bearer-token pattern as the other splat360 routes.
 *
 * # Wake-up checklist
 *
 * - `TRIPOSR_SERVICE_URL` set to the Tailscale Funnel hostname (or
 *   `http://127.0.0.1:8000` for bench-local dev).
 * - `TRIPOSR_AUTH_TOKEN` set on Vercel + locally (.env.local). Bench
 *   must read the same token from the env. Empty = auth disabled.
 * - `viz.depth-estimation` remains the free in-browser fallback when
 *   the bench is offline. The capability surface here doesn't fall
 *   back automatically — the chamber chooses.
 */

import "server-only";

import { createLogger } from "lib/log";

import { mediaUpload } from "../media/library";

import type {
  ImageTo3DError,
  ImageTo3DInput,
  ImageTo3DResult,
} from "./image-to-3d";

const log = createLogger("capability:viz.image-to-3d");

function asError(
  code: ImageTo3DError["code"],
  message: string,
): Error {
  const detail: ImageTo3DError = { code, message };
  return Object.assign(new Error(message), detail);
}

const DEFAULT_SERVICE_URL = "http://127.0.0.1:8000";

function serviceUrl(): string {
  return (
    process.env.TRIPOSR_SERVICE_URL?.replace(/\/$/, "") ?? DEFAULT_SERVICE_URL
  );
}

function authHeaders(): Record<string, string> {
  const token = process.env.TRIPOSR_AUTH_TOKEN ?? "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Server-side TripoSR call. Two shapes:
 *
 *   - `input.imageUrl` set: fetch the URL server-side, then POST the
 *     bytes to the bench. Use this when the caller already has a
 *     hosted image (Imagen output, archive photo).
 *
 *   - `input.imageUrl === null`: caller passes `sourceBytes` /
 *     `sourceFilename` / `sourceMimeType` directly. The chamber path:
 *     visitor uploads in the browser, route reads the multipart blob,
 *     forwards the bytes here without staging in Blob first.
 *
 * Either way the returned GLB lands in the media library so the public
 * URL is durable past the request.
 */
export async function imageTo3DServer(
  input: ImageTo3DInput,
  ctx: {
    uploadedBy: string;
    /** Raw bytes path — used when the chamber streams the upload. */
    sourceBytes?: Uint8Array;
    sourceFilename?: string;
    sourceMimeType?: string;
  },
): Promise<ImageTo3DResult> {
  const url = serviceUrl();
  const startedAt = Date.now();

  // ---- 1. assemble the image payload ----
  let imageBytes: Uint8Array;
  let imageFilename: string;
  let imageMime: string;

  if (ctx.sourceBytes) {
    imageBytes = ctx.sourceBytes;
    imageFilename = ctx.sourceFilename ?? "input.png";
    imageMime = ctx.sourceMimeType ?? "image/png";
  } else if (input.imageUrl) {
    const fetched = await fetch(input.imageUrl);
    if (!fetched.ok) {
      throw asError(
        "source-invalid",
        `could not fetch source image (${fetched.status} ${fetched.statusText}): ${input.imageUrl}`,
      );
    }
    const buf = await fetched.arrayBuffer();
    imageBytes = new Uint8Array(buf);
    imageMime = fetched.headers.get("content-type") ?? "image/png";
    imageFilename =
      input.imageUrl.split("/").pop()?.split("?")[0] ?? "input.png";
  } else {
    throw asError(
      "source-invalid",
      "image-to-3d: pass either input.imageUrl or ctx.sourceBytes.",
    );
  }

  // ---- 2. POST to the bench ----
  const form = new FormData();
  form.append(
    "image",
    new Blob([new Uint8Array(imageBytes)], { type: imageMime }),
    imageFilename,
  );
  if (input.params) {
    form.append(
      "params",
      JSON.stringify({
        removeBackground: input.params.removeBackground ?? true,
        foregroundRatio: input.params.foregroundRatio ?? 0.85,
        mcResolution: input.params.mcResolution ?? 256,
        chunkSize: input.params.chunkSize ?? 8192,
      }),
    );
  }

  log.info("dispatch to bench", {
    url,
    bytes: imageBytes.byteLength,
    filename: imageFilename,
    mime: imageMime,
  });

  let res: Response;
  try {
    res = await fetch(`${url}/triposr/generate`, {
      method: "POST",
      headers: authHeaders(),
      body: form,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error("bench unreachable", { err: message });
    throw asError(
      "provider-unavailable",
      `bench unreachable at ${url}: ${message}`,
    );
  }

  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = await res.text();
      if (body) detail += ` — ${body.slice(0, 500)}`;
    } catch {
      /* ignore */
    }
    log.warn("bench rejected", { status: res.status, detail });
    throw asError(
      res.status === 401
        ? "auth-required"
        : res.status >= 500
          ? "generation-failed"
          : "source-invalid",
      `triposr bench rejected request: ${detail}`,
    );
  }

  const arrayBuf = await res.arrayBuffer();
  const glbBytes = new Uint8Array(arrayBuf);
  if (glbBytes.byteLength === 0) {
    throw asError(
      "generation-failed",
      "triposr bench returned an empty GLB body.",
    );
  }

  // ---- 3. persist via the media library ----
  const baseName = imageFilename.replace(/\.[^.]+$/, "") || "mesh";
  const glbFilename = `${baseName}_triposr.glb`;
  const media = await mediaUpload({
    file: glbBytes,
    filename: glbFilename,
    mimeType: "model/gltf-binary",
    kind: "glb",
    subject: "deploy",
    uploadedBy: ctx.uploadedBy,
    source: "vercel-blob",
    sourceRef: {
      imageTo3D: {
        provider: "triposr",
        format: "glb",
        sourceImageUrl: input.imageUrl ?? null,
      },
    },
  });

  const durationSeconds = (Date.now() - startedAt) / 1000;
  log.info("done", {
    glbBytes: glbBytes.byteLength,
    durationSeconds,
    mediaId: media.id,
  });

  return {
    id: input.recordId ?? media.id,
    provider: "triposr",
    format: "glb",
    glbUrl: media.url,
    glbBytes: media.sizeBytes ?? glbBytes.byteLength,
    generatedAt: media.uploadedAt,
    durationSeconds,
    meta: {
      mediaId: media.id,
      sourceImageUrl: input.imageUrl ?? null,
      params: input.params ?? {},
    },
  };
}
