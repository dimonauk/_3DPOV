"use client";

/**
 * app/atelier/probe/probe-client.tsx — Probe chamber UI.
 *
 * Drag-an-image → POST to `${functionsBase()}/probe` → receive a
 * metadata object → render it as a grouped table. The function runs the
 * Pillow + ExifRead extraction; this client handles the round-trip and
 * the presentation.
 *
 * Source image stays in the browser until the operator clicks Probe;
 * from there it's sent once, response comes back, function forgets.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { functionUrl } from "lib/firebase/functions";
import { createLogger } from "lib/log";

const log = createLogger("atelier:probe");

type ExifFields = Record<string, string | number>;

type ProbeResult = {
  format: string | null;
  width: number;
  height: number;
  mode: string;
  bit_depth: number | null;
  size_bytes: number;
  iccProfile: string | null;
  exif: ExifFields;
};

type OutputState =
  | { kind: "idle" }
  | { kind: "running"; startedAt: number }
  | { kind: "ready"; result: ProbeResult; durationMs: number }
  | { kind: "error"; message: string };

type Row = { label: string; value: string; href?: string };

// ---- Field grouping ---------------------------------------------------------
//
// Maps EXIF keys to the section we render them under, plus a friendly label.
// Keys not in any group are dropped from the rendered table but still
// available in the raw JSON via the copy button.

const CAMERA_KEYS: Array<[string, string]> = [
  ["Make", "Make"],
  ["Model", "Model"],
  ["LensMake", "Lens make"],
  ["LensModel", "Lens"],
  ["Software", "Software"],
];

const IMAGE_KEYS: Array<[string, string]> = [
  ["DateTimeOriginal", "Taken"],
  ["DateTimeDigitized", "Digitised"],
  ["DateTime", "Modified"],
  ["Orientation", "Orientation"],
];

const EXPOSURE_KEYS: Array<[string, string]> = [
  ["ExposureTime", "Shutter"],
  ["FNumber", "Aperture"],
  ["ISO", "ISO"],
  ["FocalLength", "Focal length"],
  ["FocalLengthIn35mmFilm", "Focal (35mm equiv.)"],
  ["ExposureProgram", "Exposure program"],
  ["ExposureBiasValue", "Exposure bias"],
  ["MeteringMode", "Metering"],
  ["Flash", "Flash"],
  ["WhiteBalance", "White balance"],
];

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function valueToString(v: string | number | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") {
    return Number.isInteger(v) ? String(v) : v.toFixed(3).replace(/\.?0+$/, "");
  }
  const s = v.trim();
  return s.length ? s : null;
}

function collectRows(
  exif: ExifFields,
  keys: Array<[string, string]>,
): Row[] {
  const rows: Row[] = [];
  for (const [key, label] of keys) {
    const v = valueToString(exif[key]);
    if (v !== null) rows.push({ label, value: v });
  }
  return rows;
}

export default function ProbeClient() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);

  const [output, setOutput] = useState<OutputState>({ kind: "idle" });
  const [isDragOver, setIsDragOver] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
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

  const onProbe = useCallback(async () => {
    if (!sourceFile) return;
    const startedAt = Date.now();
    setOutput({ kind: "running", startedAt });
    try {
      const fd = new FormData();
      fd.append("file", sourceFile, sourceFile.name);
      const res = await fetch(functionUrl("probe"), {
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
      const result = (await res.json()) as ProbeResult;
      setOutput({
        kind: "ready",
        result,
        durationMs: Date.now() - startedAt,
      });
    } catch (err) {
      log.error("probe failed", { err });
      setOutput({
        kind: "error",
        message: err instanceof Error ? err.message : "Probe failed.",
      });
    }
  }, [sourceFile]);

  const onCopyJson = useCallback(async () => {
    if (output.kind !== "ready") return;
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(output.result, null, 2),
      );
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      // clipboard rejected — silent
    }
  }, [output]);

  // ---- Derived row groups -----------------------------------------------

  const sections = useMemo(() => {
    if (output.kind !== "ready") return [];
    const { result } = output;
    const fileRows: Row[] = [
      { label: "Filename", value: sourceFile?.name ?? "—" },
      { label: "Format", value: result.format ?? "—" },
      { label: "Size", value: formatBytes(result.size_bytes) },
    ];
    const imageRows: Row[] = [
      { label: "Dimensions", value: `${result.width} × ${result.height} px` },
      { label: "Mode", value: result.mode },
    ];
    if (result.bit_depth !== null) {
      imageRows.push({
        label: "Bit depth",
        value: `${result.bit_depth}-bit`,
      });
    }
    if (result.iccProfile) {
      imageRows.push({ label: "ICC profile", value: result.iccProfile });
    }
    const orientation = valueToString(result.exif["Orientation"]);
    if (orientation !== null) {
      imageRows.push({ label: "Orientation", value: orientation });
    }
    for (const key of [
      "DateTimeOriginal",
      "DateTimeDigitized",
      "DateTime",
    ] as const) {
      const v = valueToString(result.exif[key]);
      if (v !== null) {
        const labelMap: Record<string, string> = {
          DateTimeOriginal: "Taken",
          DateTimeDigitized: "Digitised",
          DateTime: "Modified",
        };
        imageRows.push({ label: labelMap[key]!, value: v });
      }
    }

    const cameraRows = collectRows(result.exif, CAMERA_KEYS);
    // Don't double up the date rows — they live in Image.
    const exposureRows = collectRows(result.exif, EXPOSURE_KEYS);

    const locationRows: Row[] = [];
    const lat = result.exif["GPSLatitude"];
    const lon = result.exif["GPSLongitude"];
    if (typeof lat === "number" && typeof lon === "number") {
      locationRows.push({
        label: "GPS",
        value: `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
        href: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
      });
    }
    const alt = valueToString(result.exif["GPSAltitude"]);
    if (alt !== null) {
      locationRows.push({ label: "Altitude", value: `${alt} m` });
    }

    // Suppress empty sections.
    return [
      { title: "File", rows: fileRows },
      { title: "Image", rows: imageRows },
      { title: "Camera", rows: cameraRows },
      { title: "Exposure", rows: exposureRows },
      { title: "Location", rows: locationRows },
    ].filter((s) => s.rows.length > 0);
  }, [output, sourceFile]);

  // ---- Drop zone --------------------------------------------------------

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
          aria-label="Choose an image to probe for metadata"
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
            onClick={onProbe}
            disabled={output.kind === "running"}
            className="self-start rounded-sm border border-pink-200/60 bg-pink-900/40 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
          >
            {output.kind === "running" ? "Probing metadata…" : "→ Probe metadata"}
          </button>

          {output.kind === "running" ? (
            <p className="text-xs text-chrome-400">
              The chamber reads the file&rsquo;s header and IFD chain.
              Small images land in under a second; cold starts add a few.
            </p>
          ) : null}

          {output.kind === "error" ? (
            <p className="rounded-sm border border-pink-400/40 bg-pink-900/10 px-4 py-3 text-xs text-pink-200">
              {output.message}
            </p>
          ) : null}
        </section>
      ) : null}

      {output.kind === "ready" ? (
        <section className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-xs text-chrome-400">
              Probed in {(output.durationMs / 1000).toFixed(2)}s
              {Object.keys(output.result.exif).length === 0
                ? " — no EXIF found"
                : null}
            </span>
            <button
              type="button"
              onClick={onCopyJson}
              className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
            >
              {copyState === "copied" ? "Copied" : "Copy as JSON"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {sections.map((section) => (
              <div
                key={section.title}
                className="flex flex-col gap-3 rounded-sm border border-warm-black-800 bg-warm-black-950 px-5 py-4"
              >
                <h2 className="chrome-label text-chrome-400">
                  {section.title}
                </h2>
                <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5">
                  {section.rows.map((row) => (
                    <RowEntry key={row.label} row={row} />
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function RowEntry({ row }: { row: Row }) {
  return (
    <>
      <dt className="font-mono text-[11px] uppercase tracking-[0.15em] text-chrome-500">
        {row.label}
      </dt>
      <dd className="font-mono text-sm text-chrome-100">
        {row.href ? (
          <a
            href={row.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-200 underline decoration-pink-200/30 underline-offset-2 hover:decoration-pink-200"
          >
            {row.value}
          </a>
        ) : (
          row.value
        )}
      </dd>
    </>
  );
}
