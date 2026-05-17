/**
 * One-shot migration route: uploads VRMs from public/cards/<slug>/aura.vrm
 * (committed to git) to Vercel Blob at cards/<slug>/aura.vrm (CDN-hosted,
 * no longer in the repo).
 *
 * REMOVE THIS FILE AFTER THE MIGRATION COMPLETES. Bearer-token gated,
 * but a route that writes to Blob doesn't need to outlive its purpose.
 *
 * Usage:
 *   curl -X POST https://holoflow.co.uk/api/admin/migrate-vrm \
 *     -H "Authorization: Bearer $MIGRATE_TOKEN" \
 *     -H "Content-Type: application/json" \
 *     -d '{"slug":"dimona","sourceUrl":"https://holoflow.co.uk/cards/dimona/aura.vrm"}'
 *
 * Why Vercel Blob and not Firebase Storage:
 *   The Firebase service account in this project's env is from a
 *   different GCP project (`gen-lang-client-...`) than the Firebase
 *   Storage bucket (`holoflow-studio`). Cross-project IAM hasn't
 *   been granted. Vercel Blob is already configured for this project
 *   (BLOB_READ_WRITE_TOKEN is set) and serves identical needs: public
 *   CDN-hosted binary assets with permanent URLs. Same outcome, none
 *   of the IAM friction.
 *
 *   The BOM-strip fix in lib/firebase/admin.ts still lands — that
 *   resurrects Firestore writes (leads, conversation history) which
 *   were previously failing silently due to invalid JSON.
 */

import { NextResponse, type NextRequest } from "next/server";
import { withRouteLogging } from "lib/log";
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface MigrateBody {
  slug: string;
  sourceUrl: string;
  /** Blob path override. Defaults to `cards/<slug>/aura.vrm`. */
  destinationPath?: string;
  contentType?: string;
}

export const POST = withRouteLogging(
  "admin.migrate-vrm",
  async (req: NextRequest, _ctx, log) => {
    // Bearer auth.
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

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "BLOB_READ_WRITE_TOKEN env not set" },
        { status: 503 },
      );
    }

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

    // 2. Upload to Vercel Blob with public access.
    //    addRandomSuffix:false → predictable pathname (no UUID suffix);
    //    allowOverwrite:true   → re-running the migration replaces in place.
    try {
      const blob = await put(destinationPath, buf, {
        access: "public",
        contentType,
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 31536000, // 1 year — CDN edge cache
      });

      log.info("upload complete", {
        destinationPath,
        bytes: buf.length,
        url: blob.url,
      });

      return NextResponse.json({
        ok: true,
        slug: body.slug,
        destinationPath,
        bytes: buf.length,
        contentType,
        cacheControl: "public, max-age=31536000, immutable",
        publicUrl: blob.url,
        downloadUrl: blob.downloadUrl,
        note: "Update data/cards/<slug>.json ar.vrm to publicUrl, then `git rm` the local file.",
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      log.error("upload failed", { destinationPath, error: message });
      return NextResponse.json(
        { error: "upload_failed", message, destinationPath },
        { status: 502 },
      );
    }
  },
);

/**
 * Diagnostic GET handler — bearer-token gated. Reports whether the
 * env vars Vercel Blob needs are present.
 */
export const GET = withRouteLogging(
  "admin.migrate-vrm.diag",
  async (req: NextRequest, _ctx, _log) => {
    const auth = req.headers.get("authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "").trim();
    const expected = process.env.MIGRATE_TOKEN;
    if (!expected || !token || token !== expected) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      blobTokenPresent: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      blobTokenLength: process.env.BLOB_READ_WRITE_TOKEN?.length ?? 0,
      migrateTokenPresent: Boolean(process.env.MIGRATE_TOKEN),
    });
  },
);
