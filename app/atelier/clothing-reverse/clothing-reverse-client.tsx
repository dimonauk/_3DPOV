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

const log = createLogger("atelier:clothing-reverse");

// -------------------- Types (mirror the API route) --------------------

type GarmentMeasurement = {
  name: string;
  value: number;
  unit: "cm" | "inches";
  confidence: number;
};

type PatternPiece = {
  name: string;
  shape: "rectangle" | "trapezoid" | "curve" | "complex";
  estimatedWidth: number;
  estimatedHeight: number;
  cutCount: number;
  grainline: "lengthwise" | "crosswise" | "bias";
};

type Material = {
  type: string;
  amount: number;
  unit: "m" | "yd";
  notes: string;
};

type GarmentAnalysis = {
  garment: {
    type: string;
    style: string;
    description: string;
    features: string[];
    era: string;
    occasion: string[];
  };
  measurements: GarmentMeasurement[];
  construction: {
    seams: string[];
    closures: string[];
    details: string[];
    difficulty: "beginner" | "intermediate" | "advanced";
  };
  materials: Material[];
  pattern: { pieces: PatternPiece[] };
  colors: { hex: string; name: string; percentage: number }[];
  metadata: { confidence: number; processingTime: number; modelVersion: string };
};

type ConstructionStep = {
  step: number;
  title: string;
  description: string;
  techniques: string[];
  estimatedTime: number;
  difficulty: "easy" | "medium" | "hard";
};

type OutputState =
  | { kind: "idle" }
  | { kind: "running"; startedAt: number }
  | {
      kind: "ready";
      analysis: GarmentAnalysis;
      instructions: ConstructionStep[];
      durationMs: number;
    }
  | {
      kind: "error";
      message: string;
      code?: string;
      retryAfterSec?: number;
    };

// -------------------- Pure helpers --------------------

function buildInstructions(a: GarmentAnalysis): ConstructionStep[] {
  const steps: ConstructionStep[] = [
    {
      step: 1,
      title: "Prepare pattern and fabric",
      description: `Cut all ${a.pattern.pieces.length} pattern pieces from your fabric. Mark all notches and darts.`,
      techniques: ["Pattern cutting", "Fabric marking"],
      estimatedTime: 30,
      difficulty: "easy",
    },
    {
      step: 2,
      title: "Interface key pieces",
      description:
        "Apply fusible interfacing to neckline, armholes, and any areas that need structure.",
      techniques: ["Interfacing application"],
      estimatedTime: 15,
      difficulty: "easy",
    },
    {
      step: 3,
      title: "Sew darts and main seams",
      description: `Sew all darts first, then join the main seams: ${a.construction.seams.slice(0, 3).join(", ") || "shoulder, side"}.`,
      techniques: ["Dart sewing", "Seam finishing"],
      estimatedTime: 45,
      difficulty: "medium",
    },
    {
      step: 4,
      title: "Assemble the body",
      description:
        "Join the major sub-assemblies (bodice to skirt, sleeves to body, etc.) at their seam lines.",
      techniques: ["Seam matching"],
      estimatedTime: 20,
      difficulty: "medium",
    },
  ];

  if (a.construction.closures.length > 0) {
    steps.push({
      step: steps.length + 1,
      title: "Install closure",
      description: `Install the ${a.construction.closures[0]!.toLowerCase()}. Ensure proper alignment.`,
      techniques: ["Closure installation"],
      estimatedTime: 25,
      difficulty: "medium",
    });
  }

  steps.push({
    step: steps.length + 1,
    title: "Hem and finish",
    description:
      "Finish all raw edges with your preferred method. Hem the garment.",
    techniques: ["Hemming", "Edge finishing"],
    estimatedTime: 30,
    difficulty: "easy",
  });

  steps.push({
    step: steps.length + 1,
    title: "Final press",
    description:
      "Press all seams. Give the garment a final pressing. Inspect for missed stitches.",
    techniques: ["Pressing", "Quality control"],
    estimatedTime: 15,
    difficulty: "easy",
  });

  return steps;
}

function formatForExport(a: GarmentAnalysis, steps: ConstructionStep[]) {
  return {
    title: `${a.garment.style} ${a.garment.type} — pattern spec`,
    generatedAt: new Date().toISOString(),
    garment: a.garment,
    measurements: a.measurements,
    materials: a.materials,
    patternPieces: a.pattern.pieces,
    construction: a.construction,
    colors: a.colors,
    instructions: steps,
    metadata: a.metadata,
  };
}

