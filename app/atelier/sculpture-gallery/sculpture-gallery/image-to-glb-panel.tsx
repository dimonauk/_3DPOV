"use client";

/**
 * app/atelier/sculpture-gallery/sculpture-gallery/image-to-glb-panel.tsx
 * — The image → Hunyuan3D sibling input. Reference image goes to
 * the bench's ComfyUI, comes back as a GLB rendered in
 * `<model-viewer>`. Operator-only — the route is admin-guarded
 * because Hunyuan3D burns bench VRAM.
 *
 * Extracted from sculpture-gallery-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import { type RefObject } from "react";

import type { ImageToGlbState } from "./types";

export function ImageToGlbPanel({
  imageInputRef,
  imageFile,
  imagePreviewUrl,
  imageState,
  user,
  onImagePicked,
  onGenerateGlb,
}: {
  imageInputRef: RefObject<HTMLInputElement | null>;
  imageFile: File | null;
  imagePreviewUrl: string | null;
  imageState: ImageToGlbState;
  user: unknown;
  onImagePicked: (file: File) => void;
  onGenerateGlb: () => void;
}) {
  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_18rem]">
      <div className="relative aspect-square w-full max-w-2xl overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
        {imageState.kind === "ready" ? (
          <model-viewer
            src={imageState.glbUrl}
            alt="Hunyuan3D mesh"
            camera-controls
            auto-rotate
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#0e0e14",
            }}
          />
        ) : imagePreviewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagePreviewUrl}
            alt="Reference for Hunyuan3D"
            className="h-full w-full object-contain opacity-80"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <p className="max-w-xs text-center font-mono text-[0.65rem] uppercase tracking-[0.2em] text-chrome-500">
              {"Pick an image →\nbench returns a GLB"}
            </p>
          </div>
        )}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-baseline justify-between gap-3 bg-gradient-to-t from-warm-black-950/90 to-transparent px-3 py-2 font-mono text-[0.65rem] text-chrome-300">
          <span>Hunyuan3D-2mv-turbo · ComfyUI bench</span>
          <span className="text-chrome-500">
            {imageState.kind === "ready"
              ? `${(imageState.glbBytes / (1024 * 1024)).toFixed(1)} MB · ${(imageState.durationMs / 1000).toFixed(0)}s`
              : "GLB → here"}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-5 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-5 font-mono text-xs text-chrome-200">
        <div>
          <div className="chrome-label text-chrome-400">Image → mesh</div>
          <p className="mt-2 text-[0.65rem] leading-relaxed text-chrome-500">
            One reference image becomes a textured GLB on the bench.
            Operator-only — Hunyuan3D-2mv-turbo runs ~53 s on a 3080 Ti.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="w-full rounded-sm border border-pink-200/60 bg-pink-200/10 px-3 py-2 text-[0.7rem] uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
          >
            Upload image
          </button>
          <p className="mt-1 text-[0.65rem] text-chrome-500">
            Hunyuan3D &rarr; GLB (~53s)
          </p>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            aria-label="Upload an image for Hunyuan3D"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImagePicked(file);
              if (imageInputRef.current) imageInputRef.current.value = "";
            }}
          />
          {imageFile ? (
            <p className="mt-2 truncate text-[0.65rem] text-chrome-300">
              ref: {imageFile.name}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onGenerateGlb}
          disabled={!imageFile || imageState.kind === "running"}
          className="rounded-sm border border-pink-200/60 bg-pink-900/40 px-3 py-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
        >
          {imageState.kind === "running"
            ? "generating mesh on the bench…"
            : "→ Generate GLB"}
        </button>

        {imageState.kind === "running" ? (
          <p className="text-[0.65rem] leading-relaxed text-chrome-500">
            Round-trip to the bench: upload → workflow queue → Hunyuan3D →
            Vercel Blob. ~53 s nominal; cold GPU adds a few seconds.
          </p>
        ) : null}

        {imageState.kind === "ready" ? (
          <a
            href={imageState.glbUrl}
            download={imageState.filename}
            className="self-start rounded-sm border border-pink-200/60 bg-pink-200/10 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
          >
            Download {imageState.filename}
          </a>
        ) : null}

        {imageState.kind === "error" ? (
          <p className="rounded-sm border border-rose-400/40 bg-rose-900/20 px-2 py-1 text-[0.65rem] text-rose-200">
            {imageState.message}
          </p>
        ) : null}

        {!user ? (
          <p className="rounded-sm border border-amber-400/40 bg-amber-900/10 px-2 py-1 text-[0.65rem] text-amber-200">
            Operator-only. Sign in to dispatch the bench.
          </p>
        ) : null}
      </div>
    </section>
  );
}
