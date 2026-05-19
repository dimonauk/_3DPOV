/**
 * POST /api/admin/assets/upload-token — issue a Vercel Blob upload
 * token for `assets/<id>.<format>` so the operator can put a registry
 * asset directly into Blob without round-tripping through the 4.5 MB
 * function body limit.
 *
 * Auth: admin-only via Firebase ID token + isAdminEmail. Same pattern
 * as /api/admin/wardrobe/upload-token, but writes to the generic
 * `assets/` Blob prefix instead of `wardrobe/`.
 *
 * Pairs with /admin/assets which the operator uses to register the
 * upload + generate a snippet for data/assets.json.
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
import { head as blobHead } from "@vercel/blob";
import { NextResponse, type NextRequest } from "next/server";

import { isAdminEmail } from "lib/auth/admin-emails";
import { verifyIdToken } from "lib/firebase/admin";
import { withRouteLogging, errToObject } from "lib/log";
import assetsData from "../../../../../data/assets.json";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

interface ClientPayload {
  firebaseToken: string;
}

// Permissive content-type list — registry assets cover meshes,
// textures, video, archives. The pathname guard below catches abuse.
const ALLOWED_CONTENT_TYPES = [
  "model/gltf-binary",
  "model/gltf+json",
  "model/stl",
  "model/vnd.usdz+zip",
  "application/octet-stream",
  "application/zip",
  "application/x-tar",
  "application/gzip",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
  "text/plain",
];

// File-extension whitelist. Anything not listed here can't be uploaded
// via this endpoint — the operator can hand-edit assets.json for an
// asset hosted somewhere else and skip the Blob round-trip entirely.
const ALLOWED_EXTENSIONS = new Set([
  "glb",
  "gltf",
  "obj",
  "stl",
  "ply",
  "usdz",
  "vrm",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "mp4",
  "webm",
  "mp3",
  "wav",
  "zip",
  "tar",
  "gz",
  "txt",
]);

export const POST = withRouteLogging(
  "admin.assets.upload-token",
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

          if (!pathname.startsWith("assets/")) {
            log.warn("path:invalid", { pathname });
            throw new Error("pathname must live under assets/");
          }
          if (pathname.includes("..") || pathname.split("/").length > 2) {
            log.warn("path:traversal", { pathname });
            throw new Error("invalid pathname");
          }
          const filename = pathname.replace(/^assets\//, "");
          const ext = filename.split(".").pop()?.toLowerCase() ?? "";
          if (!ALLOWED_EXTENSIONS.has(ext)) {
            log.warn("path:bad_ext", { pathname, ext });
            throw new Error(
              `extension "${ext}" not allowed — add it to ALLOWED_EXTENSIONS if you need it`,
            );
          }
          const id = filename.replace(/\.[^.]+$/, "");
          if (!/^[a-z][a-z0-9-]{1,63}$/.test(id)) {
            log.warn("path:bad_id", { id });
            throw new Error(
              `id "${id}" must be kebab-case, 2-64 chars, starting with a letter`,
            );
          }

          // Collision guard against the static registry and against any
          // existing blob with the same path. Registry ids are immutable.
          const existingInRegistry = assetsData.assets.find(
            (a) => a.id === id,
          );
          if (existingInRegistry) {
            log.warn("id:in_registry", { id });
            throw new Error(
              `id "${id}" already exists in data/assets.json — pick another or delete the existing entry first`,
            );
          }
          try {
            const existing = await blobHead(pathname);
            if (existing) {
              log.warn("path:in_blob", { pathname, url: existing.url });
              throw new Error(
                `"${pathname}" already exists in Blob — pick another id or delete the existing blob first`,
              );
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (!msg.includes("not found") && !msg.includes("404")) {
              throw err;
            }
          }

          log.info("token:issued", { pathname, uid, email });
          return {
            allowedContentTypes: ALLOWED_CONTENT_TYPES,
            addRandomSuffix: false,
            // Registry assets are content-addressable by id slug, same
            // policy as wardrobe — long edge cache, immutable bytes.
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