function downloadJson(filename: string, payload: unknown): Blob {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return blob;
}

// -------------------- Component --------------------

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
        <span
          id={dropZoneLabelId}
          className="chrome-label text-chrome-400"
        >
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
            {output.kind === "running" ? "Detecting garment…" : "→ Detect garment"}
          </button>

          {output.kind === "running" ? (
            <p className="text-xs text-chrome-400">
              gemini typically returns in 6&ndash;15 seconds. larger
              photos take longer to upload.
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

// -------------------- Result sub-component --------------------

function AnalysisResult({
  analysis,
  instructions,
  durationMs,
  onExportJson,
}: {
  analysis: GarmentAnalysis;
  instructions: ConstructionStep[];
  durationMs: number;
  onExportJson: () => void;
}) {
  const { garment, measurements, materials, construction, pattern, colors, metadata } =
    analysis;
  const totalMinutes = instructions.reduce(
    (sum, s) => sum + s.estimatedTime,
    0,
  );

  const stitchGuide = {
    beginner: {
      stitchLength: "3.0",
      tension: "4–5",
      needleSize: "80/12",
      threadType: "Polyester",
    },
    intermediate: {
      stitchLength: "2.5",
      tension: "4",
      needleSize: "80/12",
      threadType: "Cotton / poly",
    },
    advanced: {
      stitchLength: "2.0",
      tension: "3–4",
      needleSize: "70/10",
      threadType: "Silk / cotton",
    },
  }[construction.difficulty];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-2xl text-chrome-100">Garment spec</h2>
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400">
          {(metadata.confidence * 100).toFixed(0)}% confidence &middot;{" "}
          {(durationMs / 1000).toFixed(1)}s &middot; {metadata.modelVersion}
        </span>
      </header>

      {/* Garment summary */}
      <section className="rounded-sm border border-warm-black-800 bg-warm-black-950 px-4 py-4">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="font-mono text-base uppercase tracking-[0.18em] text-chrome-100">
            {garment.type}
          </span>
          <span className="text-sm text-pink-200">{garment.style}</span>
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-500">
            {garment.era} &middot; {garment.occasion.join(" / ")}
          </span>
        </div>
        {garment.description ? (
          <p className="mt-2 text-sm text-chrome-300">{garment.description}</p>
        ) : null}
        {garment.features.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {garment.features.map((f, i) => (
              <li
                key={i}
                className="rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-300"
              >
                {f}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {/* Measurements */}
      {measurements.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="chrome-label text-chrome-400">Measurements (M)</h3>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
            {measurements.map((m, i) => (
              <div
                key={i}
                className="rounded-sm border border-warm-black-800 bg-warm-black-950 px-3 py-2"
              >
                <div className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-500">
                  {m.name}
                </div>
                <div className="text-lg text-chrome-100">
                  {m.value} {m.unit}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Materials */}
      {materials.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="chrome-label text-chrome-400">Materials</h3>
          <ul className="flex flex-col gap-1.5">
            {materials.map((m, i) => (
              <li
                key={i}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-sm border border-warm-black-800 bg-warm-black-950 px-3 py-2"
              >
                <span className="text-sm text-chrome-100">{m.type}</span>
                <span className="font-mono text-xs text-pink-200">
                  {m.amount} {m.unit}
                </span>
                {m.notes ? (
                  <span className="basis-full text-xs text-chrome-400">
                    {m.notes}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Pattern pieces */}
      {pattern.pieces.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="chrome-label text-chrome-400">Pattern pieces</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {pattern.pieces.map((p, i) => (
              <article
                key={i}
                className="flex flex-col gap-2 rounded-sm border border-warm-black-800 bg-warm-black-950 p-3"
              >
                <svg
                  viewBox={`0 0 ${p.estimatedWidth + 20} ${p.estimatedHeight + 20}`}
                  className="h-28 w-full"
                  preserveAspectRatio="xMidYMid meet"
                  aria-hidden="true"
                >
                  <rect
                    x="10"
                    y="10"
                    width={p.estimatedWidth}
                    height={p.estimatedHeight}
                    fill="none"
                    stroke="rgb(249 168 212)"
                    strokeWidth="1.5"
                  />
                  <line
                    x1={p.estimatedWidth / 2 + 10}
                    y1="15"
                    x2={p.estimatedWidth / 2 + 10}
                    y2={p.estimatedHeight + 5}
                    stroke="rgb(148 163 184)"
                    strokeWidth="0.8"
                    strokeDasharray="3 2"
                  />
                </svg>
                <div className="text-sm text-chrome-100">{p.name}</div>
                <div className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-500">
                  {p.estimatedWidth.toFixed(0)}×{p.estimatedHeight.toFixed(0)} cm
                  &middot; cut {p.cutCount}× &middot; {p.shape}
                </div>
                <div className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-pink-200/70">
                  grain {p.grainline}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* Construction details */}
      <section className="flex flex-col gap-2">
        <h3 className="chrome-label text-chrome-400">
          Construction &middot; {construction.difficulty}
        </h3>
        <div className="grid gap-3 rounded-sm border border-warm-black-800 bg-warm-black-950 p-3 md:grid-cols-3">
          <ConstructionList label="Seams" items={construction.seams} />
          <ConstructionList label="Closures" items={construction.closures} />
          <ConstructionList label="Details" items={construction.details} />
        </div>
      </section>

      {/* Stitch settings + sequence */}
      <section className="flex flex-col gap-3">
        <h3 className="chrome-label text-chrome-400">Stitch settings</h3>
        <div className="grid grid-cols-2 gap-2 rounded-sm border border-warm-black-800 bg-warm-black-950 p-3 md:grid-cols-4">
          <Stat label="Stitch" value={`${stitchGuide.stitchLength} mm`} />
          <Stat label="Tension" value={stitchGuide.tension} />
          <Stat label="Needle" value={stitchGuide.needleSize} />
          <Stat label="Thread" value={stitchGuide.threadType} />
        </div>

        <h3 className="chrome-label mt-4 text-chrome-400">
          Sequence &middot; ~{totalMinutes} min
        </h3>
        <ol className="flex flex-col gap-2">
          {instructions.map((s) => (
            <li
              key={s.step}
              className="flex gap-3 rounded-sm border border-warm-black-800 bg-warm-black-950 px-3 py-2"
            >
              <span className="font-mono text-xs text-pink-200">{s.step}</span>
              <div className="flex-1">
                <div className="text-sm text-chrome-100">{s.title}</div>
                <p className="mt-0.5 text-xs text-chrome-400">
                  {s.description}
                </p>
                <div className="mt-1 flex flex-wrap items-baseline gap-2 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-500">
                  <span>~{s.estimatedTime} min</span>
                  <span>&middot; {s.difficulty}</span>
                  {s.techniques.map((t, i) => (
                    <span
                      key={i}
                      className="rounded-sm border border-warm-black-700 px-1.5 py-0.5 text-chrome-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Colours */}
      {colors.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="chrome-label text-chrome-400">Colours</h3>
          <ul className="flex flex-wrap gap-2">
            {colors.map((c, i) => (
              <li
                key={i}
                className="flex items-center gap-2 rounded-sm border border-warm-black-800 bg-warm-black-950 px-3 py-1.5"
              >
                <span
                  aria-hidden
                  className="h-4 w-4 rounded-sm border border-warm-black-700"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="text-sm text-chrome-100">{c.name}</span>
                <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-500">
                  {c.hex} &middot; {c.percentage.toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Export */}
      <section className="flex flex-wrap items-center gap-3 rounded-sm border border-emerald-400/30 bg-emerald-900/10 px-4 py-3">
        <span className="font-mono text-xs text-emerald-200">
          spec ready
        </span>
        <button
          type="button"
          onClick={onExportJson}
          className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-pink-200 transition-colors hover:bg-pink-200/20"
        >
          Export pattern JSON
        </button>
        <span className="text-xs text-chrome-400">
          PDF / SVG / DXF exporters are stubbed — JSON carries the full
          spec for now.
        </span>
      </section>
    </div>
  );
}

function ConstructionList({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-500">
        {label}
      </div>
      {items.length === 0 ? (
        <div className="text-xs text-chrome-500">—</div>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {items.map((it, i) => (
            <li key={i} className="text-xs text-chrome-200">
              {it}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-500">
        {label}
      </div>
      <div className="text-sm text-chrome-100">{value}</div>
    </div>
  );
}
