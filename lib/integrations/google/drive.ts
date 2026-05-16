/**
 * lib/integrations/google/drive.ts — Google Drive API v3 helpers.
 *
 * One-line role: list folder contents, list root folders, get + download
 * files. Filtered to image/video MIME types by default, since the
 * studio's archive is exclusively media.
 *
 * Full OAuth still works for Drive — `drive.readonly` is the scope we
 * request (see `./oauth.ts`).
 *
 * Uses the `googleapis` package so we get proper typings + automatic
 * media download. The OAuth2 client is set up per-call with the
 * operator's access token so we never share auth state.
 */

import "server-only";

import { google } from "googleapis";
import type { Auth, drive_v3 } from "googleapis";

type OAuth2Client = Auth.OAuth2Client;

export type DriveImageMediaMetadata = {
  width?: number;
  height?: number;
  rotation?: number;
  cameraMake?: string;
  cameraModel?: string;
};

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  thumbnailLink?: string;
  webViewLink?: string;
  iconLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  parents?: string[];
  isFolder: boolean;
  /** Drive's pre-extracted image metadata. Avoids downloading the file
   *  bytes just to learn width/height — the printability filter rides
   *  on this. Only present for images. */
  imageMediaMetadata?: DriveImageMediaMetadata;
};

export type DriveFolder = DriveFile & { isFolder: true };

export type ListFolderResult = {
  files: DriveFile[];
  nextPageToken?: string;
};

function makeAuth(accessToken: string): OAuth2Client {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return auth;
}

function makeDrive(accessToken: string): drive_v3.Drive {
  return google.drive({ version: "v3", auth: makeAuth(accessToken) });
}

const FOLDER_MIME = "application/vnd.google-apps.folder";
/** Standard set of fields we ask for; keeps response payloads small.
 *  `imageMediaMetadata` lets the print-check verdict ride on the list
 *  call — width/height + camera make/model without downloading bytes. */
const FILE_FIELDS =
  "id, name, mimeType, size, thumbnailLink, webViewLink, iconLink, createdTime, modifiedTime, parents, imageMediaMetadata(width, height, rotation, cameraMake, cameraModel)";

function toDriveFile(f: drive_v3.Schema$File): DriveFile {
  const out: DriveFile = {
    id: f.id ?? "",
    name: f.name ?? "(untitled)",
    mimeType: f.mimeType ?? "application/octet-stream",
    size: typeof f.size === "string" ? Number(f.size) : undefined,
    thumbnailLink: f.thumbnailLink ?? undefined,
    webViewLink: f.webViewLink ?? undefined,
    iconLink: f.iconLink ?? undefined,
    createdTime: f.createdTime ?? undefined,
    modifiedTime: f.modifiedTime ?? undefined,
    parents: f.parents ?? undefined,
    isFolder: f.mimeType === FOLDER_MIME,
  };
  const meta = f.imageMediaMetadata;
  if (meta) {
    const imageMeta: DriveImageMediaMetadata = {};
    if (typeof meta.width === "number") imageMeta.width = meta.width;
    if (typeof meta.height === "number") imageMeta.height = meta.height;
    if (typeof meta.rotation === "number") imageMeta.rotation = meta.rotation;
    if (typeof meta.cameraMake === "string") imageMeta.cameraMake = meta.cameraMake;
    if (typeof meta.cameraModel === "string") imageMeta.cameraModel = meta.cameraModel;
    if (Object.keys(imageMeta).length > 0) out.imageMediaMetadata = imageMeta;
  }
  return out;
}

/**
 * List the contents of a folder. Includes both subfolders and media
 * files (images + videos) by default. The operator UI can filter
 * further client-side.
 *
 * Pass `folderId = "root"` for the user's My Drive root.
 */
