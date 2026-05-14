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
/** Standard set of fields we ask for; keeps response payloads small. */
const FILE_FIELDS =
  "id, name, mimeType, size, thumbnailLink, webViewLink, iconLink, createdTime, modifiedTime, parents";

function toDriveFile(f: drive_v3.Schema$File): DriveFile {
  return {
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

/** Map a Drive mimeType to a MediaKind we care about. */
export function driveMediaKind(
  mimeType: string,
): "photo" | "video" | "other" {
  const mt = mimeType.toLowerCase();
  if (mt.startsWith("image/")) return "photo";
  if (mt.startsWith("video/")) return "video";
  return "other";
}
