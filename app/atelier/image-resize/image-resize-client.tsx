"use client";

/**
 * app/atelier/image-resize/image-resize-client.tsx — Resize chamber UI.
 *
 * Drag-an-image → POST to `${functionsBase()}/image_resize` → receive
 * the resized + transcoded bytes → preview + offer download. The
 * function runs Pillow; this client handles the round-trip and the
 * parameter controls.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { functionUrl } from "lib/firebase/functions";
import { createLogger } from "lib/log";
import { pushAtelierOutput, useActiveChamber } from "lib/state/atelier-hooks";

const log = createLogger("atelier:image-resize");

type ResizeMode = "width" | "height" | "longest-edge";
type FitMode = "contain" | "cover" | "stretch";
type OutputFormat = "png" | "jpeg" | "webp" | "avif";

type OutputState =
  | { kind: "idle" }
  | { kind: "running"; startedAt: number }
  | {
      kind: "ready";
      blob: Blob;
      previewUrl: string;
      filename: string;
      durationMs: number;
    }
  | { kind: "error"; message: string };

const MODE_OPTIONS: { value: ResizeMode; label: string }[] = [
  { value: "width", label: "Width" },
  { value: "height", label: "Height" },
  { value: "longest-edge", label: "Longest edge" },
];

const FIT_OPTIONS: { value: FitMode; label: string; hint: string }[] = [
  {
    value: "contain",
    label: "Contain",
    hint: "Preserve aspect ratio; target dimension is exact.",
  },
  {
    value: "cover",
    label: "Cover",
    hint: "Fill the target box; centre-crop the overflow.",
  },
  {
    value: "stretch",
    label: "Stretch",
    hint: "Force the resampled image into the target; aspect ratio is lost.",
  },
];

const FORMAT_OPTIONS: { value: OutputFormat; label: string; ext: string }[] = [
  { value: "png", label: "PNG", ext: "png" },
  { value: "jpeg", label: "JPEG", ext: "jpg" },
  { value: "webp", label: "WebP", ext: "webp" },
  { value: "avif", label: "AVIF", ext: "avif" },
];

export default function ImageResizeClient() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);
  const [sourceDims, setSourceDims] = useState<{ w: number; h: number } | null>(
    null,
  );

  const [mode, setMode] = useState<ResizeMode>("longest-edge");
  const [target, setTarget] = useState(1920);
  const [fit, setFit] = useState<FitMode>("contain");
  const [format, setFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(90);
  const [stripIcc, setStripIcc] = useState(false);

  const [output, setOutput] = useState<OutputState>({ kind: "idle" });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useActiveChamber("image-resize");

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
      setSourceDims(null);
      setOutput({ kind: "idle" });

      // Read intrinsic dimensions for the readout + fit-control gating.
      const probe = new Image();
      probe.onload = () => {
        setSourceDims({ w: probe.naturalWidth, h: probe.naturalHeight });
      };
      probe.src = url;
    },
    [sourcePreviewUrl],
  );

  useEffect(() => {
    return () => {
      if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
    };
  }, [sourcePreviewUrl]);

  useEffect(() => {
    return () => {
      if (output.kind === "ready") URL.revokeObjectURL(output.previewUrl);
    };
  }, [output]);

  // Fit control only matters when the source aspect ratio differs from
  // what the target would impose. Since we operate on a single
  // dimension at a time, "contain" and "cover" only meaningfully
  // differ when something is being cropped; show the fit picker once
  // the operator has a source in hand.
  const showFitControl = useMemo(() => sourceDims !== null, [sourceDims]);

  const onResize = useCallback(async () => {
    if (!sourceFile) return;
    const startedAt = Date.now();
    setOutput({ kind: "running", startedAt });
    try {
      const fd = new FormData();
      fd.append("file", sourceFile, sourceFile.name);
      fd.append("mode", mode);
      fd.append("target", String(target));
      fd.append("fit", fit);
      fd.append("format", format);
      fd.append("quality", String(quality));
      fd.append("strip_icc", stripIcc ? "1" : "0");
      const res = await fetch(functionUrl("image_resize"), {
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
      const previewUrl = URL.createObjectURL(blob);
      const base = sourceFile.name.replace(/\.[^.]+$/, "");
      const ext =
        FORMAT_OPTIONS.find((opt) => opt.value === format)?.ext ?? format;
      const filename = `${base}_resized.${ext}`;
      setOutput({
        kind: "ready",
        blob,
        previewUrl,
        filename,
        durationMs: Date.now() - startedAt,
      });
      pushAtelierOutput({
        chamberSlug: "image-resize",
        kind: "image",
        label: filename,
        blobUrl: URL.createObjectURL(blob),
        mimeType: `image/${format === "jpeg" ? "jpeg" : format}`,
        sizeBytes: blob.size,
      });
    } catch (err) {
      log.error("resize failed", { err });
      setOutput({
        kind: "error",
        message: err instanceof Error ? err.message : "Resize failed.",
      });
    }
  }, [fit, format, mode, quality, sourceFile, stripIcc, target]);

  const onDownload = useCallback(() => {
    if (output.kind !== "ready") return;
    const a = document.createElement("a");
    a.href = output.previewUrl;
    a.download = output.filename;
    a.click();
  }, [output]);

  // ---- Drop zone ---------------------------------------------------------

  const dropClasses = `flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-sm border border-dashed px-6 py-10 text-center transition-colors ${
    isDragOver
      ? "border-pink-200 bg-warm-black-900/60"
      : "border-warm-black-700 bg-warm-black-950"
  }`;

  const radioGroupClasses =
    "flex flex-wrap gap-2 rounded-sm border border-warm-black-800 bg-warm-black-950 p-1";
  const radioItemClasses = (active: boolean): string =>
    `cursor-pointer rounded-sm px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
      active
        ? "bg-pink-200/20 text-pink-100"
        : "text-chrome-400 hover:text-chrome-200"
    }`;

  const qualityDisabled = format === "png";

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
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sourcePreviewUrl}
            alt="Source"
            className="max-h-64 rounded-sm border border-warm-black-800"
          />
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
          aria-label="Choose an image to resize"
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
          <section className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-sm border border-warm-black-800 bg-warm-black-900/30 px-4 py-3 text-xs text-chrome-300">
            <span className="font-mono">
              {sourceFile.name}
            </span>
            {sourceDims ? (
              <span className="font-mono text-chrome-400">
                {sourceDims.w}&times;{sourceDims.h}px
              </span>
            ) : null}
            <span className="font-mono text-chrome-400">
              {(sourceFile.size / 1024).toFixed(0)} KB
            </span>
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <span className="chrome-label text-chrome-400">Mode</span>
              <div
                className={radioGroupClasses}
                role="radiogroup"
                aria-label="Resize mode"
              >
                {MODE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={radioItemClasses(mode === opt.value)}
                  >
                    <input
                      type="radio"
                      name="mode"
                      value={opt.value}
                      checked={mode === opt.value}
                      onChange={() => setMode(opt.value)}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="chrome-label text-chrome-400">
                Target &middot; {target}px
              </span>
              <input
                type="number"
                min={16}
                max={8192}
                step={1}
                value={target}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  if (Number.isFinite(next)) {
                    setTarget(Math.max(16, Math.min(8192, Math.round(next))));
                  }
                }}
                className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 font-mono text-xs text-chrome-200"
                aria-label="Target dimension in pixels"
              />
            </label>

            {showFitControl ? (
              <div className="flex flex-col gap-2">
                <span className="chrome-label text-chrome-400">Fit</span>
                <div
                  className={radioGroupClasses}
                  role="radiogroup"
                  aria-label="Fit mode"
                >
                  {FIT_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={radioItemClasses(fit === opt.value)}
                      title={opt.hint}
                    >
                      <input
                        type="radio"
                        name="fit"
                        value={opt.value}
                        checked={fit === opt.value}
                        onChange={() => setFit(opt.value)}
                        className="sr-only"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
                <span className="text-xs text-chrome-400">
                  {FIT_OPTIONS.find((opt) => opt.value === fit)?.hint}
                </span>
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              <span className="chrome-label text-chrome-400">Format</span>
              <div
                className={radioGroupClasses}
                role="radiogroup"
                aria-label="Output format"
              >
                {FORMAT_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={radioItemClasses(format === opt.value)}
                  >
                    <input
                      type="radio"
                      name="format"
                      value={opt.value}
                      checked={format === opt.value}
                      onChange={() => setFormat(opt.value)}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="chrome-label text-chrome-400">
                Quality &middot; {qualityDisabled ? "n/a (PNG)" : quality}
              </span>
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                disabled={qualityDisabled}
                className="accent-pink-200 disabled:opacity-40"
                aria-label="Quality for lossy formats"
              />
            </label>

            <label className="flex items-center gap-2 self-end">
              <input
                type="checkbox"
                checked={stripIcc}
                onChange={(e) => setStripIcc(e.target.checked)}
                className="accent-pink-200"
              />
              <span className="font-mono text-xs text-chrome-300">
                Strip ICC profile
              </span>
            </label>
          </section>

          <section className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onResize}
              disabled={output.kind === "running"}
              className="self-start rounded-sm border border-pink-200/60 bg-pink-900/40 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
            >
              {output.kind === "running" ? "Resizing…" : "→ Resize"}
            </button>

            {output.kind === "running" ? (
              <p className="text-xs text-chrome-400">
                Pillow runs the transform on the studio&rsquo;s Firebase
                Function. Typical 4000px-wide JPEG lands in a second or
                two; cold starts add a few more.
              </p>
            ) : null}

            {output.kind === "ready" ? (
              <div className="flex flex-col gap-4 rounded-sm border border-emerald-400/30 bg-emerald-900/10 px-4 py-3">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-mono text-xs text-emerald-200">
                    Ready &middot;{" "}
                    {(output.blob.size / 1024).toFixed(0)} KB &middot;{" "}
                    {(output.durationMs / 1000).toFixed(1)}s
                  </span>
                  <span className="font-mono text-[10px] text-chrome-400">
                    Was {(sourceFile.size / 1024).toFixed(0)} KB &middot;{" "}
                    {sourceFile.size > 0
                      ? `${(
                          (output.blob.size / sourceFile.size) *
                          100
                        ).toFixed(0)}% of source`
                      : ""}
                  </span>
                  <button
                    type="button"
                    onClick={onDownload}
                    className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
                  >
                    Download {output.filename}
                  </button>
                </div>
                <div className="rounded-sm border border-warm-black-800 bg-warm-black-950 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={output.previewUrl}
                    alt="Resized result"
                    className="mx-auto max-h-96"
                  />
                </div>
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
