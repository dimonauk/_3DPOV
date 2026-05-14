/**
 * POST /api/cards/upload-glb
 *
 * Accepts a multipart upload of a single GLB file from a signed-in
 * user and stores it on Vercel Blob at a per-user prefix. Returns
 * the public URL so the client can plug it into card.ar.model.
 *
 * Auth: requires an Authorization: Bearer <FirebaseIdToken> header.
 *       The Firebase Admin SDK verifies the token; uid is used as the
 *       blob path prefix so users can never overwrite each other.
 *
 * Validation:
 *   - 10 MB max (well under Vercel Blob's 500 MB and serverless 4.5 MB
 *     request body limits combined with edge runtime tolerance).
 *   - Magic bytes must be 'glTF' (binary glTF 2.0 spec).
 *   - Filename is sanitised before being used in the storage path.
 *
 * Stored at: cards/<uid>/<timestamp>-<safe-filename>
 * (Per-user prefix; no slug yet because the card may not be saved
 * to Firestore at the moment of upload.)
 */

import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { verifyIdToken } from "lib/firebase/admin";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const GLB_MAGIC = "glTF";

export async function POST(req: Request) {
  // 1. Auth — Firebase ID token in Authorization header.
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or malformed Authorization header" },
      { status: 401 },
    );
  }
  const idToken = authHeader.slice("Bearer ".length).trim();
  if (!idToken) {
    return NextResponse.json({ error: "Empty token" }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await verifyIdToken(idToken);
    uid = decoded.uid;
  } catch (err) {
    console.warn("[upload-glb] token verify failed:", err);
    return NextResponse.json(
      { error: "Invalid or expired auth token. Sign in again." },
      { status: 401 },
    );
  }

  // 2. Check that Vercel Blob is configured.
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "Blob storage isn't configured on this deployment. Enable Vercel Blob in project settings.",
      },
      { status: 503 },
    );
  }

  // 3. Parse multipart body.
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (err) {
    return NextResponse.json(
      { error: "Could not parse multipart form data" },
      { status: 400 },
    );
  }
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json(
      { error: "Missing 'file' field in form data" },
      { status: 400 },
    );
  }

  // 4. Size check (we re-check after buffering, but failing fast here
  // saves moving bytes around for files we'll reject anyway).
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      {
        error: `File is ${Math.round(file.size / 1024 / 1024)} MB; the limit is ${MAX_SIZE_BYTES / 1024 / 1024} MB.`,
      },
      { status: 413 },
    );
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 });
  }

  // 5. Buffer the file and validate magic bytes (glTF 2.0 binary).
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length < 12) {
    return NextResponse.json(
      { error: "File too small to be a valid GLB" },
      { status: 400 },
    );
  }
  const magic = buffer.toString("ascii", 0, 4);
  if (magic !== GLB_MAGIC) {
    return NextResponse.json(
      {
        error: `Not a GLB file (magic bytes were "${magic}" — expected "glTF"). The designer accepts .glb only; .gltf with separate buffers won't work.`,
      },
      { status: 400 },
    );
  }
  // The next 4 bytes are version (uint32 LE), then total length (uint32 LE).
  const version = buffer.readUInt32LE(4);
  if (version !== 2) {
    return NextResponse.json(
      { error: `GLB version ${version} not supported; need glTF 2.0.` },
      { status: 400 },
    );
  }

  // 6. Build a safe storage path. We keep the basename for downloadability
  // ("model.glb" looks better in dev tools than "abc123.glb"), but prefix
  // with timestamp so re-uploads don't collide, and bracket it under the
  // user's uid so other users can never overwrite this file.
  const rawFilename =
    (formData.get("filename") as string | null) ?? "model.glb";
  const safeBasename =
    rawFilename
      .split("/")
      .pop()!
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/^\.+/, "")
      .slice(0, 64) || "model.glb";
  const path = `cards/${uid}/${Date.now()}-${safeBasename}`;

  // 7. Upload to Vercel Blob.
  let blob;
  try {
    blob = await put(path, buffer, {
      access: "public",
      contentType: "model/gltf-binary",
      addRandomSuffix: false,
    });
  } catch (err) {
    console.error("[upload-glb] Vercel Blob put() failed:", err);
    return NextResponse.json(
      { error: "Storage upload failed. Try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    url: blob.url,
    pathname: blob.pathname,
    size: file.size,
  });
}
