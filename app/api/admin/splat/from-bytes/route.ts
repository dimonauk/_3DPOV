/**
 * app/api/admin/splat/from-bytes/route.ts — Universal image → SHARP →
 * Splat endpoint.
 *
 * Takes a raw image upload (multipart) and runs it through the SHARP
 * pipeline. Used by:
 *
 *   - Video-frame-to-splat: client-side captures a frame from an HTML5
 *     `<video>` element into a canvas, POSTs the resulting JPEG.
 *   - Drag-and-drop ad-hoc splats from the operator console.
 *   - Any future capability that produces an image in memory and wants
 *     to land it as a splat without round-tripping through Drive/Photos.
 *
 * Output target: same `vercel-blob | google-drive` choice the other
 * to-splat routes accept. Defaults to vercel-blob (cheap test mode) —
 * pass `target=google-drive` in the form to land the resulting PLY on
 * the operator's own Drive instead.
 *
 * POST /api/admin/splat/from-bytes
 *   Headers: Authorization: Bearer <firebase-id-token>
 *   Body: multipart/form-data
 *     file: <image bytes>
 *     filename: string (optional — falls back to "capture.jpg")
 *     target: "vercel-blob" | "google-drive" (optional)
 *     sourceLabel: string (optional — recorded on the splat for provenance)
 *   Returns: { mediaId, plyUrl, gaussianCount, durationSeconds }
 */

import { NextResponse } from "next/server";

import {
  generateViaSharpOnnxFromBytes,
  type SplatOutputTarget,
} from "lib/capabilities/viz/splat-generate.server";
import {
  adminGuardErrorBody,
  AdminGuardError,
  requireAdminUser,
} from "lib/integrations/google/admin-guard";
import { getOperatorAccessToken } from "lib/integrations/google/oauth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

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
  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json(
      { error: "Missing 'file' field (image bytes)." },
      { status: 400 },
    );
  }
  const mimeType = file.type || "image/jpeg";
  if (!mimeType.startsWith("image/")) {
    return NextResponse.json(
      { error: `SHARP only accepts images; got ${mimeType}.` },
      { status: 400 },
    );
  }
  const filename =
    typeof form.get("filename") === "string"
      ? (form.get("filename") as string)
      : "capture.jpg";
  const targetKind =
    form.get("target") === "google-drive" ? "google-drive" : "vercel-blob";
  const sourceLabel =
    typeof form.get("sourceLabel") === "string"
      ? (form.get("sourceLabel") as string)
      : null;

  const bytes = new Uint8Array(await file.arrayBuffer());

  let target: SplatOutputTarget;
  if (targetKind === "google-drive") {
    let accessToken: string;
    try {
      accessToken = await getOperatorAccessToken(admin.uid);
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message
              : "Need to connect Google before target=google-drive works.",
        },
        { status: 400 },
      );
    }
    target = { kind: "google-drive", operatorAccessToken: accessToken };
  } else {
    target = { kind: "vercel-blob" };
  }

  try {
    const record = await generateViaSharpOnnxFromBytes({
      bytes,
      mimeType,
      filename,
      uploadedBy: admin.uid,
      sourceImageUrl: sourceLabel,
      target,
    });
    return NextResponse.json(
      {
        mediaId:
          typeof record.meta["mediaId"] === "string"
            ? (record.meta["mediaId"] as string)
            : record.id,
        plyUrl: record.plyUrl,
        gaussianCount: record.gaussianCount,
        durationSeconds:
          typeof record.meta["durationSeconds"] === "number"
            ? (record.meta["durationSeconds"] as number)
            : null,
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "splat-failed" },
      { status: 500 },
    );
  }
}
