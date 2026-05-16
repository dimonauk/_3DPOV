/**
 * app/api/viz/image-to-3d/route.ts — Visitor-facing image → 3D mesh route.
 *
 * Accepts multipart: `image` (file) + optional `params` (JSON string).
 * Streams the bytes to `imageTo3DServer`, which POSTs them to the bench
 * TripoSR FastAPI route and returns a media-library record for the GLB.
 *
 * # Auth posture
 *
 * Operator-only via the existing google admin guard. TripoSR is GPU-
 * bound and the bench would melt under anonymous traffic; rate-limiting
 * + quota would have to land before opening this up.
 *
 * # Timing
 *
 * The whole round trip — image upload, bench inference, GLB upload to
 * Vercel Blob — usually completes inside 60s on a 3090. Vercel function
 * timeout is bumped to 300s to leave headroom for cold GPU starts.
 */

import { NextResponse } from "next/server";

import { createLogger } from "lib/log";
import { imageTo3DServer } from "lib/capabilities/viz/image-to-3d.server";
import type { ImageTo3DError } from "lib/capabilities/viz/image-to-3d";
import {
  adminGuardErrorBody,
  AdminGuardError,
  requireAdminUser,
} from "lib/integrations/google/admin-guard";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const log = createLogger("api:viz.image-to-3d");

function isImageTo3DError(err: unknown): err is ImageTo3DError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string"
  );
}

export async function POST(req: Request) {
  let admin: { uid: string; email: string };
  try {
    admin = await requireAdminUser(req);
  } catch (err) {
    if (err instanceof AdminGuardError) {
      const { status, body } = adminGuardErrorBody(err);
      return NextResponse.json(body, { status });
    }
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data." },
      { status: 400 },
    );
  }

  const file = form.get("image");
  if (!(file instanceof Blob)) {
    return NextResponse.json(
      { error: "Missing 'image' field." },
      { status: 400 },
    );
  }

  // Optional `params` field — JSON-encoded TripoSR knobs.
  const paramsRaw = form.get("params");
  let params: Record<string, unknown> | undefined;
  if (typeof paramsRaw === "string" && paramsRaw.length > 0) {
    try {
      const parsed = JSON.parse(paramsRaw) as Record<string, unknown>;
      if (parsed && typeof parsed === "object") params = parsed;
    } catch {
      return NextResponse.json(
        { error: "'params' is not valid JSON." },
        { status: 400 },
      );
    }
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const filename =
    "name" in file && typeof (file as File).name === "string"
      ? (file as File).name
      : "input.png";
  const mime = file.type || "image/png";

  log.info("dispatch", {
    uploadedBy: admin.uid,
    bytes: bytes.byteLength,
    filename,
    mime,
  });

  try {
    const result = await imageTo3DServer(
      {
        imageUrl: null,
        ...(params
          ? {
              params: {
                removeBackground:
                  typeof params["removeBackground"] === "boolean"
                    ? (params["removeBackground"] as boolean)
                    : undefined,
                foregroundRatio:
                  typeof params["foregroundRatio"] === "number"
                    ? (params["foregroundRatio"] as number)
                    : undefined,
                mcResolution:
                  typeof params["mcResolution"] === "number"
                    ? (params["mcResolution"] as number)
                    : undefined,
                chunkSize:
                  typeof params["chunkSize"] === "number"
                    ? (params["chunkSize"] as number)
                    : undefined,
              },
            }
          : {}),
      },
      {
        uploadedBy: admin.uid,
        sourceBytes: bytes,
        sourceFilename: filename,
        sourceMimeType: mime,
      },
    );
    return NextResponse.json({ result });
  } catch (err) {
    if (isImageTo3DError(err)) {
      const status =
        err.code === "provider-unavailable"
          ? 503
          : err.code === "source-invalid"
            ? 400
            : err.code === "auth-required"
              ? 401
              : 500;
      log.warn("provider-error", { code: err.code });
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status },
      );
    }
    log.error("internal error", { err });
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unknown error.",
        code: "generation-failed",
      },
      { status: 500 },
    );
  }
}
