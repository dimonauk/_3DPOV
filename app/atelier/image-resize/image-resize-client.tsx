"use client";
/**
 * image-resize-client.tsx — Orchestrator: state, fetch logic, output panel.
 * UI panels live in image-resize-dropzone.tsx and image-resize-controls.tsx.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { functionUrl } from "lib/firebase/functions";
import { createLogger } from "lib/log";
import { pushAtelierOutput, useActiveChamber } from "lib/state/atelier-hooks";
import { ImageResizeDropzone } from "./image-resize-dropzone";
import { ImageResizeControls } from "./image-resize-controls";
import { FORMAT_OPTIONS } from "./image-resize-types";
import type { FitMode, OutputFormat, OutputState, ResizeMode } from "./image-resize-types";

const log = createLogger("atelier:image-resize");

export default function ImageResizeClient() {
  const [sourceFile, setSourceFile]         = useState<File | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);
  const [sourceDims, setSourceDims]         = useState<{ w: number; h: number } | null>(null);
  const [mode, setMode]     = useState<ResizeMode>("longest-edge");
  const [target, setTarget] = useState(1920);
  const [fit, setFit]       = useState<FitMode>("contain");
  const [format, setFormat] = useState<OutputFormat>("png");
  const [quality, setQuality]   = useState(90);
  const [stripIcc, setStripIcc] = useState(false);
  const [output, setOutput]     = useState<OutputState>({ kind: "idle" });
  const [isDragOver, setIsDragOver] = useState(false);
  const prevPreviewRef = useRef<string | null>(null);

  useActiveChamber("image-resize");

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { setOutput({ kind: "error", message: "That doesn't look like an image." }); return; }
    if (prevPreviewRef.current) URL.revokeObjectURL(prevPreviewRef.current);
    const url = URL.createObjectURL(file);
    prevPreviewRef.current = url;
    setSourcePreviewUrl(url);
    setSourceFile(file);
    setSourceDims(null);
    setOutput({ kind: "idle" });
    const probe = new Image();
    probe.onload = () => setSourceDims({ w: probe.naturalWidth, h: probe.naturalHeight });
    probe.src = url;
  }, []);

  useEffect(() => () => { if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl); }, [sourcePreviewUrl]);
  useEffect(() => () => { if (output.kind === "ready") URL.revokeObjectURL(output.previewUrl); }, [output]);

  const onResize = useCallback(async () => {
    if (!sourceFile) return;
    const startedAt = Date.now();
    setOutput({ kind: "running", startedAt });
    try {
      const fd = new FormData();
      fd.append("file", sourceFile, sourceFile.name);
      fd.append("mode", mode); fd.append("target", String(target));
      fd.append("fit", fit);   fd.append("format", format);
      fd.append("quality", String(quality)); fd.append("strip_icc", stripIcc ? "1" : "0");
      const res = await fetch(functionUrl("image_resize"), { method: "POST", body: fd });
      if (!res.ok) {
        const text = await res.text();
        try { throw new Error((JSON.parse(text) as { error?: string }).error ?? `HTTP ${res.status}`); }
        catch { throw new Error(text.slice(0, 200) || `HTTP ${res.status}`); }
      }
      const blob = await res.blob();
      const previewUrl = URL.createObjectURL(blob);
      const base = sourceFile.name.replace(/\.[^.]+$/, "");
      const ext  = FORMAT_OPTIONS.find((o) => o.value === format)?.ext ?? format;
      const filename = `${base}_resized.${ext}`;
      setOutput({ kind: "ready", blob, previewUrl, filename, durationMs: Date.now() - startedAt });
      pushAtelierOutput({ chamberSlug: "image-resize", kind: "image", label: filename, blobUrl: URL.createObjectURL(blob), mimeType: `image/${format === "jpeg" ? "jpeg" : format}`, sizeBytes: blob.size });
    } catch (err) {
      log.error("resize failed", { err });
      setOutput({ kind: "error", message: err instanceof Error ? err.message : "Resize failed." });
    }
  }, [fit, format, mode, quality, sourceFile, stripIcc, target]);

  const onDownload = useCallback(() => {
    if (output.kind !== "ready") return;
    const a = document.createElement("a"); a.href = output.previewUrl; a.download = output.filename; a.click();
  }, [output]);

  return (
    <div className="flex flex-col gap-8">
      <ImageResizeDropzone sourcePreviewUrl={sourcePreviewUrl} isDragOver={isDragOver} onFile={loadFile} onDragOver={() => setIsDragOver(true)} onDragLeave={() => setIsDragOver(false)} />

      {sourceFile && (
        <>
          <ImageResizeControls sourceFile={sourceFile} sourceDims={sourceDims}
            mode={mode} onMode={setMode} target={target} onTarget={setTarget}
            fit={fit} onFit={setFit} format={format} onFormat={setFormat}
            quality={quality} onQuality={setQuality} stripIcc={stripIcc} onStripIcc={setStripIcc} />

          {/* ── output panel ── */}
          <section className="flex flex-col gap-3">
            <button type="button" onClick={onResize} disabled={output.kind === "running"}
              className="self-start rounded-sm border border-pink-200/60 bg-pink-900/40 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60">
              {output.kind === "running" ? "Resizing…" : "→ Resize"}
            </button>

            {output.kind === "running" && (
              <p className="text-xs text-chrome-400">Pillow runs the transform on the studio&rsquo;s Firebase Function. Typical 4000px-wide JPEG lands in a second or two; cold starts add a few more.</p>
            )}
            {output.kind === "ready" && (
              <div className="flex flex-col gap-4 rounded-sm border border-emerald-400/30 bg-emerald-900/10 px-4 py-3">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-mono text-xs text-emerald-200">
                    Ready &middot; {(output.blob.size / 1024).toFixed(0)} KB &middot; {(output.durationMs / 1000).toFixed(1)}s
                  </span>
                  <span className="font-mono text-[10px] text-chrome-400">
                    Was {(sourceFile.size / 1024).toFixed(0)} KB {sourceFile.size > 0 ? `· ${((output.blob.size / sourceFile.size) * 100).toFixed(0)}% of source` : ""}
                  </span>
                  <button type="button" onClick={onDownload}
                    className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20">
                    Download {output.filename}
                  </button>
                </div>
                <div className="rounded-sm border border-warm-black-800 bg-warm-black-950 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={output.previewUrl} alt="Resized result" className="mx-auto max-h-96" />
                </div>
              </div>
            )}
            {output.kind === "error" && (
              <p className="rounded-sm border border-pink-400/40 bg-pink-900/10 px-4 py-3 text-xs text-pink-200">{output.message}</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
