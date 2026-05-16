"use client";

/**
 * app/atelier/imagen/imagen-client.tsx — Imagen 4 chamber UI.
 *
 * Prompt + (optional) negative prompt + aspect ratio + count →
 * POST to `/api/ai/google/generate-image`. Results render as
 * a grid of <img> tags with download buttons; each generated image
 * is also pushed to the atelier slice's recent-outputs ring so it
 * can be picked up in a sibling chamber.
 *
 * The visitor's BYO API key (if any) is forwarded in
 * `X-Visitor-Google-Key`. The studio's server never persists the
 * key value, and this client never logs it.
 */

import { useCallback, useId, useState } from "react";

import GoogleAiSettings from "components/atelier/google-ai-settings";
import { createLogger } from "lib/log";
import { useActiveChamber, pushAtelierOutput } from "lib/state/atelier-hooks";
import {
  useGoogleAiKeyStore,
  activeVisitorKey,
} from "lib/state/google-ai-key";

const log = createLogger("atelier:imagen");

type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
type NumImages = 1 | 2 | 3 | 4;

type GeneratedImage = { mimeType: string; dataUrl: string };

type OutputState =
  | { kind: "idle" }
  | { kind: "running"; startedAt: number }
  | {
      kind: "ready";
      images: GeneratedImage[];
      durationMs: number;
      promptUsed: string;
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

export default function ImagenClient() {
  useActiveChamber("imagen");

  const [prompt, setPrompt] = useState<string>("");
  const [negativePrompt, setNegativePrompt] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [numImages, setNumImages] = useState<NumImages>(1);
  const [output, setOutput] = useState<OutputState>({ kind: "idle" });
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  // Reading reactively so the badge updates when the visitor toggles
  // settings; sending the key uses `activeVisitorKey(state)` on
  // submit so it's always the latest value.
  const mode = useGoogleAiKeyStore((s) => s.mode);
  const hasKey = useGoogleAiKeyStore((s) => s.key.trim().length > 0);

  const promptFieldId = useId();
  const negativeFieldId = useId();

  const onGenerate = useCallback(async () => {
    const trimmed = prompt.trim();
    if (trimmed.length === 0) {
      setOutput({ kind: "error", message: "Write a prompt first." });
      return;
    }
    const startedAt = Date.now();
    setOutput({ kind: "running", startedAt });

    const visitorKey = activeVisitorKey(useGoogleAiKeyStore.getState());
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (visitorKey) headers["X-Visitor-Google-Key"] = visitorKey;

    const body: Record<string, unknown> = {
      prompt: trimmed,
      aspectRatio,
      numImages,
    };
    const trimmedNeg = negativePrompt.trim();
    if (trimmedNeg.length > 0) body.negativePrompt = trimmedNeg;

    try {
      const res = await fetch("/api/ai/google/generate-image", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
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
          // server didn't reply with JSON; fall through with raw text
          if (text.length > 0 && text.length < 300) message = text;
        }
        const next: OutputState = { kind: "error", message };
        if (code !== undefined) next.code = code;
        if (retryAfterSec !== undefined) next.retryAfterSec = retryAfterSec;
        setOutput(next);
        return;
      }
      const json = (await res.json()) as { images?: GeneratedImage[] };
      const images = Array.isArray(json.images) ? json.images : [];
      if (images.length === 0) {
        setOutput({
          kind: "error",
          message: "Imagen returned no images. Try a different prompt.",
        });
        return;
      }
      const durationMs = Date.now() - startedAt;
      setOutput({ kind: "ready", images, durationMs, promptUsed: trimmed });

      // Push each into the atelier slice so the recent-outputs drawer
      // picks them up and a sibling chamber can grab them.
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      images.forEach((img, i) => {
        const blob = dataUrlToBlob(img.dataUrl);
        const blobUrl = URL.createObjectURL(blob);
        pushAtelierOutput({
          chamberSlug: "imagen",
          kind: "image",
          label: `imagen-${stamp}-${i + 1}.png`,
          blobUrl,
          mimeType: img.mimeType,
          sizeBytes: blob.size,
        });
      });
    } catch (err) {
      log.error("generate failed", { err });
      setOutput({
        kind: "error",
        message:
          err instanceof Error ? err.message : "Generation failed.",
      });
    }
  }, [prompt, negativePrompt, aspectRatio, numImages]);

  const onDownload = useCallback((dataUrl: string, i: number) => {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadFromDataUrl(dataUrl, `imagen-${stamp}-${i + 1}.png`);
  }, []);

  return (
    <div className="flex flex-col gap-8">
      {/* Header row: quota mode badge + settings gear */}
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

      {/* Prompt + controls */}
      <section className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5" htmlFor={promptFieldId}>
          <span className="chrome-label text-chrome-400">Prompt</span>
          <textarea
            id={promptFieldId}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A pewter cuttlefish ring under museum lighting, macro lens, shallow depth of field, studio still life."
            rows={4}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
          />
        </label>

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="self-start font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400 hover:text-pink-200"
        >
          {showAdvanced ? "Hide" : "Show"} advanced &middot; negative prompt
        </button>

        {showAdvanced ? (
          <label className="flex flex-col gap-1.5" htmlFor={negativeFieldId}>
            <span className="chrome-label text-chrome-400">
              Negative prompt (what to avoid)
            </span>
            <textarea
              id={negativeFieldId}
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="text, watermark, low quality, blurry, distorted hands"
              rows={2}
              className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
            />
          </label>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="chrome-label text-chrome-400">Aspect ratio</span>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
              className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
            >
              <option value="1:1">1:1 &middot; square</option>
              <option value="16:9">16:9 &middot; landscape</option>
              <option value="9:16">9:16 &middot; portrait</option>
              <option value="4:3">4:3 &middot; classic</option>
              <option value="3:4">3:4 &middot; book</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="chrome-label text-chrome-400">Images</span>
            <select
              value={numImages}
              onChange={(e) =>
                setNumImages(Number(e.target.value) as NumImages)
              }
              className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={output.kind === "running"}
          className="self-start rounded-sm border border-pink-200/60 bg-pink-900/40 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
        >
          {output.kind === "running" ? "Generating…" : "→ Generate"}
        </button>

        {output.kind === "running" ? (
          <p className="text-xs text-chrome-400">
            Imagen typically returns in 8&ndash;20 seconds. Larger
            counts and bigger aspect ratios take longer.
          </p>
        ) : null}
      </section>

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
              . Or open settings and paste your own AI Studio key for
              unbounded use.
            </p>
          ) : null}
        </section>
      ) : null}

      {/* Results grid */}
      {output.kind === "ready" ? (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="chrome-label text-chrome-400">
              Ready &middot; {output.images.length} image
              {output.images.length === 1 ? "" : "s"} &middot;{" "}
              {(output.durationMs / 1000).toFixed(1)}s
            </span>
          </div>
          <div
            className={`grid gap-4 ${
              output.images.length === 1
                ? "grid-cols-1"
                : "grid-cols-1 sm:grid-cols-2"
            }`}
          >
            {output.images.map((img, i) => (
              <figure
                key={`${img.mimeType}-${i}`}
                className="flex flex-col gap-2 rounded-sm border border-warm-black-700 bg-warm-black-950 p-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.dataUrl}
                  alt={`Imagen result ${i + 1}`}
                  className="w-full rounded-sm"
                />
                <figcaption className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-500">
                    {img.mimeType}
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
          <p className="text-xs text-chrome-500">
            Each result is also dropped into the recent-outputs
            drawer at the bottom-right of the page; you can pick
            them up from a sibling chamber if it accepts an
            image input.
          </p>
        </section>
      ) : null}

      <GoogleAiSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
