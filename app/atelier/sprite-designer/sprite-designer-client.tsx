"use client";

/**
 * app/atelier/sprite-designer/sprite-designer-client.tsx
 *
 * Pixel-art sprite editor. Pen/eraser on a small grid; onion-skinned
 * frame timeline with play/pause; K-Centroid photo-to-sprite snap;
 * PNG and BMP-zip export; .holosprite save/load.
 *
 * Ported from the Vite bench app at
 * `D:/The_Hangar/apps/sprite-designer/`. Engine modules live under
 * `lib/sprite-designer/`; this file is the UI shell.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import { createLogger } from "lib/log";
import { encodeBmp24 } from "lib/sprite-designer/bmp";
import {
  deserialize as loadProject,
  downloadHolosprite,
  serialize as saveProject,
} from "lib/sprite-designer/holosprite";
import { kCentroid } from "lib/sprite-designer/kcentroid";
import {
  ALL_PALETTES,
  HOLOFLOW_5,
  type Palette,
} from "lib/sprite-designer/palettes";
import { photoToSprite } from "lib/sprite-designer/photo-to-sprite";
import {
  useFrames,
  type FramesApi,
} from "lib/sprite-designer/use-frames";
import { useHistory } from "lib/sprite-designer/use-history";
import { buildZipStore } from "lib/sprite-designer/zip";
import { pushAtelierOutput, useActiveChamber } from "lib/state/atelier-hooks";

const log = createLogger("atelier:sprite-designer");

const DEFAULT_W = 32;
const DEFAULT_H = 32;
const TILE = 16;

type Tool = "pen" | "erase";

export default function SpriteDesignerClient() {
  const [width, setWidth] = useState(DEFAULT_W);
  const [height, setHeight] = useState(DEFAULT_H);
  const [palette, setPalette] = useState<Palette>(HOLOFLOW_5);
  const [colorIndex, setColorIndex] = useState(0);
  const [tool, setTool] = useState<Tool>("pen");
  const [onionPrev, setOnionPrev] = useState(true);
  const [onionNext, setOnionNext] = useState(true);
  const [activeData, setActiveData] = useState<ImageData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useActiveChamber("sprite-designer");

  const history = useHistory(useCallback(() => canvasRef.current, []));
  const frames = useFrames(
    useCallback(() => canvasRef.current, []),
    width,
    height,
  );

  const snapshot = useCallback((): ImageData => {
    const c = canvasRef.current!;
    return c.getContext("2d")!.getImageData(0, 0, c.width, c.height);
  }, []);

  // Repaint preview = active frame + onion-skin neighbours + grid.
  const paintPreview = useCallback(() => {
    const src = canvasRef.current;
    const dst = previewRef.current;
    if (!src || !dst) return;
    dst.width = src.width * TILE;
    dst.height = src.height * TILE;
    const ctx = dst.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, dst.width, dst.height);

    const drawFrame = (data: ImageData, alpha: number) => {
      const tmp = document.createElement("canvas");
      tmp.width = data.width;
      tmp.height = data.height;
      tmp.getContext("2d")!.putImageData(data, 0, 0);
      ctx.globalAlpha = alpha;
      ctx.drawImage(tmp, 0, 0, dst.width, dst.height);
      ctx.globalAlpha = 1;
    };

    if (onionPrev && frames.current > 0) {
      drawFrame(frames.frames[frames.current - 1], 0.25);
    }
    if (onionNext && frames.current < frames.frames.length - 1) {
      drawFrame(frames.frames[frames.current + 1], 0.25);
    }
    ctx.drawImage(src, 0, 0, dst.width, dst.height);

    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    for (let x = 0; x <= src.width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * TILE, 0);
      ctx.lineTo(x * TILE, dst.height);
      ctx.stroke();
    }
    for (let y = 0; y <= src.height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * TILE);
      ctx.lineTo(dst.width, y * TILE);
      ctx.stroke();
    }
  }, [frames.current, frames.frames, onionPrev, onionNext]);

  // Re-init canvas on dimension change.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = width;
    c.height = height;
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#0e0e14";
    ctx.fillRect(0, 0, width, height);
    paintPreview();
    history.reset(snapshot());
    setActiveData(snapshot());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  // Frame switch: repaint, reset undo (per-frame undo TODO).
  useEffect(() => {
    paintPreview();
    if (!canvasRef.current) return;
    const snap = snapshot();
    history.reset(snap);
    setActiveData(snap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames.current]);

  // Repaint on every render (covers undo/redo + onion toggles).
  useEffect(() => {
    paintPreview();
  });

  const commitStroke = () => {
    history.push(snapshot());
    setActiveData(snapshot());
  };

  const paintAt = (clientX: number, clientY: number) => {
    const dst = previewRef.current;
    if (!dst || !canvasRef.current) return;
    const rect = dst.getBoundingClientRect();
    const x = Math.floor(((clientX - rect.left) / rect.width) * width);
    const y = Math.floor(((clientY - rect.top) / rect.height) * height);
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const ctx = canvasRef.current.getContext("2d")!;
    ctx.fillStyle = tool === "pen" ? palette.colors[colorIndex] : "#0e0e14";
    ctx.fillRect(x, y, 1, 1);
    paintPreview();
  };

  const onPhotoSelect = async (file: File) => {
    try {
      const result = await photoToSprite(file, width, height, palette.colors);
      canvasRef.current!.getContext("2d")!.putImageData(result, 0, 0);
      paintPreview();
      commitStroke();
    } catch (err) {
      log.error("photo-to-sprite failed", { err });
      setError(err instanceof Error ? err.message : "Photo conversion failed.");
    }
  };

  const runKCentroid = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const src = ctx.getImageData(0, 0, c.width, c.height);
    const out = kCentroid(src, width, height, 4, 3);
    ctx.putImageData(out.centroid, 0, 0);
    paintPreview();
    commitStroke();
  };

  const exportPng = () => {
    const c = canvasRef.current;
    if (!c) return;
    c.toBlob((blob) => {
      if (!blob) return;
      const filename = `sprite_${width}x${height}.png`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = filename;
      link.href = url;
      link.click();
      pushAtelierOutput({
        chamberSlug: "sprite-designer",
        kind: "image",
        label: filename,
        blobUrl: URL.createObjectURL(blob),
        mimeType: "image/png",
        sizeBytes: blob.size,
      });
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  };

  const saveSprite = () => {
    const live = snapshot();
    const all = frames.frames.map((f, i) => (i === frames.current ? live : f));
    const text = saveProject({
      width,
      height,
      paletteName: palette.name,
      paletteColors: palette.colors,
      frames: all,
      fps: frames.fps,
    });
    const filename = `sprite_${width}x${height}_${all.length}f`;
    const blob = downloadHolosprite(text, filename);
    pushAtelierOutput({
      chamberSlug: "sprite-designer",
      kind: "data",
      label: `${filename}.holosprite`,
      blobUrl: URL.createObjectURL(blob),
      mimeType: "application/json",
      sizeBytes: blob.size,
    });
  };

  const loadSprite = async (file: File) => {
    setError(null);
    let parsed;
    try {
      const text = await file.text();
      parsed = loadProject(text);
    } catch (err) {
      log.error("load .holosprite failed", { err });
      setError(err instanceof Error ? err.message : "Couldn't read that file.");
      return;
    }
    setWidth(parsed.width);
    setHeight(parsed.height);
    const known = ALL_PALETTES.find((q) => q.name === parsed.paletteName);
    setPalette(
      known ?? { name: parsed.paletteName, colors: parsed.paletteColors },
    );
    frames.setFps(parsed.fps);
    // Defer replaceAll until after the canvas resize effect runs.
    requestAnimationFrame(() => {
      frames.replaceAll(parsed.frames, 0);
      paintPreview();
      history.reset(parsed.frames[0]);
      setActiveData(parsed.frames[0]);
    });
  };

  const exportBmpZip = () => {
    const live = snapshot();
    const all = frames.frames.map((f, i) => (i === frames.current ? live : f));
    const files = all.map((data, i) => ({
      name: `${String(i + 1).padStart(3, "0")}.bmp`,
      data: encodeBmp24(data),
    }));
    const zip = buildZipStore(files);
    const blob = new Blob([new Uint8Array(zip)], { type: "application/zip" });
    const filename = `sprite_${width}x${height}_${all.length}frames.zip`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = filename;
    link.href = url;
    link.click();
    pushAtelierOutput({
      chamberSlug: "sprite-designer",
      kind: "data",
      label: filename,
      blobUrl: URL.createObjectURL(blob),
      mimeType: "application/zip",
      sizeBytes: blob.size,
    });
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // ---- Render ------------------------------------------------------------

  const toolBtn = (label: string, active: boolean, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-sm border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] transition-colors ${
        active
          ? "border-pink-200 bg-pink-200/10 text-pink-100"
          : "border-warm-black-700 bg-warm-black-900 text-chrome-200 hover:border-chrome-400"
      }`}
    >
      {label}
    </button>
  );

  const actionBtn = (
    label: string,
    onClick: () => void,
    disabled = false,
    title?: string,
  ) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-chrome-200 transition-colors hover:border-chrome-400 disabled:opacity-40"
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <p className="rounded-sm border border-pink-400/40 bg-pink-900/10 px-4 py-3 text-xs text-pink-200">
          {error}
        </p>
      ) : null}

      {/* --- Top toolbar: dimensions + palette + tools + actions --------- */}
      <section className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="chrome-label text-chrome-400">Width</span>
          <input
            type="number"
            min={1}
            max={256}
            value={width}
            onChange={(e) => setWidth(Math.max(1, Number(e.target.value)))}
            className="w-20 rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1.5 font-mono text-xs text-chrome-100"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="chrome-label text-chrome-400">Height</span>
          <input
            type="number"
            min={1}
            max={256}
            value={height}
            onChange={(e) => setHeight(Math.max(1, Number(e.target.value)))}
            className="w-20 rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1.5 font-mono text-xs text-chrome-100"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="chrome-label text-chrome-400">Palette</span>
          <select
            value={palette.name}
            onChange={(e) => {
              const p = ALL_PALETTES.find((q) => q.name === e.target.value);
              if (p) {
                setPalette(p);
                setColorIndex(0);
              }
            }}
            className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1.5 font-mono text-xs text-chrome-100"
          >
            {ALL_PALETTES.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1">
          <span className="chrome-label text-chrome-400">Tools</span>
          <div className="flex gap-2">
            {toolBtn("Brush", tool === "pen", () => setTool("pen"))}
            {toolBtn("Eraser", tool === "erase", () => setTool("erase"))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="chrome-label text-chrome-400">History</span>
          <div className="flex gap-2">
            {actionBtn("Undo", history.undo, !history.canUndo, "Ctrl+Z")}
            {actionBtn(
              "Redo",
              history.redo,
              !history.canRedo,
              "Ctrl+Shift+Z / Ctrl+Y",
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="chrome-label text-chrome-400">Onion skin</span>
          <div className="flex gap-3">
            <label className="flex items-center gap-1.5 font-mono text-[11px] text-chrome-300">
              <input
                type="checkbox"
                checked={onionPrev}
                onChange={(e) => setOnionPrev(e.target.checked)}
                className="accent-pink-200"
              />
              prev
            </label>
            <label className="flex items-center gap-1.5 font-mono text-[11px] text-chrome-300">
              <input
                type="checkbox"
                checked={onionNext}
                onChange={(e) => setOnionNext(e.target.checked)}
                className="accent-pink-200"
              />
              next
            </label>
          </div>
        </div>
      </section>

      {/* --- Palette swatches ------------------------------------------- */}
      <section className="flex flex-wrap items-center gap-2">
        <span className="chrome-label text-chrome-400">Colours</span>
        {palette.colors.map((c, i) => (
          <button
            key={`${palette.name}-${i}`}
            type="button"
            onClick={() => setColorIndex(i)}
            aria-label={`Pick ${c}`}
            title={c}
            className={`h-6 w-6 rounded-sm border transition-transform ${
              i === colorIndex
                ? "scale-110 border-pink-200 ring-2 ring-pink-200/40"
                : "border-warm-black-700 hover:border-chrome-400"
            }`}
            style={{ background: c }}
          />
        ))}
      </section>

      {/* --- Actions row ------------------------------------------------ */}
      <section className="flex flex-wrap items-center gap-2">
        {actionBtn(
          "K-Centroid",
          runKCentroid,
          false,
          "Re-quantise the current frame in-place.",
        )}
        <label className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-chrome-200 hover:border-chrome-400">
          Photo → Sprite
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const f = e.target.files?.[0];
              if (f) void onPhotoSelect(f);
              e.target.value = "";
            }}
          />
        </label>
        {actionBtn("Export PNG", exportPng)}
        {actionBtn(
          "Export BMP ZIP",
          exportBmpZip,
          false,
          "BMP sequence for the drone POV firmware.",
        )}
        {actionBtn("Save .holosprite", saveSprite)}
        <label className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-chrome-200 hover:border-chrome-400">
          Load .holosprite
          <input
            type="file"
            accept=".holosprite,application/json"
            className="hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const f = e.target.files?.[0];
              if (f) void loadSprite(f);
              e.target.value = "";
            }}
          />
        </label>
      </section>

      {/* --- Timeline --------------------------------------------------- */}
      <Timeline api={frames} activeData={activeData} />

      {/* --- The drawing surface ---------------------------------------- */}
      <section className="flex flex-col gap-2">
        <span className="chrome-label text-chrome-400">
          Canvas &middot; {width}&times;{height}
        </span>
        <div className="overflow-auto rounded-sm border border-warm-black-800 bg-warm-black-950 p-2">
          <canvas
            ref={previewRef}
            onPointerDown={(e) => {
              drawing.current = true;
              paintAt(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (drawing.current) paintAt(e.clientX, e.clientY);
            }}
            onPointerUp={() => {
              if (drawing.current) {
                drawing.current = false;
                commitStroke();
              }
            }}
            onPointerLeave={() => {
              if (drawing.current) {
                drawing.current = false;
                commitStroke();
              }
            }}
            style={{
              border: "1px solid #2a2a38",
              cursor: "crosshair",
              touchAction: "none",
              imageRendering: "pixelated",
            }}
          />
        </div>
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-chrome-500">
          ctrl+z undo &middot; ctrl+shift+z / ctrl+y redo &middot; bmp zip
          feeds the drone POV firmware
        </p>
      </section>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Timeline strip — thumbnails, drag-to-reorder, playback.
// ----------------------------------------------------------------------------

const THUMB = 48;

function Timeline({
  api,
  activeData,
}: {
  api: FramesApi;
  activeData: ImageData | null;
}) {
  return (
    <section className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={api.isPlaying ? api.stopPlayback : api.beginPlayback}
        className="rounded-sm border border-pink-200/60 bg-pink-900/30 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-pink-100 hover:border-pink-200"
      >
        {api.isPlaying ? "Stop" : "Play"}
      </button>
      <label className="flex items-center gap-2 font-mono text-[11px] text-chrome-300">
        FPS
        <input
          type="number"
          min={1}
          max={60}
          value={api.fps}
          onChange={(e) => api.setFps(Math.max(1, Number(e.target.value)))}
          className="w-14 rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1 font-mono text-xs text-chrome-100"
        />
      </label>
      <button
        type="button"
        onClick={api.addBlank}
        className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-chrome-200 hover:border-chrome-400"
      >
        + Frame
      </button>
      <button
        type="button"
        onClick={api.duplicate}
        className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-chrome-200 hover:border-chrome-400"
      >
        Duplicate
      </button>
      <button
        type="button"
        onClick={api.remove}
        disabled={api.frames.length <= 1}
        className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-chrome-200 hover:border-chrome-400 disabled:opacity-40"
      >
        Delete
      </button>
      <div className="flex max-w-[60vw] gap-1.5 overflow-x-auto pl-2">
        {api.frames.map((frame, i) => (
          <FrameThumb
            key={i}
            index={i}
            data={i === api.current ? (activeData ?? frame) : frame}
            active={i === api.current}
            onClick={() => api.select(i)}
            onDragStart={(e) =>
              e.dataTransfer.setData("text/plain", String(i))
            }
            onDrop={(e) => {
              const from = parseInt(
                e.dataTransfer.getData("text/plain"),
                10,
              );
              if (!isNaN(from)) api.reorder(from, i);
            }}
          />
        ))}
      </div>
    </section>
  );
}

function FrameThumb({
  data,
  active,
  index,
  onClick,
  onDragStart,
  onDrop,
}: {
  data: ImageData;
  active: boolean;
  index: number;
  onClick: () => void;
  onDragStart: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.width = THUMB;
    c.height = THUMB;
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#0e0e14";
    ctx.fillRect(0, 0, THUMB, THUMB);
    const tmp = document.createElement("canvas");
    tmp.width = data.width;
    tmp.height = data.height;
    tmp.getContext("2d")!.putImageData(data, 0, 0);
    ctx.drawImage(tmp, 0, 0, THUMB, THUMB);
  }, [data]);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onClick={onClick}
      title={`Frame ${index + 1}`}
      className={`relative cursor-pointer rounded-sm p-0.5 ${
        active
          ? "border-2 border-pink-200 bg-warm-black-900"
          : "border border-warm-black-700 bg-warm-black-900 hover:border-chrome-400"
      }`}
    >
      <canvas
        ref={ref}
        style={{ display: "block", imageRendering: "pixelated" }}
      />
      <div
        className={`absolute bottom-0.5 right-1 font-mono text-[9px] ${
          active ? "text-pink-200" : "text-chrome-500"
        }`}
      >
        {index + 1}
      </div>
    </div>
  );
}
