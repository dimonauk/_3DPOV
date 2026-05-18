"use client";

/**
 * app/atelier/lightpaint/lightpaint/transport.tsx — Playback control
 * bar: prev / play-pause / next, FPS input, loop toggle, frame
 * counter, clear button.
 *
 * Extracted from lightpaint-client.tsx per ARCHITECTURE.md Rule 1.
 */

import { MAX_FPS, MIN_FPS, type PlayState } from "./types";

export function Transport({
  play,
  fps,
  setFps,
  loop,
  setLoop,
  frameCount,
  onPrev,
  onPlayPause,
  onNext,
  onClear,
}: {
  play: PlayState;
  fps: number;
  setFps: (n: number) => void;
  loop: boolean;
  setLoop: (v: boolean) => void;
  frameCount: number;
  onPrev: () => void;
  onPlayPause: () => void;
  onNext: () => void;
  onClear: () => void;
}) {
  return (
    <section className="flex flex-wrap items-center gap-4 rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-4 py-3">
      <button
        type="button"
        onClick={onPrev}
        className="rounded-sm border border-warm-black-700 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-300 hover:border-pink-200/60 hover:text-pink-200"
        aria-label="Previous frame"
      >
        ◀
      </button>
      <button
        type="button"
        onClick={onPlayPause}
        className="rounded-sm border border-pink-200/60 bg-pink-900/40 px-4 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-pink-100 hover:border-pink-200"
      >
        {play.kind === "playing" ? "⏸ Pause" : "▶ Play"}
      </button>
      <button
        type="button"
        onClick={onNext}
        className="rounded-sm border border-warm-black-700 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-300 hover:border-pink-200/60 hover:text-pink-200"
        aria-label="Next frame"
      >
        ▶
      </button>
      <label className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400">
        FPS
        <input
          type="number"
          min={MIN_FPS}
          max={MAX_FPS}
          step={1}
          value={fps}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (Number.isFinite(v)) {
              setFps(Math.min(MAX_FPS, Math.max(MIN_FPS, v)));
            }
          }}
          className="w-16 rounded-sm border border-warm-black-700 bg-warm-black-950 px-2 py-1 text-chrome-100"
        />
      </label>
      <label className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400">
        <input
          type="checkbox"
          checked={loop}
          onChange={(e) => setLoop(e.target.checked)}
        />
        loop
      </label>
      <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-500">
        frame {play.frame + 1} / {frameCount}
      </span>
      <button
        type="button"
        onClick={onClear}
        className="ml-auto rounded-sm border border-warm-black-700 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400 hover:border-pink-200/60 hover:text-pink-200"
      >
        Clear
      </button>
    </section>
  );
}
