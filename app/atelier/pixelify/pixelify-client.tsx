"use client";

/**
 * app/atelier/pixelify/pixelify-client.tsx — Drag-an-image → pixel-art chamber.
 *
 * Wraps `lib/image-to-pixel/pixelate.js` (vendored from the MIT-licensed
 * Image-to-Pixel library) with a Holoflow-styled control surface. Pure
 * client; the source image never leaves the browser. Re-renders the
 * output canvas on every parameter change, debounced so dragging a
 * slider doesn't queue dozens of full-image pixelations.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import {
  pixelate,
  type PixelateDither,
} from "lib/image-to-pixel/pixelate";

const DITHER_OPTIONS: ReadonlyArray<PixelateDither> = [
  "none",
  "Floyd-Steinberg",
  "atkinson",
  "ordered",
  "4x4 Bayer",
  "2x2 Bayer",
  "clustered 4x4",
];

// A short curated set of Lospec palettes for the dropdown. Operators
// can type any Lospec palette name into the custom field for the long
// tail.
const PALETTE_PRESETS: ReadonlyArray<{ label: string; slug: string }> = [
  { label: "(none — full RGB)", slug: "" },
  { label: "Endesga 32", slug: "endesga-32" },
  { label: "Sweetie 16", slug: "sweetie-16" },
  { label: "Pico-8", slug: "pico-8" },
  { label: "Resurrect 64", slug: "resurrect-64" },
  { label: "Vinik 24", slug: "vinik24" },
  { label: "AYY4 (4-color)", slug: "ayy4" },
  { label: "Lost century (24)", slug: "lost-century" },
];

export default function PixelifyClient() {
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [sourceFilename, setSourceFilename] = useState<string>("output");

  const [pixelWidth, setPixelWidth] = useState(96);
  const [dither, setDither] = useState<PixelateDither>("Floyd-Steinberg");
  const [strength, setStrength] = useState(80);
  const [palettePreset, setPalettePreset] = useState<string>("endesga-32");
  const [paletteCustom, setPaletteCustom] = useState<string>("");
  const [resolution, setResolution] = useState<"pixel" | "original">("original");

  const [outputCanvas, setOutputCanvas] = useState<HTMLCanvasElement | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const outputContainerRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<number | null>(null);

  // ---- Source loading ---------------------------------------------------

  const loadFile = useCallback((file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("That doesn't look like an image.");
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setSourceImage(img);
      setSourceUrl(url);
      setSourceFilename(file.name.replace(/\.[^.]+$/, ""));
    };
    img.onerror = () => {
      setError("Couldn't decode that image.");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, []);

  const onPickClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) loadFile(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [loadFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) loadFile(file);
    },
    [loadFile],
  );

  // ---- Pixelation (debounced on parameter change) ------------------------

  const palette: string | null =
    paletteCustom.trim().length > 0
      ? paletteCustom.trim()
      : palettePreset.length > 0
        ? palettePreset
        : null;

  useEffect(() => {
    if (!sourceImage) return;
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(async () => {
      setBusy(true);
      setError(null);
      try {
        const out = (await pixelate({
          image: sourceImage,
          width: pixelWidth,
          dither,
          strength,
          palette,
          resolution,
        })) as HTMLCanvasElement;
        setOutputCanvas(out);
        // Mount the canvas into the DOM (createElement in pixelate.js makes
        // it detached). Replace any prior canvas.
        const container = outputContainerRef.current;
        if (container) {
          container.replaceChildren(out);
          out.classList.add(
            "max-w-full",
            "h-auto",
            "border",
            "border-warm-black-800",
            "rounded-sm",
          );
          out.style.imageRendering = "pixelated";
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Pixelation failed.");
      } finally {
        setBusy(false);
      }
    }, 150);
    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [sourceImage, pixelWidth, dither, strength, palette, resolution]);

  // ---- Download ---------------------------------------------------------

  const onDownload = useCallback(() => {
    if (!outputCanvas) return;
    outputCanvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${sourceFilename}_pixelified_w${pixelWidth}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }, "image/png");
  }, [outputCanvas, pixelWidth, sourceFilename]);

  // ---- Cleanup object URLs ----------------------------------------------

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    };
  }, [sourceUrl]);

  // ---- Render ------------------------------------------------------------

  return (
    <div className="flex flex-col gap-8">
      <section
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        className={`flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-sm border border-dashed px-6 py-10 text-center transition-colors ${
          isDragOver
            ? "border-pink-200 bg-warm-black-900/60"
            : "border-warm-black-700 bg-warm-black-950"
        }`}
      >
        <span className="chrome-label text-chrome-400">Drop zone</span>
        <p className="text-sm leading-relaxed text-chrome-300">
          Drag an image here, or
        </p>
        <button
          type="button"
          onClick={onPickClick}
          className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
        >
          Choose an image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
      </section>

      {error ? (
        <p className="rounded-sm border border-pink-400/40 bg-pink-900/10 px-4 py-3 text-xs text-pink-200">
          {error}
        </p>
      ) : null}

      {sourceImage ? (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1.5">
              <span className="chrome-label text-chrome-400">
                Pixel width &middot; {pixelWidth}
              </span>
              <input
                type="range"
                min={8}
                max={384}
                step={1}
                value={pixelWidth}
                onChange={(e) => setPixelWidth(Number(e.target.value))}
                className="accent-pink-200"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="chrome-label text-chrome-400">Dither</span>
              <select
                value={dither}
                onChange={(e) => setDither(e.target.value as PixelateDither)}
                className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1.5 font-mono text-xs text-chrome-100"
              >
                {DITHER_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="chrome-label text-chrome-400">
                Dither strength &middot; {strength}
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={strength}
                onChange={(e) => setStrength(Number(e.target.value))}
                disabled={dither === "none"}
                className="accent-pink-200 disabled:opacity-40"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="chrome-label text-chrome-400">Resolution</span>
              <select
                value={resolution}
                onChange={(e) =>
                  setResolution(e.target.value as "pixel" | "original")
                }
                title="`pixel` returns the pixelated canvas at its true (small) dimensions; `original` scales it back up to the source size with nearest-neighbour."
                className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1.5 font-mono text-xs text-chrome-100"
              >
                <option value="original">Scaled back to original</option>
                <option value="pixel">Native pixel size</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="chrome-label text-chrome-400">
                Palette preset
              </span>
              <select
                value={palettePreset}
                onChange={(e) => setPalettePreset(e.target.value)}
                disabled={paletteCustom.trim().length > 0}
                className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1.5 font-mono text-xs text-chrome-100 disabled:opacity-40"
              >
                {PALETTE_PRESETS.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="chrome-label text-chrome-400">
                Custom Lospec slug (overrides preset)
              </span>
              <input
                type="text"
                value={paletteCustom}
                onChange={(e) => setPaletteCustom(e.target.value)}
                placeholder="e.g. cl8uds-32 — see lospec.com/palette-list"
                className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1.5 font-mono text-xs text-chrome-100"
              />
            </label>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="chrome-label text-chrome-400">
                {busy ? "Pixelifying…" : "Output"}
              </span>
              <button
                type="button"
                onClick={onDownload}
                disabled={!outputCanvas || busy}
                className="rounded-sm border border-pink-200/60 bg-pink-900/20 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-50"
              >
                Download PNG
              </button>
            </div>
            <div
              ref={outputContainerRef}
              className="flex min-h-[200px] items-center justify-center overflow-auto rounded-sm border border-warm-black-800 bg-warm-black-950 p-2"
            />
          </section>
        </>
      ) : null}
    </div>
  );
}
