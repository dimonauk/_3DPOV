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


/**
 * Diagnostic GET handler — bearer-token gated. Reports whether the env
 * vars Firebase Admin needs are present and parse correctly. Use this
 * to debug "firebase admin not configured" errors without exposing the
 * secrets themselves.
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

    const sa = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;
    const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

    const diag: Record<string, unknown> = {
      saPresent: Boolean(sa),
      saLength: sa?.length ?? 0,
      bucketPresent: Boolean(bucket),
      bucketValue: bucket ?? null,
      saJsonValid: false,
      saHasProjectId: false,
      saHasClientEmail: false,
      saHasPrivateKey: false,
      saProjectId: null as string | null,
    };

    if (sa) {
      diag.saFirst60 = sa.slice(0, 60);
      diag.saLast60 = sa.slice(-60);
      diag.saCountLF = (sa.match(/\n/g) ?? []).length;
      diag.saCountCR = (sa.match(/\r/g) ?? []).length;
      diag.saCountEscapedN = (sa.match(/\\n/g) ?? []).length;
      diag.saCountUnescapedQuotes = sa.split('"').length - 1;

      // Try direct parse first.
      try {
        const parsed = JSON.parse(sa) as Record<string, unknown>;
        diag.saJsonValid = true;
        diag.saHasProjectId = typeof parsed["project_id"] === "string";
        diag.saHasClientEmail = typeof parsed["client_email"] === "string";
        diag.saHasPrivateKey = typeof parsed["private_key"] === "string";
        diag.saProjectId = (parsed["project_id"] as string) ?? null;
      } catch (e) {
        diag.saJsonValid = false;
        diag.saParseError = e instanceof Error ? e.message : String(e);
      }

      // Try the multiline-tolerant parser (same logic as loadCredential).
      const fixSa = (raw: string) => {
        let result = "";
        let inString = false;
        let escapeNext = false;
        for (const ch of raw) {
          if (escapeNext) { result += ch; escapeNext = false; continue; }
          if (ch === "\\") { result += ch; escapeNext = true; continue; }
          if (ch === '"') { result += ch; inString = !inString; continue; }
          if (inString) {
            if (ch === "\n") { result += "\\n"; continue; }
            if (ch === "\r") { result += "\\r"; continue; }
            if (ch === "\t") { result += "\\t"; continue; }
          }
          result += ch;
        }
        return result;
      };
      try {
        const fixed = fixSa(sa);
        const parsed = JSON.parse(fixed) as Record<string, unknown>;
        diag.fixedParseValid = true;
        diag.fixedHasProjectId = typeof parsed["project_id"] === "string";
        diag.fixedProjectId = (parsed["project_id"] as string) ?? null;
      } catch (e) {
        diag.fixedParseValid = false;
        diag.fixedParseError = e instanceof Error ? e.message : String(e);
      }
    }

    // Try the actual admin getter — should be null if anything above is wrong.
    const storage = getFirebaseAdminStorage();
    diag.storageInitialised = storage !== null;

    return NextResponse.json(diag);
  },
);