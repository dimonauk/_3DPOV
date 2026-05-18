"use client";

/**
 * app/admin/assets/page.tsx — Operator surface for adding a new entry
 * to the asset registry (data/assets.json).
 *
 * Three flows in one page:
 *
 *  1. **Vercel Blob upload** — for <50 MB assets that should live on
 *     our edge. Browser-direct upload to `assets/<id>.<format>` via
 *     /api/admin/assets/upload-token.
 *  2. **Google Drive entry** — paste a Drive share URL; the page
 *     extracts the file id and synthesises the direct-download URL.
 *  3. **Google Photos album** — paste an album share link; the page
 *     records it verbatim.
 *
 * Output: a JSON snippet to paste into data/assets.json + a one-shot
 * copy button. Operator commits the change to deploy the asset.
 *
 * (Future: Firestore-backed registry so this page appends directly.
 * For now the git-commit boundary keeps the registry reviewable and
 * rollback trivial — same logic as wardrobe.)
 *
 * Admin-only. Layout gate enforced at app/admin/layout.tsx.
 */

import { upload } from "@vercel/blob/client";
import { useMemo, useState } from "react";

import { useAuth } from "components/auth/auth-provider";
import { parseDriveId, driveDirectUrl } from "lib/assets/resolve";
import type { AssetKind } from "lib/assets/types";

import { ADMIN_ASSETS_STYLES } from "./styles";

type Mode = "vercel-blob" | "google-drive" | "google-photos";

type BlobState =
  | { kind: "idle" }
  | { kind: "uploading"; progress: number }
  | { kind: "ready"; url: string; bytes: number; pathname: string }
  | { kind: "error"; message: string };

const ID_RE = /^[a-z][a-z0-9-]{1,63}$/;

const KINDS: AssetKind[] = [
  "mesh",
  "blend",
  "scan",
  "texture",
  "video",
  "audio",
  "archive",
  "image",
  "other",
];

const LICENCES = [
  "studio-proprietary",
  "cc0",
  "cc-by",
  "cc-by-nc",
  "cc-by-sa",
  "cc-by-nc-sa",
  "apache-2.0",
  "mit",
  "research-only",
  "other",
];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function extFromFilename(name: string): string {
  const last = name.split(".").pop();
  return (last ?? "").toLowerCase();
}

