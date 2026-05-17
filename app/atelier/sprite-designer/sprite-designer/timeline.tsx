"use client";

/**
 * app/atelier/sprite-designer/sprite-designer/timeline.tsx — The
 * frame timeline strip: play/pause, FPS input, +/duplicate/delete,
 * draggable thumbnails.
 *
 * Extracted from sprite-designer-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import { type DragEvent, useEffect, useRef } from "react";

import type { FramesApi } from "lib/sprite-designer/use-frames";

const THUMB = 48;

export function Timeline({
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
              const from = parseInt(e.dataTransfer.getData("text/plain"), 10);
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
