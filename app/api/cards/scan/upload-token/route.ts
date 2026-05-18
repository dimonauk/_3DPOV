/**
 * POST /api/cards/scan/upload-token — mint a short-lived Vercel Blob
 * upload token so a signed-in user's browser can upload a scanner
 * image directly to Blob, bypassing the 4.5 MB function body limit.
 *
 * Flow:
 *   1. Client gets a Firebase ID token via auth.user.getIdToken()
 *   2. Client calls @vercel/blob/client's upload() with
 *      handleUploadUrl pointing at this route + clientPayload
 *      = { firebaseToken }
 *   3. handleUpload calls onBeforeGenerateToken; we verify the
 *      Firebase token here and refuse if it's not valid
 *   4. handleUpload returns a one-shot token scoped to a single
 *      scan-temp/<uuid>.<ext> path
 *   5. Browser uploads file bytes directly to Blob; never touches
 *      this function
 *
 * After the scan completes (in /api/cards/scan), the temp Blob is
 * deleted. We never keep visitor scan images.
 */

// BOM-strip the Blob token at module load — Vercel env-var UI prepended
// a U+FEFF when the token was first pasted; @vercel/blob reads
// process.env.BLOB_READ_WRITE_TOKEN before we get a chance to clean it,
// so we mutate it pre-import.
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
import { verifyIdToken } from "lib/firebase/admin";
import { withRouteLogging, errToObject } from "lib/log";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

interface ClientPayload {
  /** Firebase ID token issued to a signed-in user. */
  firebaseToken: string;
}

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
];

export const POST = withRouteLogging(
  "cards.scan.upload-token",
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
          // Auth: verify the Firebase token from the client payload.
          let payload: ClientPayload | null = null;
          try {
            payload = clientPayloadRaw
              ? (JSON.parse(clientPayloadRaw) as ClientPayload)
              : null;
          } catch {
            payload = null;
          }
          if (!payload?.firebaseToken) {
            log.warn("auth:missing");
            throw new Error("unauthenticated");
          }
          let uid: string;
          try {
            uid = (await verifyIdToken(payload.firebaseToken)).uid;
          } catch (err) {
            log.warn("auth:invalid", { err: errToObject(err) });
            throw new Error("invalid_token");
          }

          // Path safety: the client picks the filename but we enforce
          // it lives under scan-temp/ and stays inside one folder.
          if (!pathname.startsWith("scan-temp/")) {
            log.warn("path:invalid", { pathname });
            throw new Error("pathname must live under scan-temp/");
          }
          if (pathname.includes("..") || pathname.split("/").length > 2) {
            log.warn("path:traversal", { pathname });
            throw new Error("invalid pathname");
          }

          log.info("token:issued", { pathname, uid });
          return {
            allowedContentTypes: ALLOWED_CONTENT_TYPES,
            addRandomSuffix: false,
            // No edge cache — these blobs live a few seconds at most.
            cacheControlMaxAge: 0,
            // Tag the token so we can correlate logs.
            tokenPayload: JSON.stringify({ uid, pathname }),
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
      return NextResponse.json(
        { error: "upload_token_failed", message },
        { status: 400 },
      );
    }
  },
);
