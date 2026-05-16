/**
 * lib/capabilities/viz/thumbnail-providers/splat-real.server.ts —
 * splat-real provider for viz.thumbnail-splat.
 *
 * Real WebGL splat screenshot taken in a headless browser running on
 * HoloFlow Desktop (the studio's local-helper sidecar, never on
 * Vercel). The canonical thumbnail quality — what the splat actually
 * looks like, not a generic poster card.
 *
 * # Bench contract
 *
 *   POST   {SPLAT360_SERVICE_URL}/api/thumbnails/splat
 *     Authorization: Bearer <SPLAT360_AUTH_TOKEN>?
 *     Content-Type: application/json
 *     body: {
 *       splatUrl: string,                            // .spz > .ksplat > .ply
 *       size: { w: number; h: number },
 *       view: { yaw: number; pitch: number; fov: number },
 *     }
 *     returns: image/png bytes
 *
 * # Cross-network
 *
 * Default to `http://localhost:8390` for the desktop helper. When the
 * site runs on Vercel, set `SPLAT360_SERVICE_URL` to the Tailscale
 * Funnel hostname for the bench (see [[holoflow-bench-bridge]]).
 * Otherwise splat-real is bench-only.
 *
 * The endpoint is not yet implemented in the desktop helper. Until
 * the headless-Chromium + @sparkjsdev/spark (or
 * @mkkellogg/gaussian-splats-3d) screenshot worker ships, this
 * provider attempts the POST and returns `provider-unavailable` on
 * the expected 404 / connection-refused so callers can fall back to
 * card-fast.
 */

import "server-only";

import { mediaUpload } from "../../media/library";

import {
  DEFAULT_THUMBNAIL_SIZE,
  type ThumbnailSplatInput,
  type ThumbnailSplatResult,
} from "../thumbnail-splat";

import { asError, bestSplatUrl, log } from "./_helpers.server";

const SERVICE_URL =
  process.env["SPLAT360_SERVICE_URL"] ?? "http://localhost:8390";
const SERVICE_AUTH_TOKEN = process.env["SPLAT360_AUTH_TOKEN"] ?? "";

function authHeaders(): Record<string, string> {
  return SERVICE_AUTH_TOKEN
    ? { Authorization: `Bearer ${SERVICE_AUTH_TOKEN}` }
    : {};
}

const DEFAULT_VIEW = { yaw: 0, pitch: 0, fov: 50 };

export async function renderSplatReal(
  input: ThumbnailSplatInput,
  uploadedBy: string,
): Promise<ThumbnailSplatResult> {
  const size = input.size ?? DEFAULT_THUMBNAIL_SIZE;
  const splatUrl = bestSplatUrl(input.record);
  const view = input.view ?? DEFAULT_VIEW;

  log.debug("splat-real fetch", { serviceUrl: SERVICE_URL, splatUrl, size });

  let pngResponse: Response;
  try {
    pngResponse = await fetch(`${SERVICE_URL}/api/thumbnails/splat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({ splatUrl, size, view }),
    });
  } catch (err) {
    // Connection refused / DNS failure / Tailscale not reachable.
    throw asError(
      "provider-unavailable",
      `splat-real: HoloFlow Desktop at ${SERVICE_URL} is unreachable ` +
        `(${err instanceof Error ? err.message : String(err)}). ` +
        `Fall back to card-fast or run the desktop helper.`,
    );
  }

  if (pngResponse.status === 404 || pngResponse.status === 405) {
    throw asError(
      "provider-unavailable",
      `splat-real: HoloFlow Desktop at ${SERVICE_URL} answered but ` +
        `/api/thumbnails/splat returned ${pngResponse.status}. The headless ` +
        `splat-screenshot worker is not yet built on the desktop side. ` +
        `See lib/capabilities/viz/thumbnail-providers/splat-real.server.ts for the contract.`,
    );
  }
  if (!pngResponse.ok) {
    throw asError(
      "render-failed",
      `splat-real: HoloFlow Desktop returned ${pngResponse.status} ${pngResponse.statusText}`,
    );
  }

  const pngBytes = new Uint8Array(await pngResponse.arrayBuffer());

  let media: { id: string; url: string; uploadedAt: string; sizeBytes?: number };
  try {
    media = await mediaUpload({
      file: pngBytes,
      filename: `thumb-${input.record.id}-real.png`,
      mimeType: "image/png",
      kind: "photo",
      subject: "thumbnail",
      uploadedBy,
      source: "vercel-blob",
      sourceRef: {
        thumbnailSplat: {
          recordId: input.record.id,
          provider: "splat-real",
        },
      },
    });
  } catch (err) {
    throw asError(
      "blob-write-failed",
      `splat-real upload failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  log.info("splat-real done", {
    id: media.id,
    recordId: input.record.id,
    bytes: pngBytes.byteLength,
  });

  return {
    id: media.id,
    provider: "splat-real",
    url: media.url,
    bytes: media.sizeBytes ?? pngBytes.byteLength,
    width: size.w,
    height: size.h,
    generatedAt: media.uploadedAt,
  };
}
