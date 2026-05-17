"use client";

/**
 * app/atelier/cube-composer/panels.tsx — The two floating UI panels
 * (panorama generator, trajectory controls) plus the small Stat tile
 * used in the strip beneath the canvas.
 *
 * Extracted from cube-composer-client.tsx per ARCHITECTURE.md Rule 1.
 * Pure presentational — every piece of state is passed in. The host
 * client owns the panorama API call, frame state, and face-status
 * map; this file just renders them.
 */

import {
  type CubeFace,
  FACE_COLOR_ACTIVE,
  FACE_COLOR_DONE,
  FACE_COLOR_PENDING,
  FACE_LABELS,
  FACE_ORDER,
  NUM_FRAMES,
  type PanoramaState,
} from "./types";

export function PanoramaGeneratorPanel({
  panorama,
  prompt,
  onPromptChange,
  onGenerate,
}: {
  panorama: PanoramaState;
  prompt: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
}) {
  return (
    <div className="pointer-events-auto absolute left-3 top-3 flex w-[280px] flex-col gap-2 rounded-sm border border-warm-black-700 bg-warm-black-950/85 p-3 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <span className="chrome-label text-chrome-400">Source material</span>
        <span className="font-mono text-[10px] text-chrome-500">
          flux-equirect-lora-v3
        </span>
      </div>
      <label
        className="flex flex-col gap-1"
        htmlFor="cube-composer-panorama-prompt"
      >
        <span className="sr-only">Panorama prompt</span>
        <textarea
          id="cube-composer-panorama-prompt"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="e.g. abandoned warehouse interior at dawn"
          rows={2}
          disabled={panorama.status === "loading"}
          className="w-full resize-none rounded-sm border border-warm-black-700 bg-warm-black-950 px-2 py-1.5 font-mono text-[11px] text-chrome-200 placeholder:text-chrome-600 focus:border-pink-200 focus:outline-none disabled:opacity-50"
        />
      </label>
      <button
        type="button"
        onClick={onGenerate}
        disabled={panorama.status === "loading"}
        className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {panorama.status === "loading" ? "Generating…" : "Generate panorama"}
      </button>
      {panorama.status === "loading" ? (
        <p className="font-mono text-[10px] leading-relaxed text-chrome-400">
          generating 360° on the bench… ~45-90s
        </p>
      ) : null}
      {panorama.status === "ready" ? (
        <p className="font-mono text-[10px] leading-relaxed text-chrome-500">
          Mapped onto six faces &middot; {Math.round(panorama.durationMs / 1000)}s
        </p>
      ) : null}
      {panorama.status === "error" ? (
        <p className="font-mono text-[10px] leading-relaxed text-pink-300">
          {panorama.message}
        </p>
      ) : null}
    </div>
  );
}

export function TrajectoryControlPanel({
  frame,
  playing,
  windowStart,
  autoregressiveStep,
  faceStatus,
  onScrub,
  onTogglePlay,
  onReset,
}: {
  frame: number;
  playing: boolean;
  windowStart: number;
  autoregressiveStep: number;
  faceStatus: Record<CubeFace, "active" | "done" | "pending">;
  onScrub: (value: number) => void;
  onTogglePlay: () => void;
  onReset: () => void;
}) {
  return (
    <div className="pointer-events-auto absolute bottom-3 right-3 flex w-[260px] flex-col gap-3 rounded-sm border border-warm-black-700 bg-warm-black-950/85 p-3 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <span className="chrome-label text-chrome-400">Trajectory</span>
        <span className="font-mono text-[10px] text-chrome-500">
          frame {frame + 1}/{NUM_FRAMES}
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={NUM_FRAMES - 1}
        value={frame}
        onChange={(e) => onScrub(Number(e.target.value))}
        className="w-full accent-pink-200"
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onTogglePlay}
          className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
        >
          {playing ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-sm border border-warm-black-700 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-chrome-300 transition-colors hover:border-chrome-500"
        >
          Reset
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <span className="chrome-label text-chrome-500">
          Window {windowStart + 1} &middot; step {autoregressiveStep + 1}/
          {FACE_ORDER.length}
        </span>
        <div className="grid grid-cols-6 gap-1">
          {FACE_ORDER.map((face) => {
            const status = faceStatus[face];
            const bg =
              status === "active"
                ? FACE_COLOR_ACTIVE[face]
                : status === "done"
                  ? FACE_COLOR_DONE
                  : FACE_COLOR_PENDING;
            return (
              <div
                key={face}
                title={FACE_LABELS[face]}
                className="aspect-square w-full rounded-sm border border-warm-black-700"
                style={{
                  backgroundColor: bg,
                  opacity: status === "pending" ? 0.5 : 1,
                }}
              />
            );
          })}
        </div>
      </div>

      <p className="font-mono text-[10px] leading-relaxed text-chrome-500">
        Drag to orbit &middot; scroll to zoom &middot; faces light up in
        autoregressive order as each temporal window resolves.
      </p>
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-sm border border-warm-black-800 bg-warm-black-950 px-3 py-2">
      <span className="chrome-label text-chrome-500">{label}</span>
      <span className="font-mono text-chrome-200">{value}</span>
    </div>
  );
}
