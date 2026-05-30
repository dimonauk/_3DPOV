/**
 * app/admin/assets/assets-form/snippet.ts
 *
 * Pure builder for the JSON snippet the operator pastes into
 * `data/assets.json`. One branch per `Mode`. Returns "" when the
 * required mode-specific inputs are incomplete.
 */

import { driveDirectUrl } from "lib/assets/resolve";
import type { AssetKind } from "lib/assets/types";

import type { BlobState, Mode } from "./types";

export type SnippetInputs = {
  mode: Mode;
  id: string;
  idValid: boolean;
  name: string;
  kind: AssetKind;
  format: string;
  licence: string;
  attribution: string;
  tagsArray: string[];
  todayIso: string;

  // Mode-specific.
  blobState: BlobState;
  driveId: string | null;
  driveBytes: string;
  photosUrl: string;
};

export function buildSnippet(i: SnippetInputs): string {
  if (!i.idValid || !i.name.trim()) return "";

  const tagsField =
    i.tagsArray.length > 0
      ? `,\n    "tags": [${i.tagsArray.map((t) => `"${t}"`).join(", ")}]`
      : "";
  const attributionField = i.attribution.trim()
    ? `,\n    "attribution": "${i.attribution.replace(/"/g, '\\"').trim()}"`
    : "";
  const escapedName = i.name.replace(/"/g, '\\"');

  if (i.mode === "vercel-blob") {
    if (i.blobState.kind !== "ready") return "";
    return [
      "  {",
      `    "id": "${i.id}",`,
      `    "name": "${escapedName}",`,
      `    "kind": "${i.kind}",`,
      `    "format": "${i.format}",`,
      `    "bytes": ${i.blobState.bytes},`,
      `    "host": "vercel-blob",`,
      `    "url": "${i.blobState.url}",`,
      `    "licence": "${i.licence}"${attributionField}${tagsField},`,
      `    "publishedAt": "${i.todayIso}"`,
      "  }",
    ].join("\n");
  }

  if (i.mode === "google-drive") {
    if (!i.driveId) return "";
    const bytes = parseInt(i.driveBytes, 10);
    if (!Number.isFinite(bytes) || bytes <= 0) return "";
    return [
      "  {",
      `    "id": "${i.id}",`,
      `    "name": "${escapedName}",`,
      `    "kind": "${i.kind}",`,
      `    "format": "${i.format}",`,
      `    "bytes": ${bytes},`,
      `    "host": "google-drive",`,
      `    "driveId": "${i.driveId}",`,
      `    "url": "${driveDirectUrl(i.driveId)}",`,
      `    "licence": "${i.licence}"${attributionField}${tagsField},`,
      `    "publishedAt": "${i.todayIso}"`,
      "  }",
    ].join("\n");
  }

  // google-photos
  if (!i.photosUrl.trim()) return "";
  return [
    "  {",
    `    "id": "${i.id}",`,
    `    "name": "${escapedName}",`,
    `    "kind": "image",`,
    `    "format": "album",`,
    `    "bytes": 0,`,
    `    "host": "google-photos",`,
    `    "url": "${i.photosUrl.trim()}",`,
    `    "licence": "${i.licence}"${attributionField}${tagsField},`,
    `    "publishedAt": "${i.todayIso}"`,
    "  }",
  ].join("\n");
}
