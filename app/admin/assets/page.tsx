"use client";

/**
 * app/admin/assets/page.tsx — Operator surface for adding a new
 * entry to the asset registry (`data/assets.json`).
 *
 * Three flows in one page:
 *
 *  1. Vercel Blob upload — for < 50 MB assets that should live on
 *     our edge. Browser-direct via `/api/admin/assets/upload-token`.
 *  2. Google Drive entry — paste a share URL; we extract the id
 *     and synthesise the direct-download URL.
 *  3. Google Photos album — paste an album link; recorded verbatim.
 *
 * Output is a JSON snippet to paste into `data/assets.json` + a
 * one-shot copy button. Commit + push to deploy.
 *
 * Thin orchestrator: composes `useAssetForm` + the per-mode section
 * components + the shared-fields component + the snippet display.
 * State, handlers, and snippet generation all live in
 * `./assets-form/`.
 *
 * Admin-only. Layout gate enforced at app/admin/layout.tsx.
 */

import { useAuth } from "components/auth/auth-provider";

import { ModeBlob } from "./assets-form/mode-blob";
import { ModeDrive } from "./assets-form/mode-drive";
import { ModePhotos } from "./assets-form/mode-photos";
import { SharedFields } from "./assets-form/shared-fields";
import { useAssetForm } from "./assets-form/use-asset-form";
import { ADMIN_ASSETS_STYLES } from "./styles";

export default function AdminAssetsPage() {
  const { user } = useAuth();
  const f = useAssetForm(user);

  return (
    <div className="aa-root">
      <header className="aa-header">
        <h1>Add asset to the registry</h1>
        <p>
          Three flows; one registry. Vercel Blob for &lt; 50 MB, Google
          Drive for larger meshes and Blender projects, Google Photos
          for galleries. Output is a snippet for{" "}
          <code>data/assets.json</code> — commit + push to deploy.
        </p>
      </header>

      <nav className="aa-tabs">
        <button
          type="button"
          className={f.mode === "vercel-blob" ? "aa-tab-active" : ""}
          onClick={() => f.setMode("vercel-blob")}
        >
          Vercel Blob (&lt; 50 MB)
        </button>
        <button
          type="button"
          className={f.mode === "google-drive" ? "aa-tab-active" : ""}
          onClick={() => f.setMode("google-drive")}
        >
          Google Drive (&gt; 50 MB)
        </button>
        <button
          type="button"
          className={f.mode === "google-photos" ? "aa-tab-active" : ""}
          onClick={() => f.setMode("google-photos")}
        >
          Google Photos album
        </button>
      </nav>

      <SharedFields
        id={f.id}
        setId={f.setId}
        name={f.name}
        setName={f.setName}
        kind={f.kind}
        setKind={f.setKind}
        format={f.format}
        setFormat={f.setFormat}
        licence={f.licence}
        setLicence={f.setLicence}
        attribution={f.attribution}
        setAttribution={f.setAttribution}
        tags={f.tags}
        setTags={f.setTags}
        idValid={f.idValid}
      />

      {f.mode === "vercel-blob" && (
        <ModeBlob
          file={f.file}
          user={user}
          blobState={f.blobState}
          idValid={f.idValid}
          name={f.name}
          onPickFile={f.onPickFile}
          onUploadBlob={f.onUploadBlob}
        />
      )}

      {f.mode === "google-drive" && (
        <ModeDrive
          driveInput={f.driveInput}
          setDriveInput={f.setDriveInput}
          driveBytes={f.driveBytes}
          setDriveBytes={f.setDriveBytes}
          driveId={f.driveId}
        />
      )}

      {f.mode === "google-photos" && (
        <ModePhotos photosUrl={f.photosUrl} setPhotosUrl={f.setPhotosUrl} />
      )}

      {f.snippet && (
        <section className="aa-output">
          <div className="aa-output-title">
            ✓ Paste into <code>data/assets.json</code> (top of the
            <code> assets</code> array)
          </div>
          <pre className="aa-snippet">{f.snippet}</pre>
          <button type="button" onClick={f.onCopy} className="aa-copy-btn">
            Copy snippet
          </button>
          <p className="aa-output-meta">
            Add a comma after this object if there&rsquo;s another entry below
            it, then commit + push to deploy.
          </p>
        </section>
      )}

      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx global>
        {ADMIN_ASSETS_STYLES}
      </style>
    </div>
  );
}
