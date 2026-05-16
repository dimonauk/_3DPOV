"use client";

/**
 * app/atelier/image-edit/image-edit-client.tsx — Gemini 2.5 Flash
 * Image multimodal edit chamber.
 *
 * Drop an image + a sentence, POST multipart to
 * `/api/ai/google/edit-image`, render the result next to the
 * source. The source preview uses a local object URL; the result
 * is a base64 data URL the server returned. The visitor's BYO key
 * (if any) goes in the `X-Visitor-Google-Key` header.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";

import GoogleAiSettings from "components/atelier/google-ai-settings";
import { createLogger } from "lib/log";
import { useActiveChamber, pushAtelierOutput } from "lib/state/atelier-hooks";
import {
  useGoogleAiKeyStore,
  activeVisitorKey,
} from "lib/state/google-ai-key";

const log = createLogger("atelier:image-edit");

type EditedImage = { mimeType: string; dataUrl: string };

type OutputState =
  | { kind: "idle" }
  | { kind: "running"; startedAt: number }
  | {
      kind: "ready";
      images: EditedImage[];
      explanation: string | null;
      durationMs: number;
    }
  | {
      kind: "error";
      message: string;
      code?: string;
      retryAfterSec?: number;
    };

function dataUrlToBlob(dataUrl: string): Blob {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return new Blob([], { type: "application/octet-stream" });
  const mime = m[1] ?? "application/octet-stream";
  const b64 = m[2] ?? "";
  const bin = atob(b64);
  const len = bin.length;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) out[i] = bin.charCodeAt(i);
  return new Blob([out], { type: mime });
}

function downloadFromDataUrl(dataUrl: string, filename: string): void {
  const blob = dataUrlToBlob(dataUrl);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ImageEditClient() {
  useActiveChamber("image-edit");

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [output, setOutput] = useState<OutputState>({ kind: "idle" });
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const promptFieldId = useId();

  const mode = useGoogleAiKeyStore((s) => s.mode);
  const hasKey = useGoogleAiKeyStore((s) => s.key.trim().length > 0);

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

  const onEdit = useCallback(async () => {
    if (!sourceFile) {
      setOutput({ kind: "error", message: "Drop a source image first." });
      return;
    }
    const trimmed = prompt.trim();
    if (trimmed.length === 0) {
      setOutput({
        kind: "error",
        message: "Write a prompt for what to change.",
      });
      return;
    }
    const startedAt = Date.now();
    setOutput({ kind: "running", startedAt });

    const visitorKey = activeVisitorKey(useGoogleAiKeyStore.getState());
    const headers: Record<string, string> = {};
    if (visitorKey) headers["X-Visitor-Google-Key"] = visitorKey;

    const fd = new FormData();
    fd.append("image", sourceFile, sourceFile.name);
    fd.append("prompt", trimmed);

    try {
      const res = await fetch("/api/ai/google/edit-image", {
        method: "POST",
        headers,
        body: fd,
      });
      if (!res.ok) {
        const text = await res.text();
        let message = `HTTP ${res.status}`;
        let code: string | undefined;
        let retryAfterSec: number | undefined;
        try {
          const parsed = JSON.parse(text) as {
            error?: string;
            code?: string;
            retryAfterSec?: number;
          };
          if (parsed.error) message = parsed.error;
          if (parsed.code) code = parsed.code;
          if (typeof parsed.retryAfterSec === "number") {
            retryAfterSec = parsed.retryAfterSec;
          }
        } catch {
          if (text.length > 0 && text.length < 300) message = text;
        }
        const next: OutputState = { kind: "error", message };
        if (code !== undefined) next.code = code;
        if (retryAfterSec !== undefined) next.retryAfterSec = retryAfterSec;
        setOutput(next);
        return;
      }
      const json = (await res.json()) as {
        images?: EditedImage[];
        explanation?: string;
      };
      const images = Array.isArray(json.images) ? json.images : [];
      if (images.length === 0) {
        setOutput({
          kind: "error",
          message: "Gemini returned no images. Try a different prompt.",
        });
        return;
      }
      const explanation =
        typeof json.explanation === "string" && json.explanation.length > 0
          ? json.explanation
          : null;
      const durationMs = Date.now() - startedAt;
      setOutput({ kind: "ready", images, explanation, durationMs });

      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const base = sourceFile.name.replace(/\.[^.]+$/, "");
      images.forEach((img, i) => {
        const blob = dataUrlToBlob(img.dataUrl);
        const blobUrl = URL.createObjectURL(blob);
        pushAtelierOutput({
          chamberSlug: "image-edit",
          kind: "image",
          label: `${base}_edit-${stamp}-${i + 1}.png`,
          blobUrl,
          mimeType: img.mimeType,
          sizeBytes: blob.size,
        });
      });
    } catch (err) {
      log.error("edit failed", { err });
      setOutput({
        kind: "error",
        message: err instanceof Error ? err.message : "Edit failed.",
      });
    }
  }, [prompt, sourceFile]);

  const onDownload = useCallback(
    (dataUrl: string, i: number) => {
      if (!sourceFile) return;
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const base = sourceFile.name.replace(/\.[^.]+$/, "");
      downloadFromDataUrl(dataUrl, `${base}_edit-${stamp}-${i + 1}.png`);
    },
    [sourceFile],
  );

  const dropClasses = `flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-sm border border-dashed px-6 py-10 text-center transition-colors ${
    isDragOver
      ? "border-pink-200 bg-warm-black-900/60"
      : "border-warm-black-700 bg-warm-black-950"
  }`;

  return (
    <div className="flex flex-col gap-8">
      {/* Header row */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-3 py-2">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400">
          Quota:{" "}
          <span className="text-chrome-100">
            {mode === "byo" && hasKey ? "your AI Studio key" : "studio (5/hr)"}
          </span>
        </span>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="rounded-sm border border-warm-black-700 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-300 transition-colors hover:border-pink-200/60 hover:text-pink-200"
          aria-label="Open Google AI quota settings"
        >
          ⚙ Settings
        </button>
      </section>

      {/* Drop zone */}
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
        <span className="chrome-label text-chrome-400">Source image</span>
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
          aria-label="Choose a source image to edit"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) loadFile(file);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
      </section>

      {/* Prompt */}
      {sourceFile ? (
        <section className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5" htmlFor={promptFieldId}>
            <span className="chrome-label text-chrome-400">
              What should I change?
            </span>
            <textarea
              id={promptFieldId}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Make the sky pink. Add a small moon. Keep everything else the same."
              rows={3}
              className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
            />
          </label>

          <button
            type="button"
            onClick={onEdit}
            disabled={output.kind === "running"}
            className="self-start rounded-sm border border-pink-200/60 bg-pink-900/40 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
          >
            {output.kind === "running" ? "Editing…" : "→ Edit"}
          </button>

          {output.kind === "running" ? (
            <p className="text-xs text-chrome-400">
              Gemini typically returns in 5&ndash;15 seconds for a
              single edit. Large source images take longer to upload.
            </p>
          ) : null}
        </section>
      ) : null}

      {/* Errors */}
      {output.kind === "error" ? (
        <section className="rounded-sm border border-pink-400/40 bg-pink-900/10 px-4 py-3 text-sm text-pink-100">
          <p>{output.message}</p>
          {output.code === "no_key" ? (
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="mt-3 rounded-sm border border-pink-200/60 bg-pink-200/10 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-pink-200 hover:bg-pink-200/20"
            >
              Open settings
            </button>
          ) : null}
          {output.code === "studio_capped" ? (
            <p className="mt-2 text-xs text-pink-200/80">
              Cap resets in roughly{" "}
              {output.retryAfterSec
                ? `${Math.ceil(output.retryAfterSec / 60)} min`
                : "an hour"}
              . Or open settings and paste your own AI Studio key.
            </p>
          ) : null}
        </section>
      ) : null}

      {/* Result */}
      {output.kind === "ready" ? (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="chrome-label text-chrome-400">
              Ready &middot; {output.images.length} edit
              {output.images.length === 1 ? "" : "s"} &middot;{" "}
              {(output.durationMs / 1000).toFixed(1)}s
            </span>
          </div>

          {output.explanation ? (
            <p className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-3 py-2 text-xs text-chrome-300">
              <span className="chrome-label text-chrome-500">Model said:</span>{" "}
              {output.explanation}
            </p>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {sourcePreviewUrl ? (
              <figure className="flex flex-col gap-2 rounded-sm border border-warm-black-800 bg-warm-black-950 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sourcePreviewUrl}
                  alt="Source"
                  className="w-full rounded-sm"
                />
                <figcaption className="px-1 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-500">
                  Source
                </figcaption>
              </figure>
            ) : null}

            {output.images.map((img, i) => (
              <figure
                key={`${img.mimeType}-${i}`}
                className="flex flex-col gap-2 rounded-sm border border-pink-200/30 bg-warm-black-950 p-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.dataUrl}
                  alt={`Edit result ${i + 1}`}
                  className="w-full rounded-sm"
                />
                <figcaption className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-500">
                    Edit {i + 1} &middot; {img.mimeType}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDownload(img.dataUrl, i)}
                    className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-pink-200 hover:bg-pink-200/20"
                  >
                    Download
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <GoogleAiSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
