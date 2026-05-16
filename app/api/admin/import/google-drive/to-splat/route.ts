/**
 * app/api/admin/import/google-drive/to-splat/route.ts — Drive image →
 * SHARP → Splat orchestrator.
 *
 * Mirror of the Photos pipeline (`/api/admin/import/google-photos/to-splat`)
 * with a Drive-side source. For each picked Drive fileId:
 *
 *   1. Download the original image bytes from Drive (drive.readonly).
 *   2. POST to the SHARP-ONNX bench service.
 *   3. Receive a 1.18 M-gaussian PLY back.
 *   4. Land via `mediaUpload` with `source: "vercel-blob"` and full
 *      splat metadata. Stored on the research surface.
 *
 * Only image MIME types are sent to SHARP; video / other types return
 * an error outcome so the operator can re-tick.
 *
 * POST /api/admin/import/google-drive/to-splat
 *   Headers: Authorization: Bearer <firebase-id-token>
 *   Body: { fileIds: string[] }
 *   Returns: { outcomes: Array<{ fileId, ok, mediaId?, plyUrl?, error? }> }
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
import { downloadFile } from "lib/integrations/google/drive";
import { getOperatorAccessToken } from "lib/integrations/google/oauth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Body = { fileIds?: unknown; target?: unknown };
type TargetKind = "vercel-blob" | "google-drive";

function coerceBody(input: unknown): {
  fileIds: string[];
  target: TargetKind;
} | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Body;
  if (!Array.isArray(o.fileIds)) return null;
  const ids = o.fileIds.filter((x): x is string => typeof x === "string");
  if (!ids.length) return null;
  const target: TargetKind =
    o.target === "google-drive" ? "google-drive" : "vercel-blob";
  return { fileIds: ids, target };
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

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const body = coerceBody(json);
  if (!body) {
    return NextResponse.json(
      { error: "Invalid body. Need fileIds[]." },
      { status: 400 },
    );
  }

  let accessToken: string;
  try {
    accessToken = await getOperatorAccessToken(admin.uid);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Access-token fetch failed." },
      { status: 500 },
    );
  }

  const outcomes: Array<{
    fileId: string;
    ok: boolean;
    mediaId?: string;
    plyUrl?: string;
    error?: string;
  }> = [];

  for (const fileId of body.fileIds) {
    try {
      const { bytes, mimeType, filename } = await downloadFile(
        accessToken,
        fileId,
      );
      if (!mimeType.toLowerCase().startsWith("image/")) {
        outcomes.push({
          fileId,
          ok: false,
          error: `SHARP only accepts images; this file is ${mimeType}.`,
        });
        continue;
      }
      const outputTarget: SplatOutputTarget =
        body.target === "google-drive"
          ? { kind: "google-drive", operatorAccessToken: accessToken }
          : { kind: "vercel-blob" };
      const record = await generateViaSharpOnnxFromBytes({
        bytes,
        mimeType,
        filename,
        uploadedBy: admin.uid,
        sourceImageUrl: null,
        target: outputTarget,
      });
      outcomes.push({
        fileId,
        ok: true,
        mediaId:
          typeof record.meta["mediaId"] === "string"
            ? (record.meta["mediaId"] as string)
            : record.id,
        plyUrl: record.plyUrl,
      });
    } catch (err) {
      outcomes.push({
        fileId,
        ok: false,
        error: err instanceof Error ? err.message : "splat-failed",
      });
    }
  }

  return NextResponse.json({ outcomes }, { status: 200 });
}
