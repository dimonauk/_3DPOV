/**
 * app/api/admin/import/google-drive/import/route.ts — Import selected
 * Drive files into the catalogue via `mediaUpload(…)`.
 *
 * POST /api/admin/import/google-drive/import
 *   Headers: Authorization: Bearer <firebase-id-token>
 *   Body: { fileIds: string[], subject: MediaSubject, tags?: string[] }
 *   Returns: { outcomes: Array<{ fileId, ok, mediaId?, error? }> }
 */

import { NextResponse } from "next/server";

import { mediaUpload } from "lib/capabilities/media/library";
import type {
  MediaKind,
  MediaSubject,
} from "lib/capabilities/media/library-types";
import {
  adminGuardErrorBody,
  AdminGuardError,
  requireAdminUser,
} from "lib/integrations/google/admin-guard";
import {
  downloadFile,
  driveMediaKind,
} from "lib/integrations/google/drive";
import { getOperatorAccessToken } from "lib/integrations/google/oauth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Body = {
  fileIds?: unknown;
  subject?: unknown;
  tags?: unknown;
};

const SUBJECTS = new Set<MediaSubject>([
  "photograph",
  "aerial",
  "holo-walk",
  "codex",
  "article",
  "journal",
  "tutorial",
  "product",
  "rookery",
  "press",
  "other",
]);

function coerceBody(input: unknown): {
  fileIds: string[];
  subject: MediaSubject;
  tags?: string[];
} | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Body;
  if (!Array.isArray(o.fileIds)) return null;
  const ids = o.fileIds.filter((x): x is string => typeof x === "string");
  if (!ids.length) return null;
  if (typeof o.subject !== "string" || !SUBJECTS.has(o.subject as MediaSubject)) {
    return null;
  }
  const tags = Array.isArray(o.tags)
    ? o.tags.filter((t): t is string => typeof t === "string")
    : undefined;
  return { fileIds: ids, subject: o.subject as MediaSubject, tags };
}

function mediaKindFromMime(mimeType: string): MediaKind {
  const broad = driveMediaKind(mimeType);
  if (broad === "photo") return "photo";
  if (broad === "video") return "video";
  return "other";
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
      { error: "Invalid body shape. Need fileIds[] + subject." },
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
    error?: string;
  }> = [];

  for (const fileId of body.fileIds) {
    try {
      const { bytes, mimeType, filename } = await downloadFile(
        accessToken,
        fileId,
      );
      const kind = mediaKindFromMime(mimeType);
      const media = await mediaUpload({
        file: bytes,
        filename,
        mimeType,
        kind,
        subject: body.subject,
        uploadedBy: admin.uid,
        source: "google-drive",
        sourceRef: { googleDrive: { fileId } },
        ...(body.tags?.length ? { tags: body.tags } : {}),
      });
      outcomes.push({ fileId, ok: true, mediaId: media.id });
    } catch (err) {
      outcomes.push({
        fileId,
        ok: false,
        error: err instanceof Error ? err.message : "import-failed",
      });
    }
  }

  return NextResponse.json({ outcomes }, { status: 200 });
}
