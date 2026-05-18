/**
 * GET /api/assets/proxy/[id] — Streams a Google-Drive-hosted asset.
 *
 * Drive's `uc?export=download&id=<ID>` URL is fine for direct browser
 * downloads, but two things bite when you try to render a Drive-hosted
 * GLB inside <model-viewer>:
 *
 *   1. Drive sends `Content-Disposition: attachment; filename=...`
 *      which makes some browsers refuse to render the bytes inline.
 *   2. For files >~25 MB Drive intercepts with a virus-scan-confirm
 *      HTML page — the actual binary is only served once you re-hit
 *      the URL with `&confirm=<token>` after parsing the form.
 *
 * Both problems vanish when we proxy server-side: we follow the
 * confirm-token dance ourselves, strip the attachment headers, and
 * stream clean bytes back to the browser with a sensible content-type.
 *
 * Only registry entries with host=`google-drive` are proxiable —
 * everything else returns 404. No transformation, no caching at our
 * edge (Drive's CDN is upstream of us and handles caching), no auth
 * (registry assets are all public by policy).
 */

import { NextResponse, type NextRequest } from "next/server";

import { getAsset } from "lib/assets/resolve";

export const dynamic = "force-dynamic";
// Streaming binary content can be much larger than the default lambda
// response body limit allows when buffered. Setting maxDuration high
// gives Drive time to start streaming on cold starts.
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx): Promise<Response> {
  const { id } = await ctx.params;

  const asset = getAsset(id);
  if (!asset) {
    return NextResponse.json(
      { error: "not_found", id },
      { status: 404 },
    );
  }
  if (asset.host !== "google-drive" || !asset.driveId) {
    return NextResponse.json(
      { error: "not_proxiable", id, host: asset.host },
      { status: 400 },
    );
  }

  const driveUrl = `https://drive.google.com/uc?export=download&id=${asset.driveId}`;

  let driveResp = await fetch(driveUrl, { redirect: "follow" });

  // Drive intercepts large files with a "scan for viruses" HTML form.
  // Detect it by content-type and re-fetch with the confirm token.
  const contentType = driveResp.headers.get("content-type") ?? "";
  if (contentType.includes("text/html")) {
    const body = await driveResp.text();
    const confirmMatch = body.match(/confirm=([0-9A-Za-z_-]+)/);
    const uuidMatch = body.match(/name="uuid" value="([0-9a-fA-F-]+)"/);
    if (confirmMatch) {
      const confirmToken = confirmMatch[1];
      const uuid = uuidMatch?.[1];
      const params = new URLSearchParams({
        export: "download",
        id: asset.driveId,
        confirm: confirmToken ?? "t",
      });
      if (uuid) params.set("uuid", uuid);
      driveResp = await fetch(
        `https://drive.usercontent.google.com/download?${params}`,
        { redirect: "follow" },
      );
    }
  }

  if (!driveResp.ok || !driveResp.body) {
    return NextResponse.json(
      {
        error: "drive_fetch_failed",
        status: driveResp.status,
        id,
      },
      { status: 502 },
    );
  }

  // Guess content-type from the asset format. Drive's response often
  // says octet-stream + attachment — we override with something the
  // browser can actually render inline.
  const proxyContentType = contentTypeFor(asset.format) ??
    driveResp.headers.get("content-type") ??
    "application/octet-stream";

  return new Response(driveResp.body, {
    status: 200,
    headers: {
      "content-type": proxyContentType,
      // Strip attachment headers so the browser renders inline.
      "content-disposition": `inline; filename="${asset.id}.${asset.format}"`,
      // Drive's CDN handles caching upstream; we forward whatever
      // length we got and let downstream do the same.
      ...(driveResp.headers.get("content-length")
        ? { "content-length": driveResp.headers.get("content-length")! }
        : {}),
      "cache-control": "public, max-age=3600",
      "access-control-allow-origin": "*",
    },
  });
}

function contentTypeFor(format: string): string | null {
  switch (format.toLowerCase()) {
    case "glb":
      return "model/gltf-binary";
    case "gltf":
      return "model/gltf+json";
    case "obj":
      return "text/plain";
    case "stl":
      return "model/stl";
    case "ply":
      return "application/octet-stream";
    case "usdz":
      return "model/vnd.usdz+zip";
    case "vrm":
      return "model/gltf-binary";
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "zip":
      return "application/zip";
    case "blend":
      return "application/x-blender";
    default:
      return null;
  }
}
