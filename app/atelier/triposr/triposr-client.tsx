"use client";

/**
 * app/atelier/triposr/triposr-client.tsx — TripoSR chamber UI.
 *
 * Drag an image in, hit Generate, the route at
 * `/api/viz/image-to-3d` forwards the bytes to the bench's TripoSR
 * FastAPI route, the bench returns a GLB, the route uploads it via
 * the media library, the chamber renders it in `<model-viewer>` and
 * offers a download.
 *
 * Sync round-trip — TripoSR finishes in ~30s on a 3090. No polling,
 * no job table. Bench-side wrap at `D:/The_Hangar/engines/splat360/
 * src/splat360/api/triposr.py`; server seam at
 * `lib/capabilities/viz/image-to-3d.server.ts`.
 *
 * When the bench is offline OR the venv python is missing, the
 * bench short-circuits to a placeholder GLB header (fake mode) so
 * the chamber + route round-trip can be exercised without the model
 * installed. The chamber treats that as a successful generation —
 * `<model-viewer>` will render an empty scene, which is the honest
 * thing to do.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { createLogger } from "lib/log";
import { pushAtelierOutput, useActiveChamber } from "lib/state/atelier-hooks";
import type { ImageTo3DResult } from "lib/capabilities/viz/image-to-3d";

const log = createLogger("atelier:triposr");

type OutputState =
  | { kind: "idle" }
  | { kind: "running"; startedAt: number }
  | {
      kind: "ready";
      result: ImageTo3DResult;
      filename: string;
      durationMs: number;
    }
  | { kind: "error"; message: string };

type Params = {
  removeBackground: boolean;
  foregroundRatio: number;
  mcResolution: number;
  chunkSize: number;
};

const DEFAULT_PARAMS: Params = {
  removeBackground: true,
  foregroundRatio: 0.85,
  mcResolution: 256,
  chunkSize: 8192,
};

export default function TriposrClient() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);
  const [params, setParams] = useState<Params>(DEFAULT_PARAMS);
  const [output, setOutput] = useState<OutputState>({ kind: "idle" });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const modelViewerLoadedRef = useRef(false);

  useActiveChamber("triposr");

  // Pull the model-viewer web component in once — render-time tag use
  // depends on its custom-element registration, not on a typed import.
  useEffect(() => {
    if (modelViewerLoadedRef.current) return;
    modelViewerLoadedRef.current = true;
    import("@google/model-viewer").catch((err) => {
      log.warn("model-viewer load failed", { err });
    });
  }, []);

  // ---- file handling ----------------------------------------------------

  const loadFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        setOutput({
          kind: "error",
          message: "That doesn't look like an image.",
        });
        return;
      }
      if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
      const url = URL.createObjectURL(file);
      setSourcePreviewUrl(url);
      setSourceFile(file);
      setOutput({ kind: "idle" });
    },
    [sourcePreviewUrl],
  );

  useEffect(() => {
    return () => {
      if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
    };
  }, [sourcePreviewUrl]);

  // ---- generate ---------------------------------------------------------

  const onGenerate = useCallback(async () => {
    if (!sourceFile) return;
    const startedAt = Date.now();
    setOutput({ kind: "running", startedAt });
    try {
      const fd = new FormData();
      fd.append("image", sourceFile, sourceFile.name);
      fd.append("params", JSON.stringify(params));
      const res = await fetch("/api/viz/image-to-3d", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
          const body = (await res.json()) as { error?: string };
          if (body?.error) detail = body.error;
        } catch {
          /* ignore */
        }
        throw new Error(detail);
      }
      const body = (await res.json()) as { result: ImageTo3DResult };
      const result = body.result;
      const base = sourceFile.name.replace(/\.[^.]+$/, "") || "mesh";
      const filename = `${base}_triposr.glb`;
      setOutput({
        kind: "ready",
        result,
        filename,
        durationMs: Date.now() - startedAt,
      });
      pushAtelierOutput({
        chamberSlug: "triposr",
        kind: "glb",
        label: filename,
        blobUrl: result.glbUrl,
        mimeType: "model/gltf-binary",
        sizeBytes: result.glbBytes,
      });
    } catch (err) {
      log.error("generation failed", { err });
      setOutput({
        kind: "error",
        message: err instanceof Error ? err.message : "Generation failed.",
      });
    }
  }, [params, sourceFile]);

  const onDownload = useCallback(() => {
    if (output.kind !== "ready") return;
    const a = document.createElement("a");
    a.href = output.result.glbUrl;
    a.download = output.filename;
    // Same-origin downloads work as-is; cross-origin Blob URLs ride the
    // browser's default "save as".
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
  }, [output]);

  // ---- drop zone --------------------------------------------------------

  const dropClasses = `flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-sm border border-dashed px-6 py-10 text-center transition-colors ${
    isDragOver
      ? "border-pink-200 bg-warm-black-900/60"
      : "border-warm-black-700 bg-warm-black-950"
  }`;

  return (
    <div className="flex flex-col gap-8">
      <section
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) loadFile(file);
        }}
        className={dropClasses}
      >
        {sourcePreviewUrl ? (
          <div className="flex flex-col items-center gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sourcePreviewUrl}
              alt="Source"
              className="max-h-64 rounded-sm border border-warm-black-800"
            />
            <span className="chrome-label text-chrome-500">Source image</span>
          </div>
        ) : null}
        <span className="chrome-label text-chrome-400">Drop zone</span>
        <p className="text-sm leading-relaxed text-chrome-300">
          Drag an image here, or
        </p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
        >
          Upload image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          aria-label="Upload an image to reconstruct into a 3D mesh"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) loadFile(file);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
      </section>

      {sourceFile ? (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-row items-center gap-3 md:col-span-2 lg:col-span-1">
              <input
                type="checkbox"
                checked={params.removeBackground}
                onChange={(e) =>
                  setParams((p) => ({
                    ...p,
                    removeBackground: e.target.checked,
                  }))
                }
                className="h-4 w-4 accent-pink-200"
              />
              <span className="chrome-label text-chrome-400">
                Remove background
              </span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="chrome-label text-chrome-400">
                Foreground ratio &middot; {params.foregroundRatio.toFixed(2)}
              </span>
              <input
                type="range"
                min={0.4}
                max={1}
                step={0.05}
                value={params.foregroundRatio}
                onChange={(e) =>
                  setParams((p) => ({
                    ...p,
                    foregroundRatio: Number(e.target.value),
                  }))
                }
                disabled={!params.removeBackground}
                className="accent-pink-200"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="chrome-label text-chrome-400">
                Mesh resolution &middot; {params.mcResolution}
              </span>
              <input
                type="range"
                min={64}
                max={512}
                step={32}
                value={params.mcResolution}
                onChange={(e) =>
                  setParams((p) => ({
                    ...p,
                    mcResolution: Number(e.target.value),
                  }))
                }
                className="accent-pink-200"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="chrome-label text-chrome-400">
                Chunk size &middot; {params.chunkSize}
              </span>
              <input
                type="range"
                min={0}
                max={32768}
                step={1024}
                value={params.chunkSize}
                onChange={(e) =>
                  setParams((p) => ({
                    ...p,
                    chunkSize: Number(e.target.value),
                  }))
                }
                title="0 disables chunked evaluation. Lower values use less VRAM, take longer."
                className="accent-pink-200"
              />
            </label>
          </section>

          <section className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onGenerate}
              disabled={output.kind === "running"}
              className="self-start rounded-sm border border-pink-200/60 bg-pink-900/40 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
            >
              {output.kind === "running"
                ? "Generating 3D…"
                : "Generate 3D"}
            </button>

            {output.kind === "running" ? (
              <p className="text-xs text-chrome-400">
                Bench inference. TripoSR runs ~30s on a 3090; cold GPU
                starts add a few seconds. Sync round-trip, no polling.
              </p>
            ) : null}

            {output.kind === "ready" ? (
              <div className="flex flex-col gap-3 rounded-sm border border-emerald-400/30 bg-emerald-900/10 px-4 py-3">
                <span className="font-mono text-xs text-emerald-200">
                  Mesh ready &middot;{" "}
                  {(output.result.glbBytes / 1024).toFixed(0)} KB &middot;{" "}
                  {(output.durationMs / 1000).toFixed(1)}s
                </span>
                {/* @ts-expect-error — model-viewer is a web component */}
                <model-viewer
                  src={output.result.glbUrl}
                  alt="Generated 3D mesh"
                  camera-controls
                  auto-rotate
                  style={{
                    width: "100%",
                    height: "420px",
                    backgroundColor: "#0d0d12",
                  }}
                />
                <button
                  type="button"
                  onClick={onDownload}
                  className="self-start rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
                >
                  Download GLB
                </button>
              </div>
            ) : null}

            {output.kind === "error" ? (
              <p className="rounded-sm border border-pink-400/40 bg-pink-900/10 px-4 py-3 text-xs text-pink-200">
                {output.message}
              </p>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
