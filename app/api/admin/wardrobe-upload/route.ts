/**
 * Server-side handleUpload endpoint for browser-direct Blob uploads.
 *
 * The drag-drop page at /admin/wardrobe-upload calls @vercel/blob/client's
 * upload() which uses this endpoint as the token mint. The file bytes
 * never touch this function — they go browser→Blob direct, avoiding the
 * 4.5MB function body limit.
 *
 * Bearer-gated by MIGRATE_TOKEN (same admin auth as the original
 * migrate-vrm route).
 *
 * REMOVE AFTER WARDROBE IS UPLOADED. The route should not outlive its
 * one-shot purpose.
 */

// BOM-strip the Blob token at module load — Vercel's env-var UI added
// a leading U+FEFF when the token was pasted, which breaks the
// Authorization header (fetch refuses non-Latin-1 chars in headers).
// @vercel/blob's handleUpload reads process.env.BLOB_READ_WRITE_TOKEN
// internally, so we have to mutate it before the SDK looks at it.
if (
  typeof process !== "undefined" &&
  process.env.BLOB_READ_WRITE_TOKEN &&
  process.env.BLOB_READ_WRITE_TOKEN.charCodeAt(0) === 0xfeff
) {
  process.env.BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN.slice(
    1,
  ).trim();
}

import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse, type NextRequest } from "next/server";
import { withRouteLogging } from "lib/log";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface ClientPayload {
  /** Caller-provided bearer (we don't want @vercel/blob's default flow
   * fighting our admin gate). Matched against MIGRATE_TOKEN env. */
  adminToken: string;
}

export const POST = withRouteLogging(
  "admin.wardrobe-upload",
  async (req: NextRequest, _ctx, log) => {
    const body = (await req.json()) as HandleUploadBody;

    try {
      const jsonResponse = await handleUpload({
        body,
        request: req,
        onBeforeGenerateToken: async (
          pathname: string,
          clientPayloadRaw: string | null,
        ) => {
          // Auth check — adminToken must match MIGRATE_TOKEN env.
          let payload: ClientPayload | null = null;
          try {
            payload = clientPayloadRaw
              ? (JSON.parse(clientPayloadRaw) as ClientPayload)
              : null;
          } catch {
            payload = null;
          }
          const expected = process.env.MIGRATE_TOKEN;
          if (!expected) {
            throw new Error("MIGRATE_TOKEN not configured");
          }
          if (!payload?.adminToken || payload.adminToken !== expected) {
            log.warn("auth:invalid", { pathname });
            throw new Error("unauthorized");
          }

          log.info("token:issued", { pathname });
          return {
            allowedContentTypes: [
              "application/octet-stream",
              "model/vrm",
              "model/gltf-binary",
            ],
            addRandomSuffix: false,
            // 1 year edge cache — VRMs are immutable per filename.
            cacheControlMaxAge: 31536000,
            tokenPayload: JSON.stringify({ pathname }),
          };
        },
        onUploadCompleted: async ({ blob, tokenPayload }) => {
          log.info("upload:completed", {
            url: blob.url,
            pathname: blob.pathname,
            tokenPayload,
          });
        },
      });

      return NextResponse.json(jsonResponse);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      log.error("handleUpload:failed", { error: message });
      return NextResponse.json({ error: message }, { status: 400 });
    }
  },
);
