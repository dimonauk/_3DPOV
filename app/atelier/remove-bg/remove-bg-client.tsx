"use client";

/**
 * app/atelier/remove-bg/remove-bg-client.tsx — Remove-background chamber UI.
 *
 * Drag-an-image → POST to `${functionsBase()}/remove_bg` → receive a
 * PNG with alpha → preview over a checker pattern → offer download.
 * The function runs rembg + a U^2-Net ONNX model; this client just
 * handles the round-trip and the model selector.
 *
 * The source image stays in the browser until the operator clicks
 * Remove background; from there it's sent once, response comes back,
 * function forgets.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { functionUrl } from "lib/firebase/functions";
import { createLogger } from "lib/log";

const log = createLogger("atelier:remove-bg");

type ModelChoice = "u2net" | "u2net_human_seg" | "isnet-general-use";

const MODEL_OPTIONS: { value: ModelChoice; label: string; hint: string }[] = [
  {
    value: "u2net",
    label: "u2net",
    hint: "Default. General-purpose salient object segmentation.",
  },
  {
    value: "u2net_human_seg",
    label: "u2net_human_seg",
    hint: "Humans only. Faster on portraits; cleaner hair edges.",
  },
  {
    value: "isnet-general-use",
    label: "isnet-general-use",
    hint: "Newer general-purpose model. Better fine detail, slower.",
  },
];

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

export default function RemoveBgClient() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);

  const [model, setModel] = useState<ModelChoice>("u2net");

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

  useEffect(() => {
    return () => {
      if (output.kind === "ready") URL.revokeObjectURL(output.previewUrl);
    };
  }, [output]);

  const onGenerate = useCallback(async () => {
    if (!sourceFile) return;
    const startedAt = Date.now();
    setOutput({ kind: "running", startedAt });
    try {
      const fd = new FormData();
      fd.append("file", sourceFile, sourceFile.name);
      fd.append("model", model);
      const res = await fetch(functionUrl("remove_bg"), {
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
      const filename = `${base}_no_bg.png`;
      setOutput({
        kind: "ready",
        blob,
        previewUrl,
        filename,
        durationMs: Date.now() - startedAt,
      });
    } catch (err) {
      log.error("generation failed", { err });
      setOutput({
        kind: "error",
        message: err instanceof Error ? err.message : "Generation failed.",
      });
    }
  }, [model, sourceFile]);

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

  // Checker pattern so the alpha channel is visible in the preview.
  const checkerStyle: React.CSSProperties = {
    backgroundColor: "#1a1a1a",
    backgroundImage:
      "linear-gradient(45deg, #2a2a2a 25%, transparent 25%), " +
      "linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), " +
      "linear-gradient(45deg, transparent 75%, #2a2a2a 75%), " +
      "linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)",
    backgroundSize: "16px 16px",
    backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
  };

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
          aria-label="Choose an image to remove the background from"
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
          <section className="grid grid-cols-1 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="chrome-label text-chrome-400">
                Model &middot; {model}
              </span>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as ModelChoice)}
                className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 font-mono text-xs text-chrome-200"
              >
                {MODEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="text-xs text-chrome-400">
                {
                  MODEL_OPTIONS.find((opt) => opt.value === model)?.hint
                }
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
              {output.kind === "running"
                ? "Removing background…"
                : "→ Remove background"}
            </button>

            {output.kind === "running" ? (
              <p className="text-xs text-chrome-400">
                The bench transform runs on the studio&rsquo;s Firebase
                Function. First call after a cold start downloads the
                model (~170 MB) and takes ~30s; warm calls finish in a
                second or two.
              </p>
            ) : null}

            {output.kind === "ready" ? (
              <div className="flex flex-col gap-4 rounded-sm border border-emerald-400/30 bg-emerald-900/10 px-4 py-3">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-mono text-xs text-emerald-200">
                    PNG ready &middot;{" "}
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
                <div
                  className="rounded-sm border border-warm-black-800 p-2"
                  style={checkerStyle}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={output.previewUrl}
                    alt="Background removed"
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
