/**
 * app/api/admin/import/google-drive/import/route.ts — Import Drive files
 * into the catalogue.
 *
 * Two modes, picked per request:
 *
 * 1. **download** (default) — the existing behaviour. The file is
 *    downloaded through the Drive API, written into Vercel Blob, and a
 *    Firestore record points at the Blob URL. Good for small media that
 *    benefits from the studio CDN.
 *
 * 2. **keep-on-drive** — the file stays on the operator's Drive. The
 *    route marks it anyone-with-link readable, then writes a Firestore
 *    record whose `url` is the Drive API public-key download URL
 *    (`?alt=media&key=…`). The browser fetches Drive directly; no
 *    Vercel egress, no storage cap. Required for the large splat
 *    archive (50+ GB of 280 MB PLYs).
 *
 * The optional `preset: "sharp-splat"` flag attaches SHARP-CCTV metadata
 * (provider/licence/plyFlavour/gaussianCount) so the imported splats
 * land on the research surface without further hand-edits.
 *
 * POST /api/admin/import/google-drive/import
 *   Headers: Authorization: Bearer <firebase-id-token>
 *   Body: {
 *     fileIds: string[],
 *     subject: MediaSubject,
 *     tags?: string[],
 *     mode?: "download" | "keep-on-drive",   // default "download"
 *     preset?: "sharp-splat",
 *   }
 *   Returns: { outcomes: Array<{ fileId, ok, mediaId?, error? }> }
 */

import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { requireFirebaseAdminDb } from "lib/firebase/admin";
import { mediaUpload } from "lib/capabilities/media/library";
import type {
  Media,
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
  getFile,
  publicDriveUrl,
  shareFilePublic,
} from "lib/integrations/google/drive";
import { getOperatorAccessToken } from "lib/integrations/google/oauth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Mode = "download" | "keep-on-drive";
type Preset = "sharp-splat";

type Body = {
  fileIds?: unknown;
  subject?: unknown;
  tags?: unknown;
  mode?: unknown;
  preset?: unknown;
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
  "research",
  "deploy",
  "other",
]);

const SHARP_GAUSSIAN_COUNT = 1_179_648;

function coerceBody(input: unknown): {
  fileIds: string[];
  subject: MediaSubject;
  tags?: string[];
  mode: Mode;
  preset?: Preset;
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
  const mode: Mode =
    o.mode === "keep-on-drive" ? "keep-on-drive" : "download";
  const preset =
    o.preset === "sharp-splat" ? ("sharp-splat" as const) : undefined;
  return {
    fileIds: ids,
    subject: o.subject as MediaSubject,
    tags,
    mode,
    preset,
  };
}

function locationSlugFromFilename(name: string): string {
  // Match the format the bench script uses: `<slug>/<timestamp>_…_std.ply`.
  // For loose files we strip extension and underscores.
  const base = name.replace(/\.[^.]+$/, "");
  return base.replace(/[_\s]+/g, "-").toLowerCase().slice(0, 64);
}

function locationTitleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((s) => s[0]?.toUpperCase() + s.slice(1))
    .join(" ");
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
      if (body.mode === "keep-on-drive") {
        // ---- keep-on-drive mode -------------------------------------
        const meta = await getFile(accessToken, fileId);
        await shareFilePublic(accessToken, fileId);
        const url = publicDriveUrl(fileId);
        const kind = driveMediaKind(meta.mimeType, meta.name);
        const slug = locationSlugFromFilename(meta.name);
        const title = locationTitleFromSlug(slug);
        const mediaId = randomUUID();
        const record: Media = {
          id: mediaId,
          kind,
          subject: body.subject,
          source: "google-drive",
          url,
          mimeType: meta.mimeType,
          uploadedAt: new Date().toISOString(),
          uploadedBy: admin.uid,
          title,
          description:
            body.preset === "sharp-splat"
              ? `CCTV still from ${title}, lifted into a 3D Gaussian Splat by Apple SHARP via ONNX on the studio bench.`
              : undefined,
          sizeBytes: meta.size,
          location: { slug, name: title },
          sourceRef: {
            googleDrive: { fileId },
            ...(body.preset === "sharp-splat" && kind === "ply"
              ? {
                  splat: {
                    provider: "sharp-onnx",
                    licence: "research-only",
                    plyFlavour: "standard-3dgs",
                    gaussianCount: SHARP_GAUSSIAN_COUNT,
                  },
                }
              : {}),
          },
          variants: { original: url },
          ...(body.tags?.length ? { tags: body.tags } : {}),
        };
        // Strip undefined fields — Firestore rejects them.
        const cleaned: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(record)) {
          if (v !== undefined) cleaned[k] = v;
        }
        const db = requireFirebaseAdminDb();
        await db.collection("media").doc(mediaId).set(cleaned);
        outcomes.push({ fileId, ok: true, mediaId });
      } else {
        // ---- download mode (legacy default) -------------------------
        const { bytes, mimeType, filename } = await downloadFile(
          accessToken,
          fileId,
        );
        const kind = driveMediaKind(mimeType, filename);
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
      }
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