export async function listFolderContents(
  accessToken: string,
  folderId: string,
  opts: { mediaOnly?: boolean; pageToken?: string; pageSize?: number } = {},
): Promise<ListFolderResult> {
  const drive = makeDrive(accessToken);
  const filters = [`'${folderId}' in parents`, "trashed = false"];
  if (opts.mediaOnly) {
    filters.push(
      `(mimeType contains 'image/' or mimeType contains 'video/' or mimeType = '${FOLDER_MIME}')`,
    );
  }
  const res = await drive.files.list({
    q: filters.join(" and "),
    fields: `nextPageToken, files(${FILE_FIELDS})`,
    pageSize: opts.pageSize ?? 100,
    pageToken: opts.pageToken,
    orderBy: "folder, name",
    spaces: "drive",
    // Include items in shared drives the user has access to:
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  const files = (res.data.files ?? []).map(toDriveFile);
  return { files, nextPageToken: res.data.nextPageToken ?? undefined };
}

/**
 * List the top-level folders the user owns (root of My Drive). Useful
 * for the initial Drive browser landing state.
 */
export async function listRootFolders(
  accessToken: string,
): Promise<{ folders: DriveFolder[] }> {
  const { files } = await listFolderContents(accessToken, "root", {
    mediaOnly: false,
  });
  return {
    folders: files.filter((f): f is DriveFolder => f.isFolder),
  };
}

/** Fetch a single file's metadata. */
export async function getFile(
  accessToken: string,
  fileId: string,
): Promise<DriveFile> {
  const drive = makeDrive(accessToken);
  const res = await drive.files.get({
    fileId,
    fields: FILE_FIELDS,
    supportsAllDrives: true,
  });
  return toDriveFile(res.data);
}

/**
 * Grant anyone-with-link reader access on a file. Required when the
 * file's `url` will be served to unauthenticated browser visitors via
 * the Drive API public-key download path. No-ops cleanly if the file
 * is already publicly shared.
 */
export async function shareFilePublic(
  accessToken: string,
  fileId: string,
): Promise<void> {
  const drive = makeDrive(accessToken);
  try {
    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
      supportsAllDrives: true,
    });
  } catch (err) {
    // Idempotent: Drive returns 400/409 when the permission already
    // exists — that's the desired post-state.
    const message = err instanceof Error ? err.message : String(err);
    if (!/already|exists|duplicate/i.test(message)) throw err;
  }
}

/**
 * Build the public-readable download URL for a Drive file. Browser-side
 * fetch goes here, bypassing Vercel egress entirely.
 *
 * Requires `NEXT_PUBLIC_DRIVE_API_KEY` to be set (a Google Cloud API key
 * restricted to Drive API + our domains). Without it we fall back to
 * the user-facing `uc?export=download` URL, which works for files under
 * 100 MB but shows a virus-scan interstitial above that threshold.
 */
