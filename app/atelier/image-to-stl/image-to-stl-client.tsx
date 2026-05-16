"use client";

/**
 * app/atelier/image-to-stl/image-to-stl-client.tsx — Image-to-STL
 * chamber UI.
 *
 * Drag-an-image → threshold preview in the browser → submit to
 * `${functionsBase()}/image_to_stl` → receive binary STL → offer
 * download. The function runs the contour-extrusion transform; this
 * client handles the round-trip, parameter controls, and a live
 * client-side preview of the binary mask so the operator can dial
 * the threshold in before paying for a Function call.
 *
 * Source image stays in the browser until the operator clicks
 * Generate; from there it's sent once, response comes back, function
 * forgets.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { functionUrl } from "lib/firebase/functions";
import { createLogger } from "lib/log";
import { pushAtelierOutput, useActiveChamber } from "lib/state/atelier-hooks";

const log = createLogger("atelier:image-to-stl");

type OutputState =
  | { kind: "idle" }
  | { kind: "running"; startedAt: number }
  | { kind: "ready"; blob: Blob; filename: string; durationMs: number }
  | { kind: "error"; message: string };

const PREVIEW_DEBOUNCE_MS = 120;

export default function ImageToStlClient() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);

  const [threshold, setThreshold] = useState(128);
  const [extrudeMm, setExtrudeMm] = useState(3.0);
  const [baseMm, setBaseMm] = useState(0.5);
  const [scale, setScale] = useState(0.3);
  const [invert, setInvert] = useState(false);

  const [output, setOutput] = useState<OutputState>({ kind: "idle" });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useActiveChamber("image-to-stl");

  // Off-screen ImageData of the original — once decoded, the threshold
  // preview just remaps pixels rather than re-decoding the file.
  const sourceImageDataRef = useRef<ImageData | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const loadFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        setOutput({ kind: "error", message: "That doesn't look like an image." });
        return;
      }
      if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
      const url = URL.createObjectURL(file);
      setSourcePreviewUrl(url);
      setSourceFile(file);
      setOutput({ kind: "idle" });
      sourceImageDataRef.current = null;
    },
    [sourcePreviewUrl],
  );

  useEffect(() => {
    return () => {
      if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
    };
  }, [sourcePreviewUrl]);

  // ---- Decode source into ImageData once per file ------------------------
  useEffect(() => {
    if (!sourcePreviewUrl) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      // Cap preview to keep the off-screen buffer reasonable; the
      // function does the same kind of cap on its side.
      const maxDim = 1024;
      const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * ratio));
      const h = Math.max(1, Math.round(img.height * ratio));
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const ctx = off.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      sourceImageDataRef.current = ctx.getImageData(0, 0, w, h);
      // Trigger an initial preview render.
      renderPreview();
    };
    img.src = sourcePreviewUrl;
    return () => {
      cancelled = true;
    };
    // renderPreview deliberately recaptured by the latest closure when
    // params change via the debounced effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourcePreviewUrl]);

  // ---- Threshold preview render (debounced) ------------------------------
  const renderPreview = useCallback(() => {
    const data = sourceImageDataRef.current;
    const canvas = previewCanvasRef.current;
    if (!data || !canvas) return;
    canvas.width = data.width;
    canvas.height = data.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const out = ctx.createImageData(data.width, data.height);
    const src = data.data;
    const dst = out.data;
    const t = threshold;
    const inv = invert;
    for (let i = 0; i < src.length; i += 4) {
      // Rec. 601 luma — same approximation cv2.imdecode IMREAD_GRAYSCALE uses.
      const lum =
        0.299 * (src[i] ?? 0) +
        0.587 * (src[i + 1] ?? 0) +
        0.114 * (src[i + 2] ?? 0);
      const ink = inv ? lum <= t : lum > t;
      const v = ink ? 0 : 255; // ink → black, paper → white (readable on light bg)
      dst[i] = v;
      dst[i + 1] = v;
      dst[i + 2] = v;
      dst[i + 3] = 255;
    }
    ctx.putImageData(out, 0, 0);
  }, [threshold, invert]);

  useEffect(() => {
    if (!sourcePreviewUrl) return;
    const handle = window.setTimeout(renderPreview, PREVIEW_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [renderPreview, sourcePreviewUrl]);

  const onGenerate = useCallback(async () => {
    if (!sourceFile) return;
    const startedAt = Date.now();
    setOutput({ kind: "running", startedAt });
    try {
      const fd = new FormData();
      fd.append("file", sourceFile, sourceFile.name);
      fd.append("threshold", String(threshold));
      fd.append("extrude_mm", String(extrudeMm));
      fd.append("base_mm", String(baseMm));
      fd.append("scale", String(scale));
      fd.append("invert", invert ? "1" : "0");
      const res = await fetch(functionUrl("image_to_stl"), {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const text = await res.text();
        try {
          const parsed = JSON.parse(text) as { error?: string };
          throw new Error(parsed.error ?? `HTTP ${res.status}`);
        } catch {
          throw new Error(text.slice(0, 200) || `HTTP ${res.status}`);
        }
      }
      const blob = await res.blob();
      const base = sourceFile.name.replace(/\.[^.]+$/, "");
      const filename = `${base}_image_to_stl.stl`;
      setOutput({
        kind: "ready",
        blob,
        filename,
        durationMs: Date.now() - startedAt,
      });
      pushAtelierOutput({
        chamberSlug: "image-to-stl",
        kind: "stl",
        label: filename,
        blobUrl: URL.createObjectURL(blob),
        mimeType: "model/stl",
        sizeBytes: blob.size,
      });
    } catch (err) {
      log.error("generation failed", { err });
      setOutput({
        kind: "error",
        message: err instanceof Error ? err.message : "Generation failed.",
      });
    }
  }, [baseMm, extrudeMm, invert, scale, sourceFile, threshold]);

  const onDownload = useCallback(() => {
    if (output.kind !== "ready") return;
    const url = URL.createObjectURL(output.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = output.filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [output]);

  // ---- Drop zone ---------------------------------------------------------

  const dropClasses = `flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-sm border border-dashed px-6 py-10 text-center transition-colors ${
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
          <div className="flex flex-wrap items-start justify-center gap-4">
            <div className="flex flex-col items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sourcePreviewUrl}
                alt="Source"
                className="max-h-64 rounded-sm border border-warm-black-800"
              />
              <span className="chrome-label text-chrome-500">Source</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <canvas
                ref={previewCanvasRef}
                className="max-h-64 rounded-sm border border-warm-black-800 bg-white"
                style={{ maxWidth: 256, height: "auto" }}
              />
              <span className="chrome-label text-chrome-500">
                Threshold preview
              </span>
            </div>
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
          Choose an image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          aria-label="Choose an image to extrude into an STL plate"
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
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <label className="flex flex-col gap-1.5">
              <span className="chrome-label text-chrome-400">
                Threshold &middot; {threshold}
              </span>
              <input
                type="range"
                min={0}
                max={255}
                step={1}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="accent-pink-200"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="chrome-label text-chrome-400">
                Extrude depth &middot; {extrudeMm.toFixed(1)} mm
              </span>
              <input
                type="range"
                min={0.5}
                max={10}
                step={0.1}
                value={extrudeMm}
                onChange={(e) => setExtrudeMm(Number(e.target.value))}
                className="accent-pink-200"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="chrome-label text-chrome-400">
                Base plate &middot; {baseMm.toFixed(1)} mm
              </span>
              <input
                type="range"
                min={0}
                max={3}
                step={0.1}
                value={baseMm}
                onChange={(e) => setBaseMm(Number(e.target.value))}
                title="0 means the ink regions print as free-floating shapes."
                className="accent-pink-200"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="chrome-label text-chrome-400">
                Scale &middot; {scale.toFixed(2)} mm/px
              </span>
              <input
                type="range"
                min={0.1}
                max={1.0}
                step={0.05}
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="accent-pink-200"
              />
            </label>

            <label className="flex flex-row items-center gap-3 md:col-span-2 lg:col-span-1">
              <input
                type="checkbox"
                checked={invert}
                onChange={(e) => setInvert(e.target.checked)}
                className="h-4 w-4 accent-pink-200"
              />
              <span className="chrome-label text-chrome-400">
                Invert &middot; dark regions become ink
              </span>
            </label>
          </section>

          <section className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onGenerate}
              disabled={output.kind === "running"}
              className="self-start rounded-sm border border-pink-200/60 bg-pink-900/40 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
            >
              {output.kind === "running" ? "Generating STL…" : "→ Generate STL"}
            </button>

            {output.kind === "running" ? (
              <p className="text-xs text-chrome-400">
                The bench transform runs on the studio&rsquo;s Firebase
                Function. Threshold + contour-extract is fast; a 1024px
                image usually lands in a few seconds. Cold starts add
                another few seconds on top.
              </p>
            ) : null}

            {output.kind === "ready" ? (
              <div className="flex flex-wrap items-center gap-4 rounded-sm border border-emerald-400/30 bg-emerald-900/10 px-4 py-3">
                <span className="font-mono text-xs text-emerald-200">
                  STL ready &middot;{" "}
                  {(output.blob.size / 1024).toFixed(0)} KB &middot;{" "}
                  {(output.durationMs / 1000).toFixed(1)}s
                </span>
                <button
                  type="button"
                  onClick={onDownload}
                  className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
                >
                  Download {output.filename}
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
