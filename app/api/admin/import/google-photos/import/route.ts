/**
 * app/api/admin/import/google-photos/import/route.ts — Pull the picked
 * items from Google Photos and hand them to `mediaUpload(…)`.
 *
 * POST /api/admin/import/google-photos/import
 *   Headers: Authorization: Bearer <firebase-id-token>
 *   Body: {
 *     sessionId: string,
 *     mediaItemIds: string[],
 *     subject: MediaSubject,
 *     tags?: string[],
 *   }
 *   Returns: { outcomes: Array<{ mediaItemId, ok, mediaId?, error? }> }
 *
 * We re-list the session's mediaItems to recover their full mediaFile
 * metadata (the client only round-trips ids). Then per-item we download
 * bytes via baseUrl + `=d`/`=dv`, infer the MediaKind, and call
 * mediaUpload with `source: "google-photos"` + `sourceRef.googlePhotos`.
 *
 * After import we delete the picker session — best-effort.
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
import { getOperatorAccessToken } from "lib/integrations/google/oauth";
import {
  deletePickerSession,
  listAllSelectedMediaItems,
  type PickedMediaItem,
} from "lib/integrations/google/photos-picker";
import {
  downloadMediaItem,
  pickedMediaKind,
} from "lib/integrations/google/photos-picker-download";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // up to ~5 minutes for batch downloads.

type Body = {
  sessionId?: unknown;
  mediaItemIds?: unknown;
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
  sessionId: string;
  mediaItemIds: string[];
  subject: MediaSubject;
  tags?: string[];
} | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Body;
  if (typeof o.sessionId !== "string" || !o.sessionId) return null;
  if (!Array.isArray(o.mediaItemIds)) return null;
  const ids = o.mediaItemIds.filter((x): x is string => typeof x === "string");
  if (!ids.length) return null;
  if (typeof o.subject !== "string" || !SUBJECTS.has(o.subject as MediaSubject)) {
    return null;
  }
  const tags = Array.isArray(o.tags)
    ? o.tags.filter((t): t is string => typeof t === "string")
    : undefined;
  return {
    sessionId: o.sessionId,
    mediaItemIds: ids,
    subject: o.subject as MediaSubject,
    tags,
  };
}

function kindFromMediaItem(item: PickedMediaItem): MediaKind {
  const broad = pickedMediaKind(item);
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
      { error: "Invalid body shape. Need sessionId, mediaItemIds[], subject." },
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

  // Re-list the session so we have the mediaFile metadata server-side
  // (the operator's selection is identified by id only).
  let session: PickedMediaItem[];
  try {
    session = await listAllSelectedMediaItems(accessToken, body.sessionId);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Could not re-list session media items.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
  const byId = new Map(session.map((m) => [m.id, m]));

  const outcomes: Array<{
    mediaItemId: string;
    ok: boolean;
    mediaId?: string;
    error?: string;
  }> = [];

  for (const id of body.mediaItemIds) {
    const item = byId.get(id);
    if (!item) {
      outcomes.push({ mediaItemId: id, ok: false, error: "not-in-session" });
      continue;
    }
    try {
      const { bytes, mimeType, filename } = await downloadMediaItem(
        accessToken,
        item,
      );
      const kind = kindFromMediaItem(item);
      const media = await mediaUpload({
        file: bytes,
        filename,
        mimeType,
        kind,
        subject: body.subject,
        uploadedBy: admin.uid,
        source: "google-photos",
        sourceRef: { googlePhotos: { mediaItemId: item.id } },
        ...(body.tags?.length ? { tags: body.tags } : {}),
        ...(item.createTime ? { capturedAt: item.createTime } : {}),
      });
      outcomes.push({ mediaItemId: id, ok: true, mediaId: media.id });
    } catch (err) {
      outcomes.push({
        mediaItemId: id,
        ok: false,
        error: err instanceof Error ? err.message : "import-failed",
      });
    }
  }

  // Best-effort session cleanup.
  void deletePickerSession(accessToken, body.sessionId).catch(() => {
    /* ignore */
  });

  return NextResponse.json({ outcomes }, { status: 200 });
}
