"use client";

/**
 * app/admin/assets/assets-form/use-asset-form.ts
 *
 * State machine + handlers for the three asset-publish flows.
 * Owns:
 *   - the 13 form fields (id, name, kind, format, licence,
 *     attribution, tags, file, driveInput, driveBytes, photosUrl,
 *     mode, blobState)
 *   - derived `idValid`, `driveId`, `tagsArray`, `todayIso`,
 *     `snippet`
 *   - `onPickFile` (auto-fill name/id/format from filename)
 *   - `onUploadBlob` (Vercel Blob client-direct upload)
 *   - `onCopy` (copy snippet to clipboard)
 *
 * Returns a single bag the orchestrator destructures. No JSX.
 */

import { upload } from "@vercel/blob/client";
import { useMemo, useState } from "react";
import type { User } from "firebase/auth";

import { parseDriveId } from "lib/assets/resolve";
import type { AssetKind } from "lib/assets/types";

import { extFromFilename, slugify } from "./slug";
import { buildSnippet } from "./snippet";
import { ID_RE, type BlobState, type Mode } from "./types";

export type UseAssetForm = ReturnType<typeof useAssetForm>;

export function useAssetForm(user: User | null) {
  const [mode, setMode] = useState<Mode>("vercel-blob");

  // Shared fields.
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [kind, setKind] = useState<AssetKind>("mesh");
  const [format, setFormat] = useState("glb");
  const [licence, setLicence] = useState("studio-proprietary");
  const [attribution, setAttribution] = useState("");
  const [tags, setTags] = useState("");

  // Mode-specific.
  const [file, setFile] = useState<File | null>(null);
  const [driveInput, setDriveInput] = useState("");
  const [driveBytes, setDriveBytes] = useState("");
  const [photosUrl, setPhotosUrl] = useState("");

  // Blob upload state.
  const [blobState, setBlobState] = useState<BlobState>({ kind: "idle" });

  const idValid = ID_RE.test(id);
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const driveId = useMemo(
    () => parseDriveId(driveInput.trim()),
    [driveInput],
  );
  const tagsArray = useMemo(
    () =>
      tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    [tags],
  );

  const onPickFile = (f: File | null) => {
    setFile(f);
    setBlobState({ kind: "idle" });
    if (f) {
      const ext = extFromFilename(f.name);
      if (ext) setFormat(ext);
      if (!name) {
        const base = f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
        setName(base);
        if (!id) setId(slugify(base));
      }
    }
  };

  const onUploadBlob = async () => {
    if (!file || !user || !idValid) return;
    setBlobState({ kind: "uploading", progress: 0 });
    try {
      const idToken = await user.getIdToken();
      const pathname = `assets/${id}.${format}`;
      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/admin/assets/upload-token",
        clientPayload: JSON.stringify({ firebaseToken: idToken }),
        onUploadProgress: ({ percentage }) => {
          setBlobState({ kind: "uploading", progress: percentage });
        },
      });
      setBlobState({
        kind: "ready",
        url: blob.url,
        bytes: file.size,
        pathname,
      });
    } catch (err) {
      setBlobState({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const snippet = useMemo(
    () =>
      buildSnippet({
        mode,
        id,
        idValid,
        name,
        kind,
        format,
        licence,
        attribution,
        tagsArray,
        todayIso,
        blobState,
        driveId,
        driveBytes,
        photosUrl,
      }),
    [
      mode,
      id,
      idValid,
      name,
      kind,
      format,
      licence,
      attribution,
      tagsArray,
      todayIso,
      blobState,
      driveId,
      driveBytes,
      photosUrl,
    ],
  );

  const onCopy = async () => {
    if (!snippet) return;
    try {
      await navigator.clipboard.writeText(snippet);
    } catch {
      /* user can still copy by hand */
    }
  };

  return {
    // mode
    mode,
    setMode,
    // shared fields
    id,
    setId,
    name,
    setName,
    kind,
    setKind,
    format,
    setFormat,
    licence,
    setLicence,
    attribution,
    setAttribution,
    tags,
    setTags,
    // mode-specific
    file,
    driveInput,
    setDriveInput,
    driveBytes,
    setDriveBytes,
    photosUrl,
    setPhotosUrl,
    // derived
    idValid,
    driveId,
    blobState,
    snippet,
    // handlers
    onPickFile,
    onUploadBlob,
    onCopy,
  };
}
