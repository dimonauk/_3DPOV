"use client";

/**
 * app/atelier/exif-strip/exif-strip-client.tsx — Strip-metadata chamber UI.
 *
 * Drag-an-image → POST to `${functionsBase()}/exif_strip` → receive the
 * same image, cleaned. The function reads what metadata existed, drops
 * it, and surfaces a list of what was removed via the `X-Stripped`
 * response header. This client handles the round-trip + presentation.
 *
 * Source image stays in the browser until the operator clicks Strip;
 * from there it's sent once, response comes back, function forgets.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { functionUrl } from "lib/firebase/functions";

type OutputState =
  | { kind: "idle" }
  | { kind: "running"; startedAt: number }
  | {
      kind: "ready";
      blob: Blob;
      filename: string;
      durationMs: number;
      stripped: string[];
      cleanedSize: number;
    }
  | { kind: "error"; message: string };

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function parseStripped(headerValue: string | null): string[] {
  if (!headerValue) return [];
  const trimmed = headerValue.trim();
  if (!trimmed || trimmed.toLowerCase() === "none") return [];
  return trimmed
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default function ExifStripClient() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);

  const [preserveIcc, setPreserveIcc] = useState(false);

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

  const onStrip = useCallback(async () => {
    if (!sourceFile) return;
    const startedAt = Date.now();
    setOutput({ kind: "running", startedAt });
    try {
      const fd = new FormData();
      fd.append("file", sourceFile, sourceFile.name);
      fd.append("preserve_icc", preserveIcc ? "1" : "0");
      const res = await fetch(functionUrl("exif_strip"), {
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
      const stripped = parseStripped(res.headers.get("X-Stripped"));
      const blob = await res.blob();
      const base = sourceFile.name.replace(/\.[^.]+$/, "");
      const extMatch = sourceFile.name.match(/\.([^.]+)$/);
      const ext = extMatch ? extMatch[1]!.toLowerCase() : "img";
      const filename = `${base}_clean.${ext}`;
      setOutput({
        kind: "ready",
        blob,
        filename,
        durationMs: Date.now() - startedAt,
        stripped,
        cleanedSize: blob.size,
      });
    } catch (err) {
      console.error("[atelier/exif-strip] strip failed", err);
      setOutput({
        kind: "error",
        message: err instanceof Error ? err.message : "Strip failed.",
      });
    }
  }, [preserveIcc, sourceFile]);

  const onDownload = useCallback(() => {
    if (output.kind !== "ready") return;
    const url = URL.createObjectURL(output.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = output.filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [output]);

  // ---- Drop zone ---------------------------------------------------------

  const dropClasses = `flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-sm border border-dashed px-6 py-10 text-center transition-colors ${
    isDragOver
      ? "border-pink-200 bg-warm-black-900/60"
      : "border-warm-black-700 bg-warm-black-950"
  }`;

  const sourceSize = sourceFile?.size ?? 0;

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
          aria-label="Choose an image to strip metadata from"
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
          <section className="flex flex-col gap-3">
            <label className="flex items-center gap-3 text-sm text-chrome-200">
              <input
                type="checkbox"
                checked={preserveIcc}
                onChange={(e) => setPreserveIcc(e.target.checked)}
                className="h-4 w-4 accent-pink-200"
              />
              <span>
                Preserve ICC colour profile
                <span className="ml-2 text-xs text-chrome-500">
                  (keep accurate-colour data for print workflows; only
                  drops EXIF / XMP / IPTC)
                </span>
              </span>
            </label>
          </section>

          <section className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onStrip}
              disabled={output.kind === "running"}
              className="self-start rounded-sm border border-pink-200/60 bg-pink-900/40 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
            >
              {output.kind === "running"
                ? "Stripping metadata…"
                : "→ Strip metadata"}
            </button>

            {output.kind === "running" ? (
              <p className="text-xs text-chrome-400">
                The chamber re-encodes the file without its sidecar
                blocks. Small images land in under a second; cold starts
                add a few.
              </p>
            ) : null}

            {output.kind === "error" ? (
              <p className="rounded-sm border border-pink-400/40 bg-pink-900/10 px-4 py-3 text-xs text-pink-200">
                {output.message}
              </p>
            ) : null}
          </section>

          {output.kind === "ready" ? (
            <section className="flex flex-col gap-4 rounded-sm border border-emerald-400/30 bg-emerald-900/10 px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-xs text-emerald-200">
                  Cleaned in {(output.durationMs / 1000).toFixed(2)}s
                  &middot; {formatBytes(sourceSize)} &rarr;{" "}
                  {formatBytes(output.cleanedSize)}
                </span>
                <button
                  type="button"
                  onClick={onDownload}
                  className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
                >
                  Download {output.filename}
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <span className="chrome-label text-chrome-400">
                  Stripped
                </span>
                {output.stripped.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {output.stripped.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-sm border border-pink-200/40 bg-pink-900/20 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-pink-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-chrome-400">
                    The source had no metadata blocks to remove. The file
                    was re-encoded clean either way.
                  </p>
                )}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
