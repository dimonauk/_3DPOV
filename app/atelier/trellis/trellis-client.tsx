"use client";

/**
 * app/atelier/trellis/trellis-client.tsx — TRELLIS chamber UI.
 *
 * Type a prompt (optionally drop a reference image, optionally set a
 * seed), hit Generate 3D. The route at `/api/viz/text-to-3d` forwards
 * to the bench's TRELLIS FastAPI route. The bench returns a GLB,
 * the route uploads it via the media library, the chamber renders it
 * in `<model-viewer>` and offers a download.
 *
 * Sync round-trip — TRELLIS finishes in roughly a couple of minutes
 * on a 3090. No polling, no job table. Bench-side wrap at
 * `D:/The_Hangar/engines/splat360/src/splat360/api/trellis.py`; server
 * seam at `lib/capabilities/viz/text-to-3d.server.ts`.
 *
 * When the bench is offline OR the trellis venv python is missing,
 * the bench short-circuits to a placeholder GLB header (fake mode)
 * so the chamber + route round-trip can be exercised without the
 * model installed. The chamber treats that as a successful generation
 * — `<model-viewer>` will render an empty scene, which is the honest
 * thing to do.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { createLogger } from "lib/log";
import { pushAtelierOutput, useActiveChamber } from "lib/state/atelier-hooks";
import type { TextTo3DResult } from "lib/capabilities/viz/text-to-3d";

const log = createLogger("atelier:trellis");

type OutputState =
  | { kind: "idle" }
  | { kind: "running"; startedAt: number }
  | {
      kind: "ready";
      result: TextTo3DResult;
      filename: string;
      durationMs: number;
    }
  | { kind: "error"; message: string };

export default function TrellisClient() {
  const [prompt, setPrompt] = useState("");
  const [seed, setSeed] = useState<string>("1");
  const [refFile, setRefFile] = useState<File | null>(null);
  const [refPreviewUrl, setRefPreviewUrl] = useState<string | null>(null);
  const [output, setOutput] = useState<OutputState>({ kind: "idle" });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const modelViewerLoadedRef = useRef(false);

  useActiveChamber("trellis");

  useEffect(() => {
    if (modelViewerLoadedRef.current) return;
    modelViewerLoadedRef.current = true;
    import("@google/model-viewer").catch((err) => {
      log.warn("model-viewer load failed", { err });
    });
  }, []);

  // ---- reference image handling ---------------------------------------

  const loadRef = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        setOutput({
          kind: "error",
          message: "That doesn't look like an image.",
        });
        return;
      }
      if (refPreviewUrl) URL.revokeObjectURL(refPreviewUrl);
      const url = URL.createObjectURL(file);
      setRefPreviewUrl(url);
      setRefFile(file);
    },
    [refPreviewUrl],
  );

  useEffect(() => {
    return () => {
      if (refPreviewUrl) URL.revokeObjectURL(refPreviewUrl);
    };
  }, [refPreviewUrl]);

  const clearRef = useCallback(() => {
    if (refPreviewUrl) URL.revokeObjectURL(refPreviewUrl);
    setRefPreviewUrl(null);
    setRefFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [refPreviewUrl]);

  // ---- generate -------------------------------------------------------

  const onGenerate = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      setOutput({
        kind: "error",
        message: "Type a prompt first.",
      });
      return;
    }
    const seedNum = Number(seed);
    const startedAt = Date.now();
    setOutput({ kind: "running", startedAt });
    try {
      const fd = new FormData();
      fd.append("prompt", trimmed);
      if (Number.isFinite(seedNum)) fd.append("seed", String(seedNum));
      if (refFile) fd.append("image", refFile, refFile.name);

      const res = await fetch("/api/viz/text-to-3d", {
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
      const body = (await res.json()) as { result: TextTo3DResult };
      const result = body.result;
      const slug =
        trimmed
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 40) || "mesh";
      const filename = `${slug}_trellis.glb`;
      setOutput({
        kind: "ready",
        result,
        filename,
        durationMs: Date.now() - startedAt,
      });
      pushAtelierOutput({
        chamberSlug: "trellis",
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
  }, [prompt, refFile, seed]);

  const onDownload = useCallback(() => {
    if (output.kind !== "ready") return;
    const a = document.createElement("a");
    a.href = output.result.glbUrl;
    a.download = output.filename;
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
  }, [output]);

  // ---- reference drop zone --------------------------------------------

  const dropClasses = `flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-sm border border-dashed px-6 py-8 text-center transition-colors ${
    isDragOver
      ? "border-pink-200 bg-warm-black-900/60"
      : "border-warm-black-700 bg-warm-black-950"
  }`;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="chrome-label text-chrome-400">Prompt</span>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A chair that looks like an avocado."
            rows={3}
            aria-label="Describe the 3D object you want generated"
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 font-mono text-sm text-chrome-100 placeholder:text-chrome-600 focus:border-pink-200 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5 self-start">
          <span className="chrome-label text-chrome-400">Seed</span>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            step={1}
            aria-label="RNG seed for reproducible generation"
            className="w-32 rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-1.5 font-mono text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
          />
        </label>
      </section>

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
          if (file) loadRef(file);
        }}
        className={dropClasses}
      >
        {refPreviewUrl ? (
          <div className="flex flex-col items-center gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={refPreviewUrl}
              alt="Reference"
              className="max-h-48 rounded-sm border border-warm-black-800"
            />
            <span className="chrome-label text-chrome-500">
              Reference image (optional)
            </span>
          </div>
        ) : null}
        <span className="chrome-label text-chrome-400">
          Reference image (optional)
        </span>
        <p className="text-sm leading-relaxed text-chrome-300">
          Drag an image here to steer the look, or
        </p>
        <div className="flex flex-row gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
          >
            Upload image
          </button>
          {refFile ? (
            <button
              type="button"
              onClick={clearRef}
              className="rounded-sm border border-warm-black-700 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-chrome-400 transition-colors hover:border-chrome-500"
            >
              Clear
            </button>
          ) : null}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          aria-label="Upload a reference image to steer the 3D generation"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) loadRef(file);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
      </section>

      <section className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onGenerate}
          disabled={output.kind === "running" || prompt.trim().length === 0}
          className="self-start rounded-sm border border-pink-200/60 bg-pink-900/40 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
        >
          {output.kind === "running" ? "Generating 3D…" : "Generate 3D"}
        </button>

        {output.kind === "running" ? (
          <p className="text-xs text-chrome-400">
            Bench inference. TRELLIS runs roughly a couple of minutes
            on a 3090; cold GPU starts add a bit more. Sync round-trip,
            no polling.
          </p>
        ) : null}

        {output.kind === "ready" ? (
          <div className="flex flex-col gap-3 rounded-sm border border-emerald-400/30 bg-emerald-900/10 px-4 py-3">
            <span className="font-mono text-xs text-emerald-200">
              Mesh ready &middot;{" "}
              {(output.result.glbBytes / 1024).toFixed(0)} KB &middot;{" "}
              {(output.durationMs / 1000).toFixed(1)}s
            </span>
            {/* model-viewer is a registered web custom element */}
            {/* @ts-ignore — model-viewer is a web component */}
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
    </div>
  );
}
