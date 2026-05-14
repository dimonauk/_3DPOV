/**
 * app/admin/upload/upload-pipeline.ts — Per-file pipeline for the
 * operator upload page.
 *
 * `inferKind` derives a sensible `MediaKind` from MIME / extension;
 * the operator can override before submission. `makeRow` builds the
 * initial Row state for a dropped File. `uploadRow` POSTs the file +
 * metadata to `/api/admin/media/upload` via XHR (so we can watch a
 * real progress bar — fetch's body stream doesn't give us a portable
 * upload progress callback yet).
 */

import type { MediaKind } from "lib/capabilities/media/library-types";

import type { Row } from "./upload-types";

/** Best-guess kind from MIME / extension. Operator can override. */
export function inferKind(file: File): MediaKind {
  const mime = (file.type || "").toLowerCase();
  const name = file.name.toLowerCase();
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("image/")) return "photo";
  if (name.endsWith(".glb") || name.endsWith(".gltf")) return "glb";
  if (name.endsWith(".usdz")) return "usdz";
  if (name.endsWith(".ply") || name.endsWith(".splat")) return "ply";
  return "other";
}

export function makeRow(file: File): Row {
  const titleFromName = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    title: titleFromName,
    description: "",
    subject: "photograph",
    mediaKind: inferKind(file),
    capturedAt: "",
    tags: "",
    locationSlug: "",
    locationName: "",
    locationLat: "",
    locationLng: "",
    status: { kind: "queued" },
  };
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function buildFormData(row: Row): FormData {
  const fd = new FormData();
  fd.append("file", row.file, row.file.name);
  fd.append("filename", row.file.name);
  fd.append("mimeType", row.file.type || "application/octet-stream");
  fd.append("subject", row.subject);
  fd.append("kind", row.mediaKind);
  if (row.title.trim()) fd.append("title", row.title.trim());
  if (row.description.trim()) fd.append("description", row.description.trim());
  if (row.capturedAt) {
    fd.append("capturedAt", new Date(row.capturedAt).toISOString());
  }
  const tagList = row.tags
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  if (tagList.length > 0) fd.append("tags", tagList.join(","));
  const location: Record<string, unknown> = {};
  if (row.locationSlug.trim()) location["slug"] = row.locationSlug.trim();
  if (row.locationName.trim()) location["name"] = row.locationName.trim();
  if (row.locationLat.trim()) {
    const lat = Number(row.locationLat);
    if (Number.isFinite(lat)) location["lat"] = lat;
  }
  if (row.locationLng.trim()) {
    const lng = Number(row.locationLng);
    if (Number.isFinite(lng)) location["lng"] = lng;
  }
  if (Object.keys(location).length > 0) {
    fd.append("location-json", JSON.stringify(location));
  }
  return fd;
}

export async function uploadRow(
  row: Row,
  idToken: string,
  onProgress: (percent: number) => void,
): Promise<{ id: string; url: string }> {
  const fd = buildFormData(row);
  return new Promise<{ id: string; url: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/media/upload", true);
    xhr.setRequestHeader("Authorization", `Bearer ${idToken}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        onProgress(Math.min(100, Math.round((e.loaded / e.total) * 100)));
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText) as
          | { media: { id: string; url: string } }
          | { error: string };
        if (xhr.status >= 200 && xhr.status < 300 && "media" in body) {
          resolve({ id: body.media.id, url: body.media.url });
        } else {
          const message =
            "error" in body && typeof body.error === "string"
              ? body.error
              : `HTTP ${xhr.status}`;
          reject(new Error(message));
        }
      } catch {
        reject(new Error(`HTTP ${xhr.status}`));
      }
    };
    xhr.send(fd);
  });
}
