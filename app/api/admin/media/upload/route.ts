/**
 * app/api/admin/media/upload/route.ts — Operator media upload endpoint.
 *
 * Multipart POST. Verifies the Firebase ID token from
 * `Authorization: Bearer <token>`, checks the email against the
 * operator allow-list, then forwards bytes + metadata to
 * `mediaUpload()`. Returns the created Media record (or an error JSON).
 *
 * Future cleanup: lift the allow-list to env (`ADMIN_EMAILS`).
 */

import { NextResponse } from "next/server";
import { verifyIdToken } from "lib/firebase/admin";
import { mediaUpload } from "lib/capabilities/media/library";
import {
  MediaLibraryError,
  type MediaKind,
  type MediaLocation,
  type MediaSubject,
  type MediaUploadInput,
} from "lib/capabilities/media/library-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Operator uploads can be large (4K stills, video). Allow up to ~250MB.
export const maxDuration = 300;

const ADMIN_EMAILS = new Set<string>(["dimonauk@gmail.com"]);

const KINDS: ReadonlySet<MediaKind> = new Set([
  "photo",
  "photo-single-exposure",
  "video",
  "360-photo",
  "360-video",
  "sbs-stereo-mp4",
  "usdz",
  "glb",
  "ply",
  "audio",
  "pdf",
  "other",
]);

const SUBJECTS: ReadonlySet<MediaSubject> = new Set([
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

function extractBearer(req: Request): string | null {
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!header) return null;
  const m = /^Bearer\s+(.+)$/i.exec(header);
  return m && m[1] ? m[1].trim() : null;
}

function asString(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function parseLocation(raw: string | undefined): MediaLocation | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: MediaLocation = {};
    if (typeof parsed["slug"] === "string") out.slug = parsed["slug"];
    if (typeof parsed["name"] === "string") out.name = parsed["name"];
    if (typeof parsed["lat"] === "number" && Number.isFinite(parsed["lat"])) {
      out.lat = parsed["lat"];
    }
    if (typeof parsed["lng"] === "number" && Number.isFinite(parsed["lng"])) {
      out.lng = parsed["lng"];
    }
    return Object.keys(out).length > 0 ? out : undefined;
  } catch {
    return undefined;
  }
}

export async function POST(req: Request) {
  // --- AuthN -----------------------------------------------------------
  const token = extractBearer(req);
  if (!token) {
    return NextResponse.json(
      { error: "Missing Authorization: Bearer <idToken>" },
      { status: 401 },
    );
  }

  let decoded: { uid: string; email: string | undefined };
  try {
    decoded = await verifyIdToken(token);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Token verification failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  if (!decoded.email || !ADMIN_EMAILS.has(decoded.email.toLowerCase())) {
    return NextResponse.json(
      { error: "Not authorised for operator routes" },
      { status: 403 },
    );
  }

  // --- Form parse ------------------------------------------------------
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data body" },
      { status: 400 },
    );
  }

  const fileEntry = form.get("file");
  // The DOM `File` global doesn't narrow cleanly under the older
  // `target: es2015` lib, so duck-type instead: a real FormData file
  // entry is always a Blob-like object with an `arrayBuffer()` method.
  const isBlobLike = (
    v: FormDataEntryValue | null,
  ): v is FormDataEntryValue & Blob =>
    v !== null &&
    typeof v !== "string" &&
    typeof (v as { arrayBuffer?: unknown }).arrayBuffer === "function";
  if (!isBlobLike(fileEntry)) {
    return NextResponse.json(
      { error: "Missing `file` field (binary)" },
      { status: 400 },
    );
  }
  const file = fileEntry;
  const fileName: string | undefined =
    typeof (file as { name?: unknown }).name === "string"
      ? (file as { name: string }).name
      : undefined;

  const filenameRaw = asString(form.get("filename"));
  const filename = filenameRaw ?? fileName ?? "upload.bin";

  const mimeType =
    asString(form.get("mimeType")) ??
    (typeof file.type === "string" && file.type.length > 0 ? file.type : undefined) ??
    "application/octet-stream";

  const subjectRaw = asString(form.get("subject"));
  if (!subjectRaw || !SUBJECTS.has(subjectRaw as MediaSubject)) {
    return NextResponse.json(
      { error: `Invalid or missing 'subject' (got: ${subjectRaw ?? "(none)"})` },
      { status: 400 },
    );
  }
  const subject = subjectRaw as MediaSubject;

  const kindRaw = asString(form.get("kind"));
  if (!kindRaw || !KINDS.has(kindRaw as MediaKind)) {
    return NextResponse.json(
      { error: `Invalid or missing 'kind' (got: ${kindRaw ?? "(none)"})` },
      { status: 400 },
    );
  }
  const kind = kindRaw as MediaKind;

  const title = asString(form.get("title"));
  const description = asString(form.get("description"));
  const capturedAt = asString(form.get("capturedAt"));

  const tagsRaw = asString(form.get("tags"));
  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
    : undefined;

  const location = parseLocation(asString(form.get("location-json")));

  // --- Compose & upload -----------------------------------------------
  const input: MediaUploadInput = {
    file,
    filename,
    mimeType,
    kind,
    subject,
    uploadedBy: decoded.uid,
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(capturedAt !== undefined && { capturedAt }),
    ...(tags !== undefined && { tags }),
    ...(location !== undefined && { location }),
  };

  try {
    const media = await mediaUpload(input);
    return NextResponse.json({ media });
  } catch (err) {
    if (err instanceof MediaLibraryError) {
      const status =
        err.code === "not-configured"
          ? 503
          : err.code === "not-authenticated"
            ? 401
            : err.code === "not-found"
              ? 404
              : 500;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/admin/media/upload] failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
