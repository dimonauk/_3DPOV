/**
 * POST /api/admin/wardrobe/upload-token — issue a Vercel Blob upload
 * token for `wardrobe/<slug>.vrm` so the operator's browser can put
 * a new outfit VRM directly into Blob without round-tripping through
 * a 4.5 MB function body limit.
 *
 * Auth: admin-only — verifies the Firebase ID token + checks the
 * email against `isAdminEmail`. The wardrobe is a small global
 * registry; only studio operators should add to it.
 *
 * After the upload, the page POSTs to /api/admin/wardrobe to register
 * the metadata (and surface the snippet to paste into
 * data/wardrobe.json). The .vrm file itself stays in Blob at
 * `wardrobe/<slug>.vrm` permanently.
 */

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

import { isAdminEmail } from "lib/auth/admin-emails";
import { verifyIdToken } from "lib/firebase/admin";
import { withRouteLogging, errToObject } from "lib/log";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

interface ClientPayload {
  /** Firebase ID token issued to a signed-in admin user. */
  firebaseToken: string;
}

// VRM files are gltf-binary derivatives; Vercel Blob's content-type
// validation works against the MIME the browser advertises. .vrm files
// advertise as application/octet-stream from most file pickers; we
// accept both the canonical glb mime AND octet-stream.
const ALLOWED_CONTENT_TYPES = [
  "model/gltf-binary",
  "application/octet-stream",
];

export const POST = withRouteLogging(
  "admin.wardrobe.upload-token",
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
          let email: string | undefined;
          try {
            const claims = await verifyIdToken(payload.firebaseToken);
            uid = claims.uid;
            email = claims.email;
          } catch (err) {
            log.warn("auth:invalid", { err: errToObject(err) });
            throw new Error("invalid_token");
          }
          if (!isAdminEmail(email)) {
            log.warn("auth:not_admin", { email });
            throw new Error("not_admin");
          }

          // Path must live under wardrobe/ and end with .vrm.
          if (!pathname.startsWith("wardrobe/")) {
            log.warn("path:invalid", { pathname });
            throw new Error("pathname must live under wardrobe/");
          }
          if (pathname.includes("..") || pathname.split("/").length > 2) {
            log.warn("path:traversal", { pathname });
            throw new Error("invalid pathname");
          }
          if (!pathname.toLowerCase().endsWith(".vrm")) {
            log.warn("path:not_vrm", { pathname });
            throw new Error("pathname must end with .vrm");
          }

          log.info("token:issued", { pathname, uid, email });
          return {
            allowedContentTypes: ALLOWED_CONTENT_TYPES,
            addRandomSuffix: false,
            // Wardrobe outfits are content-addressable by slug and
            // edge-cached aggressively (same as other /cards/*.glb).
            cacheControlMaxAge: 60 * 60 * 24 * 365,
            tokenPayload: JSON.stringify({ uid, email, pathname }),
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
