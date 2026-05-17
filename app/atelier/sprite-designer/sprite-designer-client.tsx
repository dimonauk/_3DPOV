"use client";

/**
 * app/atelier/sprite-designer/sprite-designer-client.tsx
 *
 * Pixel-art sprite editor. Pen/eraser on a small grid; onion-skinned
 * frame timeline with play/pause; K-Centroid photo-to-sprite snap;
 * PNG and BMP-zip export; .holosprite save/load.
 *
 * Orchestrator only. Timeline + thumbnails in
 * sprite-designer/timeline.tsx; IO handlers (export/save/load/photo/
 * kCentroid) in use-sprite-io.ts; constants in constants.ts. The
 * drawing surface (canvas refs + paintAt + paintPreview + history)
 * stays here because everything in the chamber reads or writes
 * those refs. Per ARCHITECTURE.md Rule 1.
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
} from "react";

import {
  ALL_PALETTES,
  HOLOFLOW_5,
  type Palette,
} from "lib/sprite-designer/palettes";
import { useFrames } from "lib/sprite-designer/use-frames";
import { useHistory } from "lib/sprite-designer/use-history";
import { useActiveChamber } from "lib/state/atelier-hooks";

import { DEFAULT_H, DEFAULT_W, TILE, type Tool } from "./sprite-designer/constants";
import { Timeline } from "./sprite-designer/timeline";
import { useSpriteIo } from "./sprite-designer/use-sprite-io";

export default function SpriteDesignerClient() {
  const [width, setWidth] = useState(DEFAULT_W);
  const [height, setHeight] = useState(DEFAULT_H);
  const [palette, setPalette] = useState<Palette>(HOLOFLOW_5);
  const [colorIndex, setColorIndex] = useState(0);
  const [tool, setTool] = useState<Tool>("pen");
  const [onionPrev, setOnionPrev] = useState(true);
  const [onionNext, setOnionNext] = useState(true);
  const [activeData, setActiveData] = useState<ImageData | null>(null);

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
      // current > 0 → frames[current - 1] is defined.
      drawFrame(frames.frames[frames.current - 1]!, 0.25);
    }
    if (onionNext && frames.current < frames.frames.length - 1) {
      drawFrame(frames.frames[frames.current + 1]!, 0.25);
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

  const commitStroke = useCallback(() => {
    history.push(snapshot());
    setActiveData(snapshot());
  }, [history, snapshot]);

  const paintAt = (clientX: number, clientY: number) => {
    const dst = previewRef.current;
    if (!dst || !canvasRef.current) return;
    const rect = dst.getBoundingClientRect();
    const x = Math.floor(((clientX - rect.left) / rect.width) * width);
    const y = Math.floor(((clientY - rect.top) / rect.height) * height);
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const ctx = canvasRef.current.getContext("2d")!;
    // colorIndex bounded by palette UI to [0, palette.colors.length).
    ctx.fillStyle = tool === "pen" ? palette.colors[colorIndex]! : "#0e0e14";
    ctx.fillRect(x, y, 1, 1);
    paintPreview();
  };

  const io = useSpriteIo({
    canvasRef,
    width,
    height,
    palette,
    setWidth,
    setHeight,
    setPalette,
    setActiveData,
    frames,
    history,
    snapshot,
    paintPreview,
    commitStroke,
  });

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
      {io.error ? (
        <p className="rounded-sm border border-pink-400/40 bg-pink-900/10 px-4 py-3 text-xs text-pink-200">
          {io.error}
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
          io.runKCentroid,
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
              if (f) void io.onPhotoSelect(f);
              e.target.value = "";
            }}
          />
        </label>
        {actionBtn("Export PNG", io.exportPng)}
        {actionBtn(
          "Export BMP ZIP",
          io.exportBmpZip,
          false,
          "BMP sequence for the drone POV firmware.",
        )}
        {actionBtn("Save .holosprite", io.saveSprite)}
        <label className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-chrome-200 hover:border-chrome-400">
          Load .holosprite
          <input
            type="file"
            accept=".holosprite,application/json"
            className="hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const f = e.target.files?.[0];
              if (f) void io.loadSprite(f);
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