export default function AdminAssetsPage() {
  const { user } = useAuth();

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

  const driveId = useMemo(() => parseDriveId(driveInput.trim()), [driveInput]);

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

  const snippet = useMemo(() => {
    if (!idValid || !name.trim()) return "";

    const tagsField =
      tagsArray.length > 0
        ? `,\n    "tags": [${tagsArray.map((t) => `"${t}"`).join(", ")}]`
        : "";
    const attributionField = attribution.trim()
      ? `,\n    "attribution": "${attribution.replace(/"/g, '\\"').trim()}"`
      : "";

    if (mode === "vercel-blob") {
      if (blobState.kind !== "ready") return "";
      return [
        "  {",
        `    "id": "${id}",`,
        `    "name": "${name.replace(/"/g, '\\"')}",`,
        `    "kind": "${kind}",`,
        `    "format": "${format}",`,
        `    "bytes": ${blobState.bytes},`,
        `    "host": "vercel-blob",`,
        `    "url": "${blobState.url}",`,
        `    "licence": "${licence}"${attributionField}${tagsField},`,
        `    "publishedAt": "${todayIso}"`,
        "  }",
      ].join("\n");
    }

    if (mode === "google-drive") {
      if (!driveId) return "";
      const bytes = parseInt(driveBytes, 10);
      if (!Number.isFinite(bytes) || bytes <= 0) return "";
      return [
        "  {",
        `    "id": "${id}",`,
        `    "name": "${name.replace(/"/g, '\\"')}",`,
        `    "kind": "${kind}",`,
        `    "format": "${format}",`,
        `    "bytes": ${bytes},`,
        `    "host": "google-drive",`,
        `    "driveId": "${driveId}",`,
        `    "url": "${driveDirectUrl(driveId)}",`,
        `    "licence": "${licence}"${attributionField}${tagsField},`,
        `    "publishedAt": "${todayIso}"`,
        "  }",
      ].join("\n");
    }

    // google-photos
    if (!photosUrl.trim()) return "";
    return [
      "  {",
      `    "id": "${id}",`,
      `    "name": "${name.replace(/"/g, '\\"')}",`,
      `    "kind": "image",`,
      `    "format": "album",`,
      `    "bytes": 0,`,
      `    "host": "google-photos",`,
      `    "url": "${photosUrl.trim()}",`,
      `    "licence": "${licence}"${attributionField}${tagsField},`,
      `    "publishedAt": "${todayIso}"`,
      "  }",
    ].join("\n");
  }, [
    mode,
    id,
    idValid,
    name,
    kind,
    format,
    licence,
    attribution,
    tagsArray,
    blobState,
    driveId,
    driveBytes,
    photosUrl,
    todayIso,
  ]);

  const onCopy = async () => {
    if (!snippet) return;
    try {
      await navigator.clipboard.writeText(snippet);
    } catch {
      /* user can still copy by hand */
    }
  };

  return (
    <div className="aa-root">
      <header className="aa-header">
        <h1>Add asset to the registry</h1>
        <p>
          Three flows; one registry. Vercel Blob for &lt; 50 MB,
          Google Drive for larger meshes and Blender projects, Google
          Photos for galleries. Output is a snippet for{" "}
          <code>data/assets.json</code> — commit + push to deploy.
        </p>
      </header>

      <nav className="aa-tabs">
        <button
          type="button"
          className={mode === "vercel-blob" ? "aa-tab-active" : ""}
          onClick={() => setMode("vercel-blob")}
        >
          Vercel Blob (&lt; 50 MB)
        </button>
        <button
          type="button"
          className={mode === "google-drive" ? "aa-tab-active" : ""}
          onClick={() => setMode("google-drive")}
        >
          Google Drive (&gt; 50 MB)
        </button>
        <button
          type="button"
          className={mode === "google-photos" ? "aa-tab-active" : ""}
          onClick={() => setMode("google-photos")}
        >
          Google Photos album
        </button>
      </nav>

      <section className="aa-form">
        <label className="aa-row">
          <span className="aa-label">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!id || id === slugify(name)) setId(slugify(e.target.value));
            }}
            placeholder="e.g. POI Rig Mk7 — printable"
          />
        </label>

        <label className="aa-row">
          <span className="aa-label">Id (slug)</span>
          <input
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="kebab-case"
            className={!idValid && id ? "aa-input-error" : ""}
          />
          {!idValid && id && (
            <span className="aa-hint aa-error-hint">
              lowercase, digits and hyphens only, 2-64 chars, starts with a
              letter
            </span>
          )}
        </label>

        <label className="aa-row">
          <span className="aa-label">Kind</span>
          <select value={kind} onChange={(e) => setKind(e.target.value as AssetKind)}>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>

        <label className="aa-row">
          <span className="aa-label">Format (no dot)</span>
          <input
            type="text"
            value={format}
            onChange={(e) => setFormat(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
            placeholder="glb / blend / mp4 / zip / album"
          />
        </label>

        <label className="aa-row">
          <span className="aa-label">Licence</span>
          <select
            value={licence}
            onChange={(e) => setLicence(e.target.value)}
          >
            {LICENCES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>

        <label className="aa-row">
          <span className="aa-label">Attribution (optional)</span>
          <input
            type="text"
            value={attribution}
            onChange={(e) => setAttribution(e.target.value)}
            placeholder="e.g. Photo by Jon"
          />
        </label>

        <label className="aa-row">
          <span className="aa-label">Tags (comma-sep)</span>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="poi, rig, printable"
          />
        </label>
      </section>

      {mode === "vercel-blob" && (
        <section className="aa-form">
          <h2>Upload file</h2>
          <label className="aa-row">
            <span className="aa-label">File</span>
            <input
              type="file"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              disabled={blobState.kind === "uploading"}
            />
            {file && (
              <span className="aa-hint">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            )}
          </label>
          <button
            type="button"
            onClick={onUploadBlob}
            disabled={
              !file ||
              !idValid ||
              !name.trim() ||
              blobState.kind === "uploading" ||
              !user
            }
            className="aa-upload-btn"
          >
            {blobState.kind === "uploading"
              ? `Uploading… ${Math.round(blobState.progress)}%`
              : blobState.kind === "ready"
                ? "Re-upload"
                : "Upload to Vercel Blob"}
          </button>
          {!user && <p className="aa-warn">Sign in as admin to upload.</p>}
          {blobState.kind === "error" && (
            <p className="aa-warn">Upload failed: {blobState.message}</p>
          )}
          {blobState.kind === "ready" && (
            <p className="aa-hint">
              ✓ {blobState.pathname} ·{" "}
              <a
                href={blobState.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                open
              </a>
            </p>
          )}
        </section>
      )}

      {mode === "google-drive" && (
        <section className="aa-form">
          <h2>Drive share link</h2>
          <label className="aa-row">
            <span className="aa-label">Drive URL</span>
            <input
              type="text"
              value={driveInput}
              onChange={(e) => setDriveInput(e.target.value)}
              placeholder="https://drive.google.com/file/d/<ID>/view?usp=sharing"
            />
            {driveInput && !driveId && (
              <span className="aa-hint aa-error-hint">
                Couldn&rsquo;t parse a file id — make sure the link is of the
                form <code>/file/d/&lt;ID&gt;/view</code> or
                <code> ?id=&lt;ID&gt;</code>.
              </span>
            )}
            {driveId && (
              <span className="aa-hint">
                Parsed id: <code>{driveId}</code>
              </span>
            )}
          </label>
          <label className="aa-row">
            <span className="aa-label">Size (bytes)</span>
            <input
              type="number"
              value={driveBytes}
              onChange={(e) => setDriveBytes(e.target.value)}
              placeholder="412503040"
              min="1"
            />
            <span className="aa-hint">
              Right-click the file in Drive → Details → size in bytes.
            </span>
          </label>
        </section>
      )}

      {mode === "google-photos" && (
        <section className="aa-form">
          <h2>Photos album link</h2>
          <label className="aa-row">
            <span className="aa-label">Album URL</span>
            <input
              type="text"
              value={photosUrl}
              onChange={(e) => setPhotosUrl(e.target.value)}
              placeholder="https://photos.app.goo.gl/..."
            />
            <span className="aa-hint">
              Album links survive Photos&rsquo; auto-resizing. Single-image
              direct links don&rsquo;t — mirror those to Blob instead.
            </span>
          </label>
        </section>
      )}

      {snippet && (
        <section className="aa-output">
          <div className="aa-output-title">
            ✓ Paste into <code>data/assets.json</code> (top of the
            <code> assets</code> array)
          </div>
          <pre className="aa-snippet">{snippet}</pre>
          <button type="button" onClick={onCopy} className="aa-copy-btn">
            Copy snippet
          </button>
          <p className="aa-output-meta">
            Add a comma after this object if there&rsquo;s another entry below
            it, then commit + push to deploy.
          </p>
        </section>
      )}

      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx global>{ADMIN_ASSETS_STYLES}</style>
    </div>
  );
}
