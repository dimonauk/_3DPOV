"use client";

/**
 * app/admin/assets/assets-form/mode-blob.tsx
 *
 * Vercel Blob upload mode. File picker + upload button + the
 * progress / error / done banner. Hits the
 * `/api/admin/assets/upload-token` route via the @vercel/blob/client
 * `upload()` helper.
 */

import type { BlobState } from "./types";

export type ModeBlobProps = {
  file: File | null;
  user: { uid: string } | null;
  blobState: BlobState;
  idValid: boolean;
  name: string;
  onPickFile: (f: File | null) => void;
  onUploadBlob: () => Promise<void>;
};

export function ModeBlob(p: ModeBlobProps) {
  return (
    <section className="aa-form">
      <h2>Upload file</h2>
      <label className="aa-row">
        <span className="aa-label">File</span>
        <input
          type="file"
          onChange={(e) => p.onPickFile(e.target.files?.[0] ?? null)}
          disabled={p.blobState.kind === "uploading"}
        />
        {p.file && (
          <span className="aa-hint">
            {(p.file.size / (1024 * 1024)).toFixed(2)} MB
          </span>
        )}
      </label>
      <button
        type="button"
        onClick={p.onUploadBlob}
        disabled={
          !p.file ||
          !p.idValid ||
          !p.name.trim() ||
          p.blobState.kind === "uploading" ||
          !p.user
        }
        className="aa-upload-btn"
      >
        {p.blobState.kind === "uploading"
          ? `Uploading… ${Math.round(p.blobState.progress)}%`
          : p.blobState.kind === "ready"
            ? "Re-upload"
            : "Upload to Vercel Blob"}
      </button>
      {!p.user && <p className="aa-warn">Sign in as admin to upload.</p>}
      {p.blobState.kind === "error" && (
        <p className="aa-warn">Upload failed: {p.blobState.message}</p>
      )}
      {p.blobState.kind === "ready" && (
        <p className="aa-hint">
          ✓ {p.blobState.pathname} ·{" "}
          <a href={p.blobState.url} target="_blank" rel="noopener noreferrer">
            open
          </a>
        </p>
      )}
    </section>
  );
}
