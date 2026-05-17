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
import { put, list, del } from "@vercel/blob";

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

    let blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      return NextResponse.json(
        { error: "BLOB_READ_WRITE_TOKEN env not set" },
        { status: 503 },
      );
    }
    // The BLOB_READ_WRITE_TOKEN value pasted into Vercel's env-var UI
    // has a UTF-8 BOM at byte 0 (same issue as FIREBASE_ADMIN_SERVICE_ACCOUNT).
    // fetch() chokes on it when setting the Authorization header with
    // "Cannot convert argument to a ByteString". Strip it before use.
    if (blobToken.charCodeAt(0) === 0xfeff) blobToken = blobToken.slice(1);
    blobToken = blobToken.trim();

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
        token: blobToken, // explicit override, BOM stripped
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

    let tok = process.env.BLOB_READ_WRITE_TOKEN;
    if (tok && tok.charCodeAt(0) === 0xfeff) tok = tok.slice(1);
    tok = tok?.trim();

    const url = new URL(req.url);
    const wantList = url.searchParams.get("list") === "1";

    const base: Record<string, unknown> = {
      blobTokenPresent: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      blobTokenLength: process.env.BLOB_READ_WRITE_TOKEN?.length ?? 0,
      blobTokenHasBOM:
        process.env.BLOB_READ_WRITE_TOKEN
          ? process.env.BLOB_READ_WRITE_TOKEN.charCodeAt(0) === 0xfeff
          : false,
      migrateTokenPresent: Boolean(process.env.MIGRATE_TOKEN),
    };

    if (wantList && tok) {
      try {
        const { blobs, cursor, hasMore } = await list({ token: tok, limit: 100 });
        let totalBytes = 0;
        for (const b of blobs) totalBytes += b.size;
        base["blobCount"] = blobs.length;
        base["totalBytes"] = totalBytes;
        base["totalMB"] = +(totalBytes / 1_000_000).toFixed(2);
        base["hasMore"] = hasMore;
        base["cursor"] = cursor;
        base["blobs"] = blobs.map((b) => ({
          pathname: b.pathname,
          size: b.size,
          uploadedAt: b.uploadedAt,
          url: b.url,
        }));
      } catch (e) {
        base["listError"] = e instanceof Error ? e.message : String(e);
      }
    }

    return NextResponse.json(base);
  },
);


/**
 * DELETE handler — bearer-token gated. Removes specific blobs by URL.
 * Body: { urls: string[] }
 *
 * Removes one or more blobs from the Vercel Blob store. Use this to
 * clean up duplicate or stale uploads when the quota fills.
 *
 * Usage:
 *   curl -X DELETE https://holoflow.co.uk/api/admin/migrate-vrm \
 *     -H "Authorization: Bearer $MIGRATE_TOKEN" \
 *     -H "Content-Type: application/json" \
 *     -d '{"urls":["https://....public.blob.vercel-storage.com/..."]}'
 */
export const DELETE = withRouteLogging(
  "admin.migrate-vrm.delete",
  async (req: NextRequest, _ctx, log) => {
    const auth = req.headers.get("authorization") ?? "";
    const tokenHeader = auth.replace(/^Bearer\s+/i, "").trim();
    const expected = process.env.MIGRATE_TOKEN;
    if (!expected || !tokenHeader || tokenHeader !== expected) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    let body: { urls?: string[] };
    try {
      body = (await req.json()) as { urls?: string[] };
    } catch {
      return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
    }

    if (!body.urls || !Array.isArray(body.urls) || body.urls.length === 0) {
      return NextResponse.json(
        { error: "urls array required" },
        { status: 400 },
      );
    }

    let blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      return NextResponse.json(
        { error: "BLOB_READ_WRITE_TOKEN env not set" },
        { status: 503 },
      );
    }
    if (blobToken.charCodeAt(0) === 0xfeff) blobToken = blobToken.slice(1);
    blobToken = blobToken.trim();

    log.info("deleting blobs", { count: body.urls.length });

    try {
      await del(body.urls, { token: blobToken });
      return NextResponse.json({
        ok: true,
        deleted: body.urls.length,
        urls: body.urls,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      log.error("delete failed", { error: message });
      return NextResponse.json(
        { error: "delete_failed", message },
        { status: 502 },
      );
    }
  },
);
