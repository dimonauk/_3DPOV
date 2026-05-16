"use client";

/**
 * app/atelier/pixeldetector/pixeldetector-client.tsx — Pixel Detector
 * chamber UI.
 *
 * Drag-an-image → POST to `${functionsBase()}/pixeldetector` → receive
 * `{ nativeWidth, nativeHeight, scaleFactor, confidence }` → display
 * the result. The function runs the Pillow + numpy native-grid sweep;
 * this client just handles the round-trip.
 *
 * Source image stays in the browser until the operator clicks Detect;
 * from there it's sent once, response comes back, function forgets.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { functionUrl } from "lib/firebase/functions";
import { createLogger } from "lib/log";

const log = createLogger("atelier:pixeldetector");

type DetectionResult = {
  nativeWidth: number;
  nativeHeight: number;
  scaleFactor: number;
  confidence: number;
};

type OutputState =
  | { kind: "idle" }
  | { kind: "running"; startedAt: number }
  | { kind: "ready"; result: DetectionResult; durationMs: number }
  | { kind: "error"; message: string };

export default function PixeldetectorClient() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);

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

  const onDetect = useCallback(async () => {
    if (!sourceFile) return;
    const startedAt = Date.now();
    setOutput({ kind: "running", startedAt });
    try {
      const fd = new FormData();
      fd.append("file", sourceFile, sourceFile.name);
      const res = await fetch(functionUrl("pixeldetector"), {
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
      const result = (await res.json()) as DetectionResult;
      setOutput({
        kind: "ready",
        result,
        durationMs: Date.now() - startedAt,
      });
    } catch (err) {
      log.error("detection failed", { err });
      setOutput({
        kind: "error",
        message: err instanceof Error ? err.message : "Detection failed.",
      });
    }
  }, [sourceFile]);

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
            style={{ imageRendering: "pixelated" }}
          />
        ) : null}
        <span className="chrome-label text-chrome-400">Drop zone</span>
        <p className="text-sm leading-relaxed text-chrome-300">
          Drag a piece of pixel art here, or
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
          aria-label="Choose a pixel-art image to inspect"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) loadFile(file);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
      </section>

      {sourceFile ? (
        <section className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onDetect}
            disabled={output.kind === "running"}
            className="self-start rounded-sm border border-pink-200/60 bg-pink-900/40 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
          >
            {output.kind === "running"
              ? "Detecting native resolution…"
              : "→ Detect native resolution"}
          </button>

          {output.kind === "running" ? (
            <p className="text-xs text-chrome-400">
              The chamber walks the divisor ladder, downscaling and
              upscaling by each integer factor and measuring the error.
              Small images land in under a second; cold starts add a few.
            </p>
          ) : null}

          {output.kind === "ready" ? (
            <div className="flex flex-col gap-2 rounded-sm border border-emerald-400/30 bg-emerald-900/10 px-4 py-3">
              <span className="font-mono text-sm text-emerald-200">
                {output.result.nativeWidth} &times;{" "}
                {output.result.nativeHeight} px @{" "}
                {output.result.scaleFactor}&times; upscale
              </span>
              <span className="font-mono text-xs text-chrome-400">
                confidence{" "}
                {(output.result.confidence * 100).toFixed(1)}% &middot;{" "}
                {(output.durationMs / 1000).toFixed(2)}s
              </span>
            </div>
          ) : null}

          {output.kind === "error" ? (
            <p className="rounded-sm border border-pink-400/40 bg-pink-900/10 px-4 py-3 text-xs text-pink-200">
              {output.message}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
