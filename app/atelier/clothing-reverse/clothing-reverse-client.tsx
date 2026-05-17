"use client";

/**
 * app/atelier/clothing-reverse/clothing-reverse-client.tsx
 *
 * Drop a clothing photo → POST multipart to
 * `/api/clothing-reverse/analyze` → render the garment spec inline:
 * type + style, measurements, materials, pattern pieces (as small SVG
 * thumbnails), and a constructed sewing sequence derived from the
 * analysis. Visitor's BYO key (if any) goes in
 * `X-Visitor-Google-Key`. JSON export is offered + dropped to the
 * recent-outputs drawer.
 *
 * Orchestrator only. Types in clothing-reverse/types.ts; pure
 * helpers (buildInstructions, formatForExport, downloadJson) in
 * build-instructions.ts; the stacked result panel in
 * analysis-result.tsx. Per ARCHITECTURE.md Rule 1.
 *
 * Ported from `D:/The_Hangar/apps/clothing-reverse-engineer/src/App.tsx`
 * (Vite + tabs + inline `<style>`). The original split the result into
 * four tabs (Analysis / Pattern / Instructions / Export). Holoflow's
 * editorial register reads better as one stacked page, so the tabs are
 * collapsed into sections. The instruction builder is identical to the
 * original `generateInstructions()` in `services/garmentAI.ts`.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";

import GoogleAiSettings from "components/atelier/google-ai-settings";
import { createLogger } from "lib/log";
import { pushAtelierOutput, useActiveChamber } from "lib/state/atelier-hooks";
import {
  activeVisitorKey,
  useGoogleAiKeyStore,
} from "lib/state/google-ai-key";

import { AnalysisResult } from "./clothing-reverse/analysis-result";
import {
  buildInstructions,
  downloadJson,
  formatForExport,
} from "./clothing-reverse/build-instructions";
import type { GarmentAnalysis, OutputState } from "./clothing-reverse/types";

const log = createLogger("atelier:clothing-reverse");

export default function ClothingReverseClient() {
  useActiveChamber("clothing-reverse");

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);
  const [output, setOutput] = useState<OutputState>({ kind: "idle" });
  const [isDragOver, setIsDragOver] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropZoneLabelId = useId();

  const mode = useGoogleAiKeyStore((s) => s.mode);
  const hasKey = useGoogleAiKeyStore((s) => s.key.trim().length > 0);

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
      setOutput({ kind: "idle" });
    },
    [sourcePreviewUrl],
  );

  useEffect(() => {
    return () => {
      if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
    };
  }, [sourcePreviewUrl]);

  const onAnalyse = useCallback(async () => {
    if (!sourceFile) {
      setOutput({ kind: "error", message: "Drop a clothing photo first." });
      return;
    }
    const startedAt = Date.now();
    setOutput({ kind: "running", startedAt });

    const visitorKey = activeVisitorKey(useGoogleAiKeyStore.getState());
    const headers: Record<string, string> = {};
    if (visitorKey) headers["X-Visitor-Google-Key"] = visitorKey;

    const fd = new FormData();
    fd.append("image", sourceFile, sourceFile.name);

    try {
      const res = await fetch("/api/clothing-reverse/analyze", {
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
      const json = (await res.json()) as { analysis?: GarmentAnalysis };
      if (!json.analysis) {
        setOutput({
          kind: "error",
          message: "The analyse route returned no analysis.",
        });
        return;
      }
      const instructions = buildInstructions(json.analysis);
      setOutput({
        kind: "ready",
        analysis: json.analysis,
        instructions,
        durationMs: Date.now() - startedAt,
      });
    } catch (err) {
      log.error("analyse failed", { err });
      setOutput({
        kind: "error",
        message: err instanceof Error ? err.message : "Analysis failed.",
      });
    }
  }, [sourceFile]);

  const onExportJson = useCallback(() => {
    if (output.kind !== "ready" || !sourceFile) return;
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const base = sourceFile.name.replace(/\.[^.]+$/, "");
    const filename = `${base}_pattern_${stamp}.json`;
    const payload = formatForExport(output.analysis, output.instructions);
    const blob = downloadJson(filename, payload);
    const blobUrl = URL.createObjectURL(blob);
    pushAtelierOutput({
      chamberSlug: "clothing-reverse",
      kind: "json",
      label: filename,
      blobUrl,
      mimeType: "application/json",
      sizeBytes: blob.size,
    });
  }, [output, sourceFile]);

  const dropClasses = `flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-sm border border-dashed px-6 py-10 text-center transition-colors ${
    isDragOver
      ? "border-pink-200 bg-warm-black-900/60"
      : "border-warm-black-700 bg-warm-black-950"
  }`;

  return (
    <div className="flex flex-col gap-8">
      {/* Header row — quota + settings */}
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
          Settings
        </button>
      </section>

      {/* Drop zone */}
      <section
        aria-labelledby={dropZoneLabelId}
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
            alt="Clothing source"
            className="max-h-64 rounded-sm border border-warm-black-800"
          />
        ) : null}
        <span id={dropZoneLabelId} className="chrome-label text-chrome-400">
          Upload
        </span>
        <p className="text-sm leading-relaxed text-chrome-300">
          drag a clothing photo here, or
        </p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
        >
          Choose a photo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          aria-label="Choose a clothing photo"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) loadFile(file);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
      </section>

      {/* Analyse button */}
      {sourceFile ? (
        <section className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onAnalyse}
            disabled={output.kind === "running"}
            className="self-start rounded-sm border border-pink-200/60 bg-pink-900/40 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
          >
            {output.kind === "running"
              ? "Detecting garment…"
              : "→ Detect garment"}
          </button>

          {output.kind === "running" ? (
            <p className="text-xs text-chrome-400">
              gemini typically returns in 6&ndash;15 seconds. larger photos
              take longer to upload.
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
              cap resets in roughly{" "}
              {output.retryAfterSec
                ? `${Math.ceil(output.retryAfterSec / 60)} min`
                : "an hour"}
              . or open settings and paste your own AI Studio key.
            </p>
          ) : null}
        </section>
      ) : null}

      {/* Result */}
      {output.kind === "ready" ? (
        <AnalysisResult
          analysis={output.analysis}
          instructions={output.instructions}
          durationMs={output.durationMs}
          onExportJson={onExportJson}
        />
      ) : null}

      <GoogleAiSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
