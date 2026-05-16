"use client";

/**
 * app/atelier/image-to-mesh/image-to-mesh-client.tsx — Image → 3D mesh chamber UI.
 *
 * Drop an image, pick a provider (TripoSR / HY-WU / Unique3D /
 * InstantMesh), get a GLB back. The chamber UI is here today; the
 * matching bench-side wrapper is the next push, so the "Generate"
 * button currently surfaces the provider-unavailable bench contract
 * to the visitor rather than a finished mesh. When the bench wakes
 * up, only the server stub at lib/capabilities/viz/image-to-mesh.server.ts
 * changes — this client doesn't.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { createLogger } from "lib/log";
import { pushAtelierOutput, useActiveChamber } from "lib/state/atelier-hooks";
import type { ImageToMeshProvider } from "lib/capabilities/viz/image-to-mesh";

const log = createLogger("atelier:image-to-mesh");

type Provider = {
  id: ImageToMeshProvider;
  label: string;
  speed: string;
  quality: string;
  input: "single" | "multi";
  licence: "MIT" | "Apache-2.0" | "research-only";
  notes: string;
};

const PROVIDERS: ReadonlyArray<Provider> = [
  {
    id: "triposr",
    label: "TripoSR",
    speed: "~0.5s",
    quality: "Rough draft",
    input: "single",
    licence: "MIT",
    notes:
      "Single-stage LRM feed-forward. Smallest checkpoint, fastest. Good for ideating.",
  },
  {
    id: "hy-wu",
    label: "HY-WU",
    speed: "~5s",
    quality: "Mid",
    input: "single",
    licence: "research-only",
    notes:
      "Hunyuan3D wrapper. Licence-restricted until the bound Hunyuan version is confirmed permissive.",
  },
  {
    id: "unique3d",
    label: "Unique3D",
    speed: "~30s",
    quality: "High",
    input: "single",
    licence: "MIT",
    notes:
      "Multi-view diffusion + normal estimation + reconstruction. Best quality for single-image input.",
  },
  {
    id: "instantmesh",
    label: "InstantMesh",
    speed: "~10s",
    quality: "Best with multi-view",
    input: "multi",
    licence: "Apache-2.0",
    notes:
      "Takes two or more views of the subject. zero123plus + LRM transformer.",
  },
];

type OutputState =
  | { kind: "idle" }
  | { kind: "running"; startedAt: number }
  | {
      kind: "ready";
      meshUrl: string;
      filename: string;
      durationMs: number;
    }
  | { kind: "pending-bench"; contract: string }
  | { kind: "error"; message: string };

export default function ImageToMeshClient() {
  useActiveChamber("image-to-mesh");

  const [provider, setProvider] = useState<ImageToMeshProvider>("triposr");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [output, setOutput] = useState<OutputState>({ kind: "idle" });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selected = PROVIDERS.find((p) => p.id === provider)!;

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
    if (selected.input === "multi" && extraFiles.length === 0) {
      setOutput({
        kind: "error",
        message:
          "InstantMesh needs at least two views of the subject. Add more images.",
      });
      return;
    }
    const startedAt = Date.now();
    setOutput({ kind: "running", startedAt });
    try {
      const fd = new FormData();
      fd.append("provider", provider);
      fd.append("image", sourceFile, sourceFile.name);
      for (const extra of extraFiles) fd.append("images", extra, extra.name);

      const res = await fetch("/api/ai/image-to-mesh", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 503 && body.code === "provider-unavailable") {
          setOutput({
            kind: "pending-bench",
            contract: String(body.error ?? ""),
          });
          log.warn("provider unavailable", { provider });
          return;
        }
        throw new Error(
          typeof body.error === "string" ? body.error : `HTTP ${res.status}`,
        );
      }
      const data = (await res.json()) as {
        record: {
          meshUrl: string;
          meshBytes: number;
          format: string;
        };
      };
      const filename = `${sourceFile.name.replace(/\.[^.]+$/, "")}_${provider}.glb`;
      setOutput({
        kind: "ready",
        meshUrl: data.record.meshUrl,
        filename,
        durationMs: Date.now() - startedAt,
      });
      pushAtelierOutput({
        chamberSlug: "image-to-mesh",
        kind: "glb",
        label: filename,
        blobUrl: data.record.meshUrl,
        mimeType: "model/gltf-binary",
        sizeBytes: data.record.meshBytes,
      });
    } catch (err) {
      log.error("generation failed", { err });
      setOutput({
        kind: "error",
        message: err instanceof Error ? err.message : "Generation failed.",
      });
    }
  }, [extraFiles, provider, selected.input, sourceFile]);

  const onDownload = useCallback(() => {
    if (output.kind !== "ready") return;
    const a = document.createElement("a");
    a.href = output.meshUrl;
    a.download = output.filename;
    a.click();
  }, [output]);

  return (
    <div className="flex flex-col gap-8">
      {/* PROVIDER PICKER ------------------------------------------ */}
      <section className="flex flex-col gap-3">
        <span className="chrome-label text-chrome-400">Provider</span>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setProvider(p.id)}
              className={`flex flex-col items-start gap-1.5 rounded-sm border p-3 text-left transition-colors ${
                provider === p.id
                  ? "border-pink-200 bg-pink-200/5"
                  : "border-warm-black-700 bg-warm-black-900/40 hover:border-pink-200/40"
              }`}
            >
              <span className="text-sm text-chrome-100">{p.label}</span>
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-500">
                {p.speed} &middot; {p.quality} &middot; {p.input === "multi" ? "multi-view" : "single"}
              </span>
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-600">
                {p.licence}
              </span>
              <span className="mt-1 text-xs text-chrome-300">{p.notes}</span>
            </button>
          ))}
        </div>
      </section>

      {/* DROP ZONE ------------------------------------------------ */}
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
        className={`flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-sm border border-dashed px-6 py-10 text-center transition-colors ${
          isDragOver
            ? "border-pink-200 bg-warm-black-900/60"
            : "border-warm-black-700 bg-warm-black-950"
        }`}
      >
        {sourcePreviewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sourcePreviewUrl}
            alt="Source"
            className="max-h-64 rounded-sm border border-warm-black-800"
          />
        ) : null}
        <span className="chrome-label text-chrome-400">
          {selected.input === "multi" ? "Primary view" : "Source image"}
        </span>
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
          aria-label="Choose an image to reconstruct as a 3D mesh"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) loadFile(file);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
      </section>

      {/* MULTI-VIEW EXTRAS --------------------------------------- */}
      {selected.input === "multi" && sourceFile ? (
        <section className="flex flex-col gap-3">
          <span className="chrome-label text-chrome-400">
            Additional views &middot; {extraFiles.length} added
          </span>
          <p className="text-xs text-chrome-400">
            InstantMesh wants two or more views of the same subject. Add
            angles &mdash; front, three-quarter, side.
          </p>
          <input
            type="file"
            accept="image/*"
            multiple
            aria-label="Add additional views of the subject"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              setExtraFiles(files);
            }}
            className="font-mono text-xs text-chrome-300"
          />
        </section>
      ) : null}

      {/* GENERATE ------------------------------------------------- */}
      {sourceFile ? (
        <section className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onGenerate}
            disabled={output.kind === "running"}
            className="self-start rounded-sm border border-pink-200/60 bg-pink-900/40 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
          >
            {output.kind === "running"
              ? `Generating via ${selected.label}…`
              : `→ Generate via ${selected.label}`}
          </button>

          {output.kind === "running" ? (
            <p className="text-xs text-chrome-400">
              Bench inference. Expected {selected.speed}.
            </p>
          ) : null}

          {output.kind === "ready" ? (
            <div className="flex flex-col gap-3 rounded-sm border border-emerald-400/30 bg-emerald-900/10 px-4 py-3">
              <span className="font-mono text-xs text-emerald-200">
                Mesh ready &middot; {(output.durationMs / 1000).toFixed(1)}s
              </span>
              <model-viewer
                src={output.meshUrl}
                alt="Generated mesh"
                camera-controls
                auto-rotate
                style={{
                  width: "100%",
                  height: "400px",
                  backgroundColor: "#0d0d12",
                }}
              />
              <button
                type="button"
                onClick={onDownload}
                className="self-start rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
              >
                Download {output.filename}
              </button>
            </div>
          ) : null}

          {output.kind === "pending-bench" ? (
            <div className="rounded-sm border border-pink-400/30 bg-pink-900/10 px-4 py-3">
              <span className="chrome-label text-pink-200">
                Bench wrapper pending
              </span>
              <p className="mt-2 text-xs text-chrome-300">
                The chamber UI is wired but the bench-side HTTP wrapper
                for{" "}
                <code className="font-mono text-chrome-100">{selected.label}</code>{" "}
                isn&rsquo;t deployed yet. Contract the bench needs to
                satisfy:
              </p>
              <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-sm bg-warm-black-950 p-3 font-mono text-[0.65rem] text-chrome-400">
                {output.contract}
              </pre>
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
