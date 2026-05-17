"use client";

/**
 * /admin/wardrobe-upload — bulk-upload page for the 7 Aura wardrobe
 * outfits.
 *
 * Browser-direct upload pattern: file bytes never touch our Vercel
 * function — they go browser → Vercel Blob directly. We use the
 * /api/admin/wardrobe-upload route only to mint a short-lived client
 * token after validating the admin password.
 *
 * Once all 7 outfits are uploaded, the page surfaces a copy-paste
 * JSON block matching the data/wardrobe.json schema. Paste into the
 * file, commit, push. The upload page can then be deleted alongside
 * its mint endpoint.
 *
 * The expected source files live at:
 *   D:\The_Hangar\apps\aura-vrm\public\wardrobe\*.vrm
 */

import { upload } from "@vercel/blob/client";
import { useState, useRef } from "react";

interface UploadedBlob {
  pathname: string;
  url: string;
  bytes: number;
}

// Slugify a wardrobe filename like "UV PBR Baby Pink Spice.vrm" to
// "baby-pink-spice". Strips the UV/PBR/Pbr noise prefixes the source
// files use to mark their material setup.
function slugify(filename: string): string {
  return filename
    .replace(/\.vrm$/i, "")
    .replace(/\b(UV|PBR|Pbr)\b/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+outfit\b/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Human-friendly label derived from the slug.
function labelize(slug: string): string {
  return slug
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export default function WardrobeUploadPage() {
  const [adminToken, setAdminToken] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploads, setUploads] = useState<UploadedBlob[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    const vrms = Array.from(list).filter((f) =>
      f.name.toLowerCase().endsWith(".vrm"),
    );
    setFiles(vrms);
    setErrors({});
    setUploads([]);
    setProgress({});
  };

  const uploadAll = async () => {
    if (!adminToken) {
      setErrors({ _global: "Paste the admin token first." });
      return;
    }
    if (files.length === 0) {
      setErrors({ _global: "Pick the .vrm files first." });
      return;
    }
    setBusy(true);
    setErrors({});
    setUploads([]);
    setProgress({});

    const completed: UploadedBlob[] = [];
    for (const file of files) {
      const slug = slugify(file.name);
      const pathname = `wardrobe/${slug}.vrm`;
      try {
        const blob = await upload(pathname, file, {
          access: "public",
          handleUploadUrl: "/api/admin/wardrobe-upload",
          clientPayload: JSON.stringify({ adminToken }),
          contentType: "model/vrm",
          onUploadProgress: ({ percentage }) => {
            setProgress((p) => ({ ...p, [file.name]: percentage }));
          },
        });
        completed.push({
          pathname: blob.pathname,
          url: blob.url,
          bytes: file.size,
        });
        setUploads([...completed]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setErrors((prev) => ({ ...prev, [file.name]: msg }));
      }
    }
    setBusy(false);
  };

  // Build the wardrobe.json content from the successful uploads.
  const wardrobeJson = JSON.stringify(
    {
      outfits: uploads.map((u) => {
        const stem = u.pathname.replace(/^wardrobe\//, "").replace(/\.vrm$/, "");
        return {
          slug: stem,
          label: labelize(stem),
          url: u.url,
          bytes: u.bytes,
        };
      }),
    },
    null,
    2,
  );

  return (
    <main className="root">
      <header>
        <h1>Wardrobe upload</h1>
        <p>
          Browser-direct upload of the 7 Aura outfit VRMs to Vercel Blob.
          File bytes go straight from your machine to Vercel&apos;s edge —
          never through our serverless functions.
        </p>
      </header>

      <section className="step">
        <h2>1 · Admin token</h2>
        <input
          type="password"
          value={adminToken}
          onChange={(e) => setAdminToken(e.target.value)}
          placeholder="MIGRATE_TOKEN from Vercel env vars"
          autoComplete="off"
        />
      </section>

      <section className="step">
        <h2>2 · Pick the .vrm files</h2>
        <p className="hint">
          Source on Dimona&apos;s machine:{" "}
          <code>D:\The_Hangar\apps\aura-vrm\public\wardrobe\</code>
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".vrm,model/vrm,application/octet-stream"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
        />
        {files.length > 0 && (
          <ul className="filelist">
            {files.map((f) => {
              const slug = slugify(f.name);
              const pct = progress[f.name] ?? 0;
              const done = uploads.some(
                (u) => u.pathname === `wardrobe/${slug}.vrm`,
              );
              const err = errors[f.name];
              return (
                <li key={f.name} className={done ? "done" : err ? "err" : ""}>
                  <div className="filename">
                    {f.name}{" "}
                    <span className="meta">
                      → {slug} ({(f.size / 1_000_000).toFixed(1)} MB)
                    </span>
                  </div>
                  <div className="bar">
                    <div
                      className="fill"
                      style={{ width: `${done ? 100 : pct}%` }}
                    />
                  </div>
                  {err && <div className="errmsg">⚠ {err}</div>}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="step">
        <h2>3 · Upload</h2>
        <button
          type="button"
          onClick={uploadAll}
          disabled={busy || files.length === 0 || !adminToken}
          className="cta"
        >
          {busy ? "Uploading…" : `Upload ${files.length} file(s)`}
        </button>
        {errors._global && <div className="errmsg">⚠ {errors._global}</div>}
      </section>

      {uploads.length > 0 && (
        <section className="step result">
          <h2>4 · Paste into <code>data/wardrobe.json</code></h2>
          <p className="hint">
            Copy this block into the file at the repo root. Then commit and push.
          </p>
          <textarea readOnly value={wardrobeJson} rows={20} spellCheck={false} />
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(wardrobeJson)}
            className="cta secondary"
          >
            Copy
          </button>
        </section>
      )}

      <style jsx>{`
        .root {
          max-width: 720px;
          margin: 0 auto;
          padding: 3rem 1.5rem 6rem;
          font-family: system-ui, sans-serif;
        }
        header h1 {
          margin: 0;
          font-size: 2rem;
        }
        header p {
          opacity: 0.7;
          margin-top: 0.4rem;
        }
        .step {
          margin-top: 2.5rem;
        }
        .step h2 {
          font-size: 1.1rem;
          margin: 0 0 0.6rem;
          letter-spacing: 0.02em;
        }
        .hint {
          opacity: 0.6;
          font-size: 0.85rem;
          margin: 0 0 0.5rem;
        }
        input[type="password"],
        input[type="file"] {
          width: 100%;
          padding: 0.6rem 0.8rem;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 0.4rem;
          color: inherit;
          font-family: inherit;
          font-size: 0.9rem;
        }
        .filelist {
          list-style: none;
          padding: 0;
          margin: 0.8rem 0 0;
        }
        .filelist li {
          padding: 0.6rem 0.8rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 0.4rem;
          margin-bottom: 0.4rem;
        }
        .filelist li.done {
          border-color: rgba(80, 220, 130, 0.5);
        }
        .filelist li.err {
          border-color: rgba(255, 120, 120, 0.6);
        }
        .filename {
          font-size: 0.85rem;
        }
        .meta {
          opacity: 0.55;
          font-size: 0.78rem;
        }
        .bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 999px;
          margin-top: 0.4rem;
          overflow: hidden;
        }
        .fill {
          height: 100%;
          background: #ff6fb5;
          transition: width 0.2s ease;
        }
        .errmsg {
          margin-top: 0.4rem;
          font-size: 0.8rem;
          color: #ff8b8b;
        }
        .cta {
          padding: 0.7rem 1.4rem;
          background: #ff6fb5;
          color: white;
          border: 0;
          border-radius: 999px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
        }
        .cta:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .cta.secondary {
          background: rgba(255, 255, 255, 0.1);
          color: inherit;
        }
        .result textarea {
          width: 100%;
          margin-top: 0.5rem;
          padding: 0.8rem;
          font-family: ui-monospace, "SF Mono", Menlo, monospace;
          font-size: 0.78rem;
          background: rgba(0, 0, 0, 0.4);
          color: #e8e8e8;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.4rem;
          resize: vertical;
        }
        .result button {
          margin-top: 0.6rem;
        }
        code {
          font-family: ui-monospace, "SF Mono", Menlo, monospace;
          background: rgba(255, 255, 255, 0.08);
          padding: 0.1em 0.4em;
          border-radius: 0.2em;
          font-size: 0.85em;
        }
      `}</style>
    </main>
  );
}
