/**
 * POST /api/cards/upload-usdz
 *
 * Companion to upload-glb: accepts a USDZ binary generated client-side
 * by three.js's USDZExporter and stores it alongside the matching GLB
 * on Vercel Blob. Lets iOS Quick Look render the model from the card
 * landing page without forcing a separate native USDZ pipeline.
 *
 * Auth: Bearer Firebase ID token, same as upload-glb.
 * Stored at: cards/<uid>/<timestamp>-<safe-basename>.usdz
 * Returns: { url, pathname, size }
 *
 * Validation:
 *   - 15 MB max (USDZ tends to be slightly larger than GLB)
 *   - Magic bytes: USDZ files are USDC archives in a ZIP container; the
 *     file starts with 'PK' (the standard ZIP signature). We don't go
 *     further than that — three.js generated this client-side from a
 *     GLB we just uploaded, so the trust path is short.
 */

import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { verifyIdToken } from "lib/firebase/admin";
import { createLogger, errToObject } from "lib/log";

const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

const log = createLogger("api.cards.upload-usdz");

export async function POST(req: Request) {
  // 1. Auth.
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
    log.warn("token verify failed", { err: errToObject(err) });
    return NextResponse.json(
      { error: "Invalid or expired auth token. Sign in again." },
      { status: 401 },
    );
  }

  // 2. Blob configured?
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "Blob storage isn't configured on this deployment. Enable Vercel Blob in project settings.",
      },
      { status: 503 },
    );
  }

  // 3. Form data.
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
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

  // 4. Size check.
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      {
        error: `USDZ is ${Math.round(file.size / 1024 / 1024)} MB; the limit is ${MAX_SIZE_BYTES / 1024 / 1024} MB.`,
      },
      { status: 413 },
    );
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 });
  }

  // 5. Magic bytes — USDZ is a ZIP archive, so it starts with "PK".
  const buffer = Buffer.from(await file.arrayBuffer());
  if (
    buffer.length < 4 ||
    buffer[0] !== 0x50 || // 'P'
    buffer[1] !== 0x4b // 'K'
  ) {
    return NextResponse.json(
      { error: "Not a USDZ file (missing ZIP signature)" },
      { status: 400 },
    );
  }

  // 6. Build the storage path. Use the GLB's basename so the pair are
  // discoverable from each other: cards/<uid>/<timestamp>-model.usdz.
  const rawFilename =
    (formData.get("filename") as string | null) ?? "model.usdz";
  const safeBasename =
    rawFilename
      .split("/")
      .pop()!
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/^\.+/, "")
      .slice(0, 64) || "model.usdz";
  // Ensure .usdz extension.
  const normalised = safeBasename.endsWith(".usdz")
    ? safeBasename
    : safeBasename.replace(/\.(glb|gltf)$/i, "") + ".usdz";
  const path = `cards/${uid}/${Date.now()}-${normalised}`;

  // 7. Upload.
  let blob;
  try {
    blob = await put(path, buffer, {
      access: "public",
      contentType: "model/vnd.usdz+zip",
      addRandomSuffix: false,
    });
  } catch (err) {
    log.error("Vercel Blob put() failed", { err: errToObject(err) });
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
