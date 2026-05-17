/**
 * One-shot migration route: uploads VRMs from public/cards/<slug>/aura.vrm
 * (committed to git) to Firebase Storage at cards/<slug>/aura.vrm
 * (CDN-hosted, no longer in the repo).
 *
 * REMOVE THIS FILE AFTER THE MIGRATION COMPLETES. It is bearer-token
 * protected, but a route that writes to Storage doesn't need to outlive
 * its purpose.
 *
 * Usage:
 *   curl -X POST https://holoflow.co.uk/api/admin/migrate-vrm \
 *     -H "Authorization: Bearer $MIGRATE_TOKEN" \
 *     -H "Content-Type: application/json" \
 *     -d '{"slug":"dimona","sourceUrl":"https://holoflow.co.uk/cards/dimona/aura.vrm"}'
 *
 * Fetches the VRM from the same domain (zero-cost, edge-cached), uploads
 * it to Firebase Storage with a permanent download token, and returns
 * the public URL.
 */

import { NextResponse, type NextRequest } from "next/server";
import { withRouteLogging } from "lib/log";
import { randomUUID } from "node:crypto";
import { getFirebaseAdminStorage } from "lib/firebase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface MigrateBody {
  slug: string;
  sourceUrl: string;
  /** Storage path override. Defaults to `cards/<slug>/aura.vrm`. */
  destinationPath?: string;
  contentType?: string;
}

export const POST = withRouteLogging(
  "admin.migrate-vrm",
  async (req: NextRequest, _ctx, log) => {
    // Bearer auth — uses an env var we'll set on Vercel before invocation.
    const auth = req.headers.get("authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "").trim();
    const expected = process.env.MIGRATE_TOKEN;
    if (!expected) {
      log.error("MIGRATE_TOKEN env var not set — refusing all migration calls");
      return NextResponse.json(
        { error: "migration disabled (no token configured)" },
        { status: 503 },
      );
    }
    if (!token || token !== expected) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    let body: MigrateBody;
    try {
      body = (await req.json()) as MigrateBody;
    } catch {
      return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
    }

    if (!body.slug || !body.sourceUrl) {
      return NextResponse.json(
        { error: "slug and sourceUrl required" },
        { status: 400 },
      );
    }

    const destinationPath = body.destinationPath ?? `cards/${body.slug}/aura.vrm`;
    const contentType = body.contentType ?? "model/vrm";

    log.info("starting migration", {
      slug: body.slug,
      sourceUrl: body.sourceUrl,
      destinationPath,
    });

    // 1. Fetch the source file as a Buffer.
    const srcResp = await fetch(body.sourceUrl);
    if (!srcResp.ok) {
      return NextResponse.json(
        { error: `source fetch failed: ${srcResp.status} ${srcResp.statusText}` },
        { status: 502 },
      );
    }
    const arrayBuf = await srcResp.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    log.info("source fetched", { bytes: buf.length });

    // 2. Upload to Firebase Storage with a permanent download token.
    const storage = getFirebaseAdminStorage();
    if (!storage) {
      return NextResponse.json(
        { error: "firebase admin not configured" },
        { status: 503 },
      );
    }

    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET env not set" },
        { status: 503 },
      );
    }
    const bucket = storage.bucket(bucketName);

    const downloadToken = randomUUID();
    const file = bucket.file(destinationPath);

    await file.save(buf, {
      contentType,
      resumable: false,
      metadata: {
        contentType,
        cacheControl: "public, max-age=31536000, immutable",
        metadata: {
          // This token makes the file publicly fetchable via the
          // firebasestorage.googleapis.com download URL pattern. No
          // CORS config needed — Firebase serves the right headers.
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
    });

    log.info("upload complete", { destinationPath, bytes: buf.length });

    // 3. Build the canonical public URL.
    const encodedPath = encodeURIComponent(destinationPath);
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;

    return NextResponse.json({
      ok: true,
      slug: body.slug,
      bucket: bucket.name,
      destinationPath,
      bytes: buf.length,
      contentType,
      cacheControl: "public, max-age=31536000, immutable",
      publicUrl,
      note: "Update data/cards/<slug>.json ar.vrm to this publicUrl, then `git rm` the local file.",
    });
  },
);