export function publicDriveUrl(fileId: string): string {
  const key = process.env.NEXT_PUBLIC_DRIVE_API_KEY ?? "";
  if (key.length > 0) {
    return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${key}`;
  }
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Find or create a folder by name at the root of the operator's Drive.
 * Cheap: returns the existing folder id on subsequent calls.
 *
 * Requires the `drive.file` scope (we create the folder; subsequent
 * file uploads land inside it).
 */
export async function ensureFolder(
  accessToken: string,
  name: string,
): Promise<string> {
  const drive = makeDrive(accessToken);
  const safe = name.replace(/'/g, "\\'");
  const q =
    `name = '${safe}' and mimeType = '${FOLDER_MIME}' and trashed = false`;
  const list = await drive.files.list({
    q,
    fields: "files(id, name)",
    pageSize: 10,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  const existing = (list.data.files ?? [])[0];
  if (existing?.id) return existing.id;

  const created = await drive.files.create({
    requestBody: { name, mimeType: FOLDER_MIME },
    fields: "id",
    supportsAllDrives: true,
  });
  if (!created.data.id) {
    throw new Error(`drive.ensureFolder: create returned no id for "${name}"`);
  }
  return created.data.id;
}

/**
 * Upload bytes as a new file in the operator's Drive. The googleapis
 * client picks resumable / multipart automatically based on body size.
 *
 * Requires the `drive.file` scope. The resulting file is owned by the
 * operator and counts against the operator's Drive quota.
 *
 * @param parentFolderId - Drive folder to land the file in. Pass `"root"`
 *   for the operator's My Drive root.
 */
export async function uploadFileToDrive(
  accessToken: string,
  args: {
    bytes: Uint8Array;
    mimeType: string;
    filename: string;
    parentFolderId: string;
  },
): Promise<{ fileId: string; webContentLink?: string }> {
  // The googleapis client wants a Readable stream for the body. Wrap the
  // Uint8Array — Node's Readable.from handles BufferSource directly.
  const { Readable } = await import("node:stream");
  const buffer = Buffer.from(args.bytes);
  const stream = Readable.from(buffer);

  const drive = makeDrive(accessToken);
  const created = await drive.files.create({
    requestBody: {
      name: args.filename,
      parents: [args.parentFolderId],
      mimeType: args.mimeType,
    },
    media: { mimeType: args.mimeType, body: stream },
    fields: "id, webContentLink, size",
    supportsAllDrives: true,
  });
  if (!created.data.id) {
    throw new Error(`drive.uploadFileToDrive: create returned no id`);
  }
  return {
    fileId: created.data.id,
    webContentLink: created.data.webContentLink ?? undefined,
  };
}

/**
 * Download a file's bytes. Uses alt=media (the standard Drive download
 * mode). For Google-native types (Docs, Sheets, etc.) this throws —
 * media imports only deal with binary files.
 */
export async function downloadFile(
  accessToken: string,
  fileId: string,
): Promise<{ bytes: Uint8Array; mimeType: string; filename: string }> {
  const drive = makeDrive(accessToken);
  const meta = await drive.files.get({
    fileId,
    fields: "id, name, mimeType",
    supportsAllDrives: true,
  });
  const mimeType = meta.data.mimeType ?? "application/octet-stream";
  const filename = meta.data.name ?? fileId;
  if (mimeType.startsWith("application/vnd.google-apps.")) {
    throw new Error(
      `drive.downloadFile: ${fileId} is a Google-native type (${mimeType}); not supported in the media importer.`,
    );
  }
  const dl = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "arraybuffer" },
  );
  // The googleapis client returns `unknown` here at the type level; in
  // practice it is an ArrayBuffer-shaped value because we asked for it.
  const data = dl.data as unknown;
  let bytes: Uint8Array;
  if (data instanceof ArrayBuffer) {
    bytes = new Uint8Array(data);
  } else if (data instanceof Uint8Array) {
    bytes = data;
  } else if (typeof Buffer !== "undefined" && Buffer.isBuffer(data)) {
    bytes = new Uint8Array(
      (data as Buffer).buffer,
      (data as Buffer).byteOffset,
      (data as Buffer).byteLength,
    );
  } else {
    throw new Error(
      `drive.downloadFile: unexpected payload shape for ${fileId} (${typeof data}).`,
    );
  }
  return { bytes, mimeType, filename };
}

import type { MediaKind } from "lib/capabilities/media/library-types";

/**
 * Map a Drive `(mimeType, filename)` pair to a {@link MediaKind}. Drive
 * routinely reports `application/octet-stream` for the formats that
 * matter most to the studio (.ply, .glb, .usdz), so the filename is the
 * tie-breaker.
 */
export function driveMediaKind(
  mimeType: string,
  filename: string = "",
): MediaKind {
  const mt = mimeType.toLowerCase();
  const name = filename.toLowerCase();

  if (mt.startsWith("image/")) return "photo";
  if (mt.startsWith("video/")) return "video";
  if (mt.startsWith("audio/")) return "audio";
  if (mt === "application/pdf") return "pdf";

  // Binary 3D / spatial formats — Drive almost always reports these as
  // octet-stream, so filename is authoritative.
  if (name.endsWith(".ply") || name.endsWith(".splat")) return "ply";
  if (name.endsWith(".glb") || name.endsWith(".gltf")) return "glb";
  if (name.endsWith(".usdz")) return "usdz";

  return "other";
}
