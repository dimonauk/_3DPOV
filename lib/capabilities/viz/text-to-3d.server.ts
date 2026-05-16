/**
 * lib/capabilities/viz/text-to-3d.server.ts — Server-side TRELLIS seam.
 *
 * One-line role: take a text prompt (and optional reference image URL),
 * POST it to the bench's TRELLIS FastAPI route, upload the returned GLB
 * via the media library, return the durable handle.
 *
 * # Posture
 *
 * Sync. TRELLIS runs a couple of minutes on a 3090; inside Vercel's
 * 300s budget. No polling, no job table. The bench wrap is at
 * `D:/The_Hangar/engines/splat360/src/splat360/api/trellis.py` and
 * follows the same bearer-token pattern as the triposr route.
 *
 * # Wake-up checklist
 *
 * - `TRELLIS_SERVICE_URL` set to the Tailscale Funnel hostname (or
 *   `http://127.0.0.1:8000` for bench-local dev).
 * - `TRELLIS_AUTH_TOKEN` set on Vercel + locally (.env.local). Bench
 *   must read the same token from the env. Empty = auth disabled.
 * - Fake mode auto-engages on the bench when the trellis venv python
 *   isn't on disk — the server seam just gets a 12-byte glTF
 *   placeholder back, which uploads cleanly and renders as an empty
 *   scene in `<model-viewer>`.
 */

import "server-only";

import { createLogger } from "lib/log";

import { mediaUpload } from "../media/library";

import type {
  TextTo3DError,
  TextTo3DInput,
  TextTo3DResult,
} from "./text-to-3d";

const log = createLogger("capability:viz.text-to-3d");

function asError(
  code: TextTo3DError["code"],
  message: string,
): Error {
  const detail: TextTo3DError = { code, message };
  return Object.assign(new Error(message), detail);
}

const DEFAULT_SERVICE_URL = "http://127.0.0.1:8000";

function serviceUrl(): string {
  return (
    process.env.TRELLIS_SERVICE_URL?.replace(/\/$/, "") ?? DEFAULT_SERVICE_URL
  );
}

function authHeaders(): Record<string, string> {
  const token = process.env.TRELLIS_AUTH_TOKEN ?? "";
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

/**
 * Server-side TRELLIS call. The prompt is mandatory; an imageUrl is
 * optional and routes the bench to the image-to-3D pipeline instead of
 * the text-only one. Either way the returned GLB lands in the media
 * library so the public URL is durable past the request.
 */
export async function textTo3DServer(
  input: TextTo3DInput,
  ctx: {
    uploadedBy: string;
  },
): Promise<TextTo3DResult> {
  const url = serviceUrl();
  const startedAt = Date.now();

  const prompt = input.prompt?.trim() ?? "";
  if (!prompt) {
    throw asError(
      "source-invalid",
      "text-to-3d: prompt is required.",
    );
  }

  const body = {
    prompt,
    imageUrl: input.imageUrl ?? null,
    seed: input.seed ?? null,
  };

  log.info("dispatch to bench", {
    url,
    promptPreview: prompt.slice(0, 80),
    hasImageUrl: Boolean(input.imageUrl),
    seed: input.seed ?? null,
  });

  let res: Response;
  try {
    res = await fetch(`${url}/trellis/generate`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
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
      const text = await res.text();
      if (text) detail += ` — ${text.slice(0, 500)}`;
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
      `trellis bench rejected request: ${detail}`,
    );
  }

  const arrayBuf = await res.arrayBuffer();
  const glbBytes = new Uint8Array(arrayBuf);
  if (glbBytes.byteLength === 0) {
    throw asError(
      "generation-failed",
      "trellis bench returned an empty GLB body.",
    );
  }

  // Filename derived from the prompt — short slug, capped so blob
  // pathnames stay sane. Falls back to "mesh" when the slug collapses.
  const slug =
    prompt
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "mesh";
  const glbFilename = `${slug}_trellis.glb`;

  const media = await mediaUpload({
    file: glbBytes,
    filename: glbFilename,
    mimeType: "model/gltf-binary",
    kind: "glb",
    subject: "deploy",
    uploadedBy: ctx.uploadedBy,
    source: "vercel-blob",
    sourceRef: {
      textTo3D: {
        provider: "trellis",
        format: "glb",
        prompt,
        sourceImageUrl: input.imageUrl ?? null,
        seed: input.seed ?? null,
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
    provider: "trellis",
    format: "glb",
    glbUrl: media.url,
    glbBytes: media.sizeBytes ?? glbBytes.byteLength,
    generatedAt: media.uploadedAt,
    durationSeconds,
    meta: {
      mediaId: media.id,
      prompt,
      sourceImageUrl: input.imageUrl ?? null,
      seed: input.seed ?? null,
    },
  };
}
