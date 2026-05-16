"use client";

/**
 * app/atelier/lithophane/lithophane-client.tsx — Lithophane chamber UI.
 *
 * Drag-an-image → submit to `${functionsBase()}/lithophane` → receive
 * binary STL → offer download. The function runs the heavy
 * OpenCV + scikit-image + numpy-stl transform; this client just
 * handles the round-trip and shows progress / parameter controls.
 *
 * Source image stays in the browser until the operator clicks
 * Generate; from there it's sent once, response comes back, function
 * forgets.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { functionUrl } from "lib/firebase/functions";

type OutputState =
  | { kind: "idle" }
  | { kind: "running"; startedAt: number }
  | { kind: "ready"; blob: Blob; filename: string; durationMs: number }
  | { kind: "error"; message: string };

export default function LithophaneClient() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);

  const [scale, setScale] = useState(0.5);
  const [layerHeight, setLayerHeight] = useState(0.2);
  const [numLevels, setNumLevels] = useState(10);
  const [reduction, setReduction] = useState(0.2);

  const [output, setOutput] = useState<OutputState>({ kind: "idle" });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    },
    [sourcePreviewUrl],
  );

  useEffect(() => {
    return () => {
      if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
    };
  }, [sourcePreviewUrl]);

  const onGenerate = useCallback(async () => {
    if (!sourceFile) return;
    const startedAt = Date.now();
    setOutput({ kind: "running", startedAt });
    try {
      const fd = new FormData();
      fd.append("file", sourceFile, sourceFile.name);
      fd.append("scale", String(scale));
      fd.append("layer_height", String(layerHeight));
      fd.append("num_levels", String(numLevels));
      fd.append("reduction", String(reduction));
      const res = await fetch(functionUrl("lithophane"), {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        // Server returned JSON error
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
      const filename = `${base}_lithophane.stl`;
      setOutput({
        kind: "ready",
        blob,
        filename,
        durationMs: Date.now() - startedAt,
      });
    } catch (err) {
      setOutput({
        kind: "error",
        message: err instanceof Error ? err.message : "Generation failed.",
      });
    }
  }, [layerHeight, numLevels, reduction, scale, sourceFile]);

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
            <label className="flex flex-col gap-1.5">
              <span className="chrome-label text-chrome-400">
                Scale &middot; {scale.toFixed(2)} mm/unit
              </span>
              <input
                type="range"
                min={0.1}
                max={2}
                step={0.05}
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="accent-pink-200"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="chrome-label text-chrome-400">
                Layer height &middot; {layerHeight.toFixed(2)} mm
              </span>
              <input
                type="range"
                min={0.05}
                max={0.6}
                step={0.05}
                value={layerHeight}
                onChange={(e) => setLayerHeight(Number(e.target.value))}
                className="accent-pink-200"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="chrome-label text-chrome-400">
                Brightness levels &middot; {numLevels}
              </span>
              <input
                type="range"
                min={4}
                max={20}
                step={1}
                value={numLevels}
                onChange={(e) => setNumLevels(Number(e.target.value))}
                className="accent-pink-200"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="chrome-label text-chrome-400">
                Resolution &middot; {Math.round(reduction * 100)}%
              </span>
              <input
                type="range"
                min={0.05}
                max={0.5}
                step={0.05}
                value={reduction}
                onChange={(e) => setReduction(Number(e.target.value))}
                title="Lower means simpler / faster / chunkier; higher means more detail / longer print time."
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
              {output.kind === "running" ? "Generating STL…" : "→ Generate STL"}
            </button>

            {output.kind === "running" ? (
              <p className="text-xs text-chrome-400">
                The bench transform runs on the studio&rsquo;s Firebase
                Function. Typical 1024px-wide image at 20% reduction
                lands in ~10s; cold starts add another few seconds.
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
