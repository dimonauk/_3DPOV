"use client";

/**
 * app/cards/design/card-designer/model-upload.tsx — Two-step uploader
 * for AR card .glb models. Step 1: upload the GLB to the studio
 * bucket. Step 2: lazy-load three.js + USDZExporter, convert in the
 * browser, upload the USDZ for iOS Quick Look. The USDZ step runs
 * in the background — the user sees the GLB result immediately and
 * the iOS-ready badge appears whenever conversion finishes.
 *
 * Extracted from page.tsx per ARCHITECTURE.md Rule 1. Owns its own
 * fileInputRef, two error states, and the two-stage progress flags;
 * the host orchestrator just passes the current URLs and the
 * onUploaded/onUsdzUploaded/onReset callbacks.
 */

import { useRef, useState } from "react";

import { useAuth } from "components/auth/auth-provider";
import { signInWithGoogle } from "lib/firebase/client";

export function ModelUploadField({
  currentUrl,
  currentUsdzUrl,
  isPlaceholder,
  authReady,
  user,
  onUploaded,
  onUsdzUploaded,
  onReset,
}: {
  currentUrl: string;
  currentUsdzUrl: string;
  isPlaceholder: boolean;
  authReady: boolean;
  user: ReturnType<typeof useAuth>["user"];
  onUploaded: (url: string) => void;
  onUsdzUploaded: (url: string) => void;
  onReset: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);

  const handlePick = () => fileInputRef.current?.click();

  const convertAndUploadUsdz = async (
    glbUrl: string,
    signedInUser: NonNullable<ReturnType<typeof useAuth>["user"]>,
    originalFilename: string,
  ) => {
    setConvertError(null);
    setConverting(true);
    try {
      // Lazy-load three.js + USDZExporter — they're heavy and we only
      // want them in the bundle when the user actually uploads.
      const { convertGlbUrlToUsdz } = await import("lib/cards/glb-to-usdz");
      const usdzBlob = await convertGlbUrlToUsdz(glbUrl);

      const idToken = await signedInUser.getIdToken();
      const usdzName =
        originalFilename.replace(/\.(glb|gltf)$/i, "") + ".usdz";

      const fd = new FormData();
      fd.append("file", usdzBlob, usdzName);
      fd.append("filename", usdzName);

      const res = await fetch("/api/cards/upload-usdz", {
        method: "POST",
        headers: { Authorization: "Bearer " + idToken },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? "USDZ upload failed (" + res.status + ")");
      }
      onUsdzUploaded(data.url);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Couldn't generate iOS USDZ.";
      setConvertError(message);
    } finally {
      setConverting(false);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // reset so picking the same file again re-fires onChange

    setUploadError(null);
    setUploading(true);

    try {
      // Need auth — if not signed in, prompt for Google sign-in inline.
      let signedIn = user;
      if (!signedIn) {
        const cred = await signInWithGoogle();
        if (!cred) {
          throw new Error(
            "Sign-in was cancelled. You need a Google account to upload GLB files.",
          );
        }
        signedIn = cred.user;
      }

      // Get a fresh ID token (don't cache; they expire after 1 hour).
      const idToken = await signedIn.getIdToken();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("filename", file.name);

      const res = await fetch("/api/cards/upload-glb", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? `Upload failed (${res.status})`);
      }
      onUploaded(data.url);
      // Clear any stale USDZ URL - the new GLB invalidates it.
      onUsdzUploaded("");
      // Release the upload spinner so the user sees the GLB result
      // immediately; USDZ conversion runs in the background as a
      // best-effort second step.
      setUploading(false);
      void convertAndUploadUsdz(data.url, signedIn, file.name);
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setUploadError(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs uppercase tracking-[0.12em] text-chrome-400">
        Your 3D model
      </span>

      {isPlaceholder ? (
        <p className="text-xs text-chrome-500">
          Using the studio placeholder (a small pink octahedron). Upload a{" "}
          <code className="text-pink-200">.glb</code> below to swap it in.
        </p>
      ) : (
        <div className="flex flex-col gap-1 rounded-sm border border-pink-200/30 bg-pink-200/5 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-pink-100">
              ✓ Custom model uploaded
            </span>
            <button
              type="button"
              onClick={onReset}
              className="text-xs text-chrome-400 underline-offset-4 hover:text-pink-200 hover:underline"
            >
              Reset to placeholder
            </button>
          </div>
          <code className="break-all text-[0.65rem] text-chrome-400">
            {currentUrl}
          </code>
          {converting ? (
            <p className="text-xs text-pink-100/80">
              Converting to USDZ for iOS Quick Look…
            </p>
          ) : convertError ? (
            <p className="text-xs text-amber-200/90">
              {convertError} (iOS will fall back to the brand colour fallback)
            </p>
          ) : currentUsdzUrl ? (
            <p className="text-xs text-pink-100">✓ iOS USDZ ready</p>
          ) : null}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,model/gltf-binary"
        onChange={handleChange}
        disabled={!authReady || uploading}
        className="hidden"
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handlePick}
          disabled={!authReady || uploading}
          className="rounded-full border border-pink-200/60 bg-pink-200/10 px-5 py-2 chrome-label text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20 disabled:opacity-50"
        >
          {uploading
            ? "Uploading…"
            : isPlaceholder
              ? user
                ? "Upload .glb"
                : "Sign in + upload .glb"
              : "Replace .glb"}
        </button>
        <span className="self-center text-xs text-chrome-500">
          Max 10 MB &middot; glTF 2.0 binary only &middot; iOS Quick Look needs{" "}
          <code className="text-pink-200">.usdz</code> (studio tier)
        </span>
      </div>

      {!authReady && (
        <p className="text-xs text-chrome-500">
          Auth isn&rsquo;t configured on this deployment, so uploads are
          unavailable. The share-URL flow below still works without uploads.
        </p>
      )}

      {uploadError && (
        <p className="rounded-sm border border-red-300/40 bg-red-300/10 px-3 py-2 text-xs text-red-100">
          {uploadError}
        </p>
      )}
    </div>
  );
}
