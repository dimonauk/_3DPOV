"use client";

/**
 * app/admin/wardrobe/page.tsx — Operator surface for adding a new
 * outfit VRM to the studio wardrobe.
 *
 * Today's MVP: pick a .vrm, give it a label + glyph, hit upload. The
 * page browser-directly uploads to Vercel Blob at
 * `wardrobe/<slug>.vrm` (bypassing the 4.5 MB function body limit)
 * and then surfaces the JSON snippet to paste into
 * `data/wardrobe.json` plus a one-shot copy button. The operator
 * commits that file + pushes to deploy the new outfit.
 *
 * (Future iteration: Firestore-backed registry so this page can
 * append directly without requiring a redeploy. Today's PR-based
 * flow is intentional: every outfit gets a reviewable git commit,
 * the wardrobe stays as one canonical source, and rollback is just
 * `git revert`. See Tier 2 #5 in the VRM plan.)
 *
 * Admin-only. Layout gate is enforced at app/admin/layout.tsx.
 */

import { upload } from "@vercel/blob/client";
import { useMemo, useRef, useState } from "react";

import { useAuth } from "components/auth/auth-provider";

import { ADMIN_WARDROBE_STYLES } from "./wardrobe/styles";

type UploadState =
  | { kind: "idle" }
  | { kind: "uploading"; progress: number }
  | { kind: "ready"; url: string; bytes: number; pathname: string }
  | { kind: "error"; message: string };

const SLUG_RE = /^[a-z][a-z0-9-]{1,63}$/;
const DEFAULT_GLYPH = "👕";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export default function AdminWardrobePage() {
  const { user } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [glyph, setGlyph] = useState(DEFAULT_GLYPH);
  const [slug, setSlug] = useState("");
  const [state, setState] = useState<UploadState>({ kind: "idle" });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-derive slug from label as the operator types, but only while
  // they haven't manually edited it — so explicit slug edits stick.
  const slugIsAutoFilled = useRef(true);
  const onLabelChange = (v: string) => {
    setLabel(v);
    if (slugIsAutoFilled.current) setSlug(slugify(v));
  };
  const onSlugChange = (v: string) => {
    slugIsAutoFilled.current = v === "" || v === slugify(label);
    setSlug(v);
  };

  const slugValid = SLUG_RE.test(slug);
  const canUpload =
    !!file && !!label.trim() && slugValid && state.kind !== "uploading";

  const onPick = (f: File | null) => {
    setFile(f);
    setState({ kind: "idle" });
    if (f && !label) {
      // Pre-fill label from filename if empty.
      const base = f.name.replace(/\.vrm$/i, "").replace(/[-_]+/g, " ");
      onLabelChange(base);
    }
  };

  const onUpload = async () => {
    if (!file || !user || !slugValid) return;
    setState({ kind: "uploading", progress: 0 });
    try {
      const idToken = await user.getIdToken();
      const pathname = `wardrobe/${slug}.vrm`;
      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/admin/wardrobe/upload-token",
        clientPayload: JSON.stringify({ firebaseToken: idToken }),
        onUploadProgress: ({ percentage }) => {
          setState({ kind: "uploading", progress: percentage });
        },
      });
      setState({
        kind: "ready",
        url: blob.url,
        bytes: file.size,
        pathname,
      });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const snippet = useMemo(() => {
    if (state.kind !== "ready") return "";
    return [
      "    {",
      `      "slug": "${slug}",`,
      `      "label": "${label.replace(/"/g, '\\"')}",`,
      `      "url": "${state.url}",`,
      `      "bytes": ${state.bytes},`,
      `      "glyph": "${glyph}"`,
      "    }",
    ].join("\n");
  }, [state, slug, label, glyph]);

  const onCopy = async () => {
    if (!snippet) return;
    try {
      await navigator.clipboard.writeText(snippet);
    } catch {
      // Clipboard API can fail in some embeds; user can still copy by
      // hand from the visible block.
    }
  };

  return (
    <div className="aw-root">
      <header className="aw-header">
        <h1>Add wardrobe outfit</h1>
        <p>
          Browser-direct upload of a .vrm to Vercel Blob, then a snippet
          to paste into <code>data/wardrobe.json</code>. The wardrobe goes
          live when the JSON change deploys.
        </p>
      </header>

      <section className="aw-form">
        <label className="aw-row">
          <span className="aw-label">VRM file</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".vrm"
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
            disabled={state.kind === "uploading"}
          />
          {file && (
            <span className="aw-hint">
              {(file.size / (1024 * 1024)).toFixed(1)} MB
            </span>
          )}
        </label>

        <label className="aw-row">
          <span className="aw-label">Label</span>
          <input
            type="text"
            value={label}
            onChange={(e) => onLabelChange(e.target.value)}
            placeholder="e.g. Baby Pink Spice"
            disabled={state.kind === "uploading"}
          />
        </label>

        <label className="aw-row">
          <span className="aw-label">Slug</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            placeholder="kebab-case"
            disabled={state.kind === "uploading"}
            className={!slugValid && slug ? "aw-input-error" : ""}
          />
          {!slugValid && slug && (
            <span className="aw-hint aw-error-hint">
              lowercase, digits and hyphens only, 2-64 chars
            </span>
          )}
        </label>

        <label className="aw-row">
          <span className="aw-label">Glyph</span>
          <input
            type="text"
            value={glyph}
            onChange={(e) => setGlyph(e.target.value)}
            placeholder="👕"
            maxLength={4}
            disabled={state.kind === "uploading"}
            className="aw-glyph-input"
          />
          <span className="aw-hint">
            Decorative emoji shown next to the label in the picker.
          </span>
        </label>

        <button
          type="button"
          onClick={onUpload}
          disabled={!canUpload || !user}
          className="aw-upload-btn"
        >
          {state.kind === "uploading"
            ? `Uploading… ${Math.round(state.progress)}%`
            : state.kind === "ready"
              ? "Re-upload"
              : "Upload to Blob"}
        </button>

        {!user && (
          <p className="aw-warn">
            Sign in as an admin (see /admin) to upload.
          </p>
        )}
      </section>

      {state.kind === "error" && (
        <section className="aw-output aw-output-error">
          <div className="aw-output-title">Upload failed</div>
          <p>{state.message}</p>
        </section>
      )}

      {state.kind === "ready" && (
        <section className="aw-output">
          <div className="aw-output-title">
            ✓ Uploaded — paste this into data/wardrobe.json
          </div>
          <p className="aw-output-meta">
            <code>{state.pathname}</code> ·{" "}
            {(state.bytes / (1024 * 1024)).toFixed(1)} MB ·{" "}
            <a href={state.url} target="_blank" rel="noopener noreferrer">
              open in new tab
            </a>
          </p>
          <pre className="aw-snippet">{snippet}</pre>
          <button type="button" onClick={onCopy} className="aw-copy-btn">
            Copy snippet
          </button>
          <p className="aw-output-meta">
            Add a comma after the previous entry if you&rsquo;re appending,
            then commit + push to deploy.
          </p>
        </section>
      )}

      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx global>{ADMIN_WARDROBE_STYLES}</style>
    </div>
  );
}
